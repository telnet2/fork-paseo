import { z } from "zod";
import type { ACPSessionInfoParser } from "../acp-agent.js";

const TraeQueueMetadataSchema = z.object({
  trae: z.object({
    queueStatus: z.object({
      state: z.enum(["queued", "waiting", "ready"]),
      operation: z.enum(["context_compaction"]).nullish(),
      position: z.number().int().nullish(),
      message: z.string().nullish(),
    }),
  }),
});

export const parseTraeQueueStatus: ACPSessionInfoParser = ({ update, provider, turnId }) => {
  const parsed = TraeQueueMetadataSchema.safeParse(update._meta);
  if (!parsed.success) return [];
  const status = parsed.data.trae.queueStatus;
  return [
    {
      type: "queue_status",
      provider,
      turnId,
      queueStatus:
        status.state === "ready"
          ? null
          : {
              turnId,
              state: status.state,
              operation: status.operation ?? null,
              position: status.position ?? null,
              message: status.message ?? null,
            },
    },
  ];
};

const QUEUE_FEATURE = "features.headless_queue_status";

// Enable the existing CLI capability for new and already saved provider commands.
// An explicit user override takes precedence, including an explicit disable.
export function withTraeQueueStatus(command: [string, ...string[]]): [string, ...string[]] {
  if (command.some((arg) => arg.includes("headless_queue_status"))) {
    return command;
  }
  const separator = command.indexOf("--");
  const offset = separator === -1 ? command.length : separator;
  const args = command.slice(1);
  args.splice(offset - 1, 0, "-c", `${QUEUE_FEATURE}=true`);
  return [command[0], ...args];
}
