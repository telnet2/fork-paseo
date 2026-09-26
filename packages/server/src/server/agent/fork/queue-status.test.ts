import { expect, test } from "vitest";
import {
  applyQueueStatusEvent,
  getActiveQueueStatus,
  type QueueStatusEvent,
} from "./queue-status.js";

test("deduplicates status and refuses stale turns", () => {
  const event: QueueStatusEvent = {
    type: "queue_status",
    provider: "acp",
    turnId: "turn-1",
    queueStatus: {
      turnId: "turn-1",
      state: "waiting",
      operation: null,
      position: 4,
      message: null,
    },
  };
  const agent: Parameters<typeof applyQueueStatusEvent>[0] = {
    lifecycle: "running",
    activeTurnId: "turn-1",
    queueStatus: null,
  };
  expect(applyQueueStatusEvent(agent, event)).toBe(true);
  expect(applyQueueStatusEvent(agent, { ...event, queueStatus: { ...event.queueStatus! } })).toBe(
    false,
  );
  expect(applyQueueStatusEvent(agent, { ...event, turnId: "old-turn", queueStatus: null })).toBe(
    false,
  );
  expect(getActiveQueueStatus(agent)?.position).toBe(4);
  agent.activeTurnId = "turn-2";
  expect(getActiveQueueStatus(agent)).toBeNull();
  expect(applyQueueStatusEvent(agent, event)).toBe(false);
  agent.lifecycle = "closed";
  expect(getActiveQueueStatus(agent)).toBeNull();
});
