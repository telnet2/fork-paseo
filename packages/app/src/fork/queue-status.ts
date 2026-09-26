import type { AgentQueueStatus } from "@getpaseo/protocol/fork/queue-status";
import { i18n } from "./queue-i18n";

export function queueStatusLabel(status: AgentQueueStatus): string {
  const compaction = status.operation === "context_compaction";
  let key: string;
  if (status.state === "queued") key = compaction ? "compactionQueued" : "queued";
  else if (status.position !== null) key = compaction ? "compactionPosition" : "position";
  else key = compaction ? "compactionWaiting" : "waiting";
  return i18n.t(key, { ns: "forkQueue", position: status.position });
}
