import { useSessionStore } from "@/stores/session-store";

export function useAgentQueueStatus(serverId: string, agentId: string) {
  return useSessionStore((state) => {
    const session = state.sessions[serverId];
    const agent = session?.agents.get(agentId) ?? session?.agentDetails.get(agentId);
    if (agent?.status !== "running" || agent.turn.phase === "idle") return null;
    const status = agent.queueStatus;
    return status?.turnId === agent.turn.turnId ? status : null;
  });
}
