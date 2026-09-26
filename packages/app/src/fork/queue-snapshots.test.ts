import { expect, test } from "vitest";
import { AgentSnapshotPayloadSchema } from "@getpaseo/protocol/messages";
import { normalizeAgentSnapshot, projectAgentSnapshot } from "@/utils/agent-snapshots";

const snapshot = AgentSnapshotPayloadSchema.parse({
  id: "agent-1",
  provider: "acp",
  cwd: "/repo",
  model: null,
  createdAt: "2026-09-27T00:00:00Z",
  updatedAt: "2026-09-27T00:00:00Z",
  lastUserMessageAt: null,
  status: "running",
  activeTurn: { turnId: "turn-1", startedAt: null },
  capabilities: {
    supportsStreaming: true,
    supportsSessionPersistence: true,
    supportsDynamicModes: true,
    supportsMcpServers: true,
    supportsReasoningStream: true,
    supportsToolInvocations: true,
  },
  currentModeId: null,
  availableModes: [],
  pendingPermissions: [],
  persistence: null,
  title: null,
});
const queueStatus = {
  turnId: "turn-1",
  state: "waiting" as const,
  operation: null,
  position: 0,
  message: null,
};

test("preserves queue status through client snapshot normalization and projection", () => {
  const wire = AgentSnapshotPayloadSchema.parse({ ...snapshot, queueStatus });
  const agent = normalizeAgentSnapshot(wire, "host");
  expect(agent.queueStatus).toEqual(queueStatus);
  expect(projectAgentSnapshot(agent).queueStatus).toEqual(queueStatus);
});

test("explicit clears and old-daemon snapshots remove previously cached status", () => {
  const cached = normalizeAgentSnapshot({ ...snapshot, queueStatus }, "host");
  for (const update of [snapshot, { ...snapshot, queueStatus: null }]) {
    const merged = { ...cached, ...normalizeAgentSnapshot(update, "host") };
    expect(merged.queueStatus).toBeNull();
  }
});
