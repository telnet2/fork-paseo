import { describe, expect, test, afterEach, vi } from "vitest";
import {
  AgentSideConnection,
  ClientSideConnection,
  ndJsonStream,
  PROTOCOL_VERSION,
  RequestError,
  type PromptResponse,
} from "@agentclientprotocol/sdk";
import { tmpdir } from "node:os";
import { ACPAgentSession, DEFAULT_ACP_CAPABILITIES } from "../acp-agent.js";
import { parseTraeSkillWarning } from "./trae-skill-warning.js";
import { parseTraeQueueStatus, withTraeQueueStatus } from "./trae-queue-status.js";
import { AgentManager } from "../../agent-manager.js";
import { toAgentPayload, toStoredAgentRecord } from "../../agent-projections.js";
import type { AgentClient, AgentStreamEvent } from "../../agent-sdk-types.js";
import { createTestLogger } from "../../../../test-utils/test-logger.js";
import { asInternals } from "../../../test-utils/class-mocks.js";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function setup() {
  const logger = createTestLogger();
  const session = new ACPAgentSession(
    { provider: "acp", cwd: tmpdir() },
    {
      provider: "acp",
      logger,
      defaultCommand: ["traecli", "acp", "serve"],
      defaultModes: [],
      capabilities: DEFAULT_ACP_CAPABILITIES,
      sessionInfoParser: parseTraeQueueStatus,
      notificationParser: parseTraeSkillWarning,
    },
  );
  const outgoing = new TransformStream<Uint8Array, Uint8Array>();
  const incoming = new TransformStream<Uint8Array, Uint8Array>();
  let resolvePrompt: (response: PromptResponse) => void = () => {
    throw new Error("prompt not started");
  };
  let rejectPrompt: (error: Error) => void = () => {
    throw new Error("prompt not started");
  };
  let promptCount = 0;
  const remote = new AgentSideConnection(
    () => ({
      async initialize() {
        return { protocolVersion: PROTOCOL_VERSION, agentCapabilities: {}, authMethods: [] };
      },
      async newSession() {
        return { sessionId: "trae-session" };
      },
      async authenticate() {},
      async cancel() {
        resolvePrompt({ stopReason: "cancelled" });
      },
      prompt() {
        promptCount++;
        return new Promise<PromptResponse>((resolve, reject) => {
          resolvePrompt = resolve;
          rejectPrompt = reject;
        });
      },
    }),
    ndJsonStream(incoming.writable, outgoing.readable),
  );
  const connection = new ClientSideConnection(
    () => session,
    ndJsonStream(outgoing.writable, incoming.readable),
  );
  await connection.initialize({ protocolVersion: PROTOCOL_VERSION, clientCapabilities: {} });
  const created = await connection.newSession({ cwd: tmpdir(), mcpServers: [] });
  const internals = asInternals<{ sessionId: string; connection: ClientSideConnection }>(session);
  internals.sessionId = created.sessionId;
  internals.connection = connection;
  const client: AgentClient = {
    provider: "acp",
    capabilities: DEFAULT_ACP_CAPABILITIES,
    async isAvailable() {
      return true;
    },
    async createSession() {
      return session;
    },
    async resumeSession() {
      return session;
    },
    async fetchCatalog() {
      return { models: [], modes: [] };
    },
  };
  const manager = new AgentManager({ clients: { acp: client }, logger });
  const agent = await manager.createAgent({ provider: "acp", cwd: tmpdir() }, undefined, {
    workspaceId: undefined,
  });
  cleanups.push(async () => {
    await manager.closeAgent(agent.id);
    await manager.flush();
  });
  const events: AgentStreamEvent[] = [];
  manager.subscribe(
    (event) => {
      if (event.type === "agent_stream") events.push(event.event);
    },
    { agentId: agent.id, replayState: false },
  );
  function snapshot() {
    const current = manager.getAgent(agent.id);
    if (!current) throw new Error("missing agent");
    return toAgentPayload(current);
  }
  async function start() {
    const count = promptCount;
    const iterator = manager.streamAgent(agent.id, "hello");
    const done = (async () => {
      for await (const _event of iterator) {
      }
    })();
    await vi.waitFor(() => expect(promptCount).toBe(count + 1));
    return { done };
  }
  async function queue(queueStatus: Record<string, unknown>, sessionId = created.sessionId) {
    await remote.sessionUpdate({
      sessionId,
      update: { sessionUpdate: "session_info_update", _meta: { trae: { queueStatus } } },
    });
  }
  return {
    manager,
    agent,
    session,
    events,
    snapshot,
    start,
    queue,
    async message(text: string, sessionId = created.sessionId) {
      await remote.sessionUpdate({
        sessionId,
        update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text } },
      });
    },
    complete: () => resolvePrompt({ stopReason: "end_turn" }),
    fail: () => rejectPrompt(new RequestError(-32000, "request failed")),
  };
}

