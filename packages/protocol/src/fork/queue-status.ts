import { z } from "zod";

// Transient snapshot state. A null queueStatus clears a previously displayed wait.
export const AgentQueueStatusSchema = z.object({
  turnId: z.string(),
  state: z.enum(["queued", "waiting"]),
  operation: z.enum(["context_compaction"]).nullable(),
  position: z.number().int().nullable(),
  message: z.string().nullable(),
});

export type AgentQueueStatus = z.infer<typeof AgentQueueStatusSchema>;
