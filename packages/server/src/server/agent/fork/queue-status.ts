import type { AgentQueueStatus } from "@getpaseo/protocol/fork/queue-status";
import type { ManagedAgent } from "../agent-manager.js";

export interface QueueStatusEvent {
  type: "queue_status";
  provider: string;
  turnId: string;
  queueStatus: AgentQueueStatus | null;
}

type QueueAgent = Pick<ManagedAgent, "lifecycle" | "activeTurnId" | "queueStatus">;

export function getActiveQueueStatus(agent: QueueAgent): AgentQueueStatus | null {
  const status = agent.queueStatus;
  if (agent.lifecycle !== "running" || !status || status.turnId !== agent.activeTurnId) {
    return null;
  }
  return status;
}

export function applyQueueStatusEvent(agent: QueueAgent, event: QueueStatusEvent): boolean {
  if (agent.lifecycle !== "running" || event.turnId !== agent.activeTurnId) return false;
  const previous = getActiveQueueStatus(agent);
  const next = event.queueStatus;
  if (
    previous?.turnId === next?.turnId &&
    previous?.state === next?.state &&
    previous?.operation === next?.operation &&
    previous?.position === next?.position &&
    previous?.message === next?.message
  ) {
    return false;
  }
  agent.queueStatus = next;
  return true;
}

interface QueueStatusDispatch {
  agent: QueueAgent;
  event: QueueStatusEvent;
  options: { fromHistory?: boolean } | undefined;
  flags: { shouldDispatchEvent: boolean; shouldNotifyWaiters: boolean };
}

export function dispatchQueueStatusEvent(
  { agent, event, options, flags }: QueueStatusDispatch,
  emitState: () => void,
): undefined {
  flags.shouldDispatchEvent = false;
  flags.shouldNotifyWaiters = false;
  if (!options?.fromHistory && applyQueueStatusEvent(agent, event)) emitState();
  return undefined;
}