describe("Trae queue through ACP and agent snapshots", () => {
  test("preserves metadata through the SDK, sends transient snapshots, and clears ready", async () => {
    const h = await setup();
    const { done } = await h.start();
    await h.queue({ state: "queued", position: null, message: null });
    await vi.waitFor(() => expect(h.snapshot().queueStatus?.state).toBe("queued"));
    await h.queue({
      state: "waiting",
      operation: "context_compaction",
      position: 0,
      message: "Capacity is limited",
    });
    await vi.waitFor(() =>
      expect(h.snapshot().queueStatus).toMatchObject({
        state: "waiting",
        position: 0,
        operation: "context_compaction",
      }),
    );
    expect(h.snapshot().status).toBe("running");
    expect(h.snapshot().queueStatus?.turnId).toBe(h.snapshot().activeTurn?.turnId);

    const reconnected: unknown[] = [];
    const unsubscribe = h.manager.subscribe(
      (event) => {
        if (event.type === "agent_state") reconnected.push(toAgentPayload(event.agent).queueStatus);
      },
      { agentId: h.agent.id, replayState: true },
    );
    expect(reconnected).toContainEqual(h.snapshot().queueStatus);
    unsubscribe();
    const current = h.manager.getAgent(h.agent.id);
    if (!current) throw new Error("missing agent");
    expect(toStoredAgentRecord(current)).not.toHaveProperty("queueStatus");
    expect(h.events.some((event) => event.type === "queue_status")).toBe(false);

    await h.queue({ state: "ready" });
    await vi.waitFor(() => expect(h.snapshot().queueStatus).toBeNull());
    h.complete();
    await done;
  });

  test.each(["complete", "cancel", "fail", "close"] as const)(
    "clears a wait on %s and ignores updates without an active turn",
    async (terminal) => {
      const h = await setup();
      await h.queue({ state: "waiting", position: 9 });
      expect(h.snapshot().queueStatus).toBeNull();
      const { done } = await h.start();
      await h.queue({ state: "waiting", position: 4 });
      await vi.waitFor(() => expect(h.snapshot().queueStatus?.position).toBe(4));
      await h.queue({ state: "waiting", position: 99 }, "unrelated-session");
      expect(h.snapshot().queueStatus?.position).toBe(4);
      if (terminal === "complete") h.complete();
      if (terminal === "cancel") await h.session.interrupt();
      if (terminal === "fail") h.fail();
      if (terminal === "close") await h.manager.closeAgent(h.agent.id);
      await done;
      const current = h.manager.getAgent(h.agent.id);
      if (current) expect(toAgentPayload(current).queueStatus).toBeNull();
      await h.queue({ state: "waiting", position: 8 });
      if (terminal !== "close") {
        expect(h.snapshot().queueStatus).toBeNull();
        const next = await h.start();
        expect(h.snapshot().queueStatus).toBeNull();
        h.complete();
        await next.done;
      }
    },
  );

  test("ignores malformed metadata and normalizes omitted fields", () => {
    const context = { provider: "acp", turnId: "turn-1" };
    for (const queueStatus of [
      null,
      {},
      { state: "unknown" },
      { state: "waiting", position: "4" },
      { state: "waiting", position: 1.5 },
    ]) {
      expect(
        parseTraeQueueStatus({
          ...context,
          update: { sessionUpdate: "session_info_update", _meta: { trae: { queueStatus } } },
        }),
      ).toEqual([]);
    }
    expect(
      parseTraeQueueStatus({
        ...context,
        update: {
          sessionUpdate: "session_info_update",
          _meta: { trae: { queueStatus: { state: "queued" } } },
        },
      }),
    ).toEqual([
      {
        type: "queue_status",
        provider: "acp",
        turnId: "turn-1",
        queueStatus: {
          turnId: "turn-1",
          state: "queued",
          operation: null,
          position: null,
          message: null,
        },
      },
    ]);
  });
});

test("enables the CLI capability without replacing user overrides", () => {
  expect(withTraeQueueStatus(["traecli", "acp", "serve"])).toEqual([
    "traecli",
    "acp",
    "serve",
    "-c",
    "features.headless_queue_status=true",
  ]);
  for (const command of [
    ["traecli", "acp", "serve", "-c", "features.headless_queue_status=false"],
    ["traecli", "--disable", "headless_queue_status", "acp", "serve"],
    ["traecli", "acp", "serve", "--config=features.headless_queue_status=true"],
  ] satisfies [string, ...string[]][])
    expect(withTraeQueueStatus(command)).toEqual(command);
  expect(withTraeQueueStatus(["traecli", "acp", "serve", "--", "value"])).toEqual([
    "traecli",
    "acp",
    "serve",
    "-c",
    "features.headless_queue_status=true",
    "--",
    "value",
  ]);
});

test("delivers startup warnings separately and preserves adjacent assistant text through ACP", async () => {
  const h = await setup();
  const warning =
    "Warning: Skill descriptions were shortened to fit the 2% skills context budget. TraeCode can still see every skill, but some descriptions are shorter. Disable unused skills or plugins to leave more room for the rest.";
  await h.message(warning + "\n\n", "another-session");
  await h.message(warning + "\n\n");
  await vi.waitFor(() => expect(h.events.filter((e) => e.type === "timeline")).toHaveLength(1));
  expect(h.events[0]).toMatchObject({
    type: "timeline",
    item: { type: "notification", level: "warning", message: warning },
  });
  const { done } = await h.start();
  await h.message("Before.");
  await h.message(warning + "\n\n");
  await h.message("After ");
  await h.message("warning.");
  h.complete();
  await done;
  const messages = h.events.flatMap((e) =>
    e.type === "timeline" && e.item.type === "assistant_message" ? [e.item] : [],
  );
  // AgentManager may coalesce adjacent deltas; assert the visible message boundaries.
  const textByMessage = new Map<string | undefined, string>();
  for (const item of messages) {
    textByMessage.set(item.messageId, (textByMessage.get(item.messageId) ?? "") + item.text);
  }
  expect([...textByMessage.values()]).toEqual(["Before.", "After warning."]);
  expect(
    h.events.filter((e) => e.type === "timeline" && e.item.type === "notification"),
  ).toHaveLength(2);
});
