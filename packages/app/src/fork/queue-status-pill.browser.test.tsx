import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AgentQueueStatus } from "@getpaseo/protocol/fork/queue-status";
import { QueueStatusPill } from "./queue-status-pill";
import { queueStatusLabel } from "./queue-status";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const waiting: AgentQueueStatus = {
  turnId: "turn-1",
  state: "waiting",
  operation: null,
  position: 4,
  message: "Capacity is limited",
};

const queued: AgentQueueStatus = { ...waiting, state: "queued" };

test("updates one composer chip, opens details, and removes the chip on clear", () => {
  act(() => root.render(<QueueStatusPill status={queued} />));
  expect(container.textContent).toContain("Queued");
  act(() => root.render(<QueueStatusPill status={waiting} />));
  const pill = container.querySelector('[data-testid="agent-queue-status"]');
  expect(container.querySelectorAll('[data-testid="agent-queue-status"]')).toHaveLength(1);
  expect(pill?.textContent).toContain("Queue #4");
  if (!(pill instanceof HTMLElement)) throw new Error("missing pill");
  act(() => pill.click());
  expect(document.body.textContent).toContain("Capacity is limited");
  expect(document.body.textContent).toContain("Queue position: 4");
  act(() => root.render(<QueueStatusPill status={null} />));
  expect(container.querySelector('[data-testid="agent-queue-status"]')).toBeNull();
  expect(document.body.textContent).not.toContain("Capacity is limited");
});

test("labels missing positions, zero positions, and compaction", () => {
  expect(queueStatusLabel({ ...waiting, position: null })).toBe("Waiting for capacity");
  expect(queueStatusLabel({ ...waiting, position: 0 })).toBe("Queue #0");
  expect(queueStatusLabel({ ...waiting, operation: "context_compaction" })).toBe(
    "Compaction queue #4",
  );
  expect(queueStatusLabel({ ...waiting, operation: "context_compaction", state: "queued" })).toBe(
    "Compaction queued",
  );
});
