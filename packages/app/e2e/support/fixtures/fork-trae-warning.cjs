// Deterministic ACP process exercising the real Trae provider registration.
const readline = require("node:readline");
const warning =
  "Skill descriptions were shortened to fit the 2% skills context budget. TraeCode can still see every skill, but some descriptions are shorter. Disable unused skills or plugins to leave more room for the rest.";
const send = (message) =>
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n");
const update = (text, messageId) =>
  send({
    method: "session/update",
    params: {
      sessionId: "warning-session",
      update: {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text },
        ...(messageId ? { messageId } : {}),
      },
    },
  });
if (process.argv.includes("--version")) {
  process.stdout.write("Trae warning fixture\n");
} else {
  readline.createInterface({ input: process.stdin }).on("line", (line) => {
    const request = JSON.parse(line);
    if (request.id === undefined) return;
    let result = {};
    if (request.method === "initialize")
      result = { protocolVersion: 1, agentCapabilities: {}, authMethods: [] };
    if (request.method === "session/new") result = { sessionId: "warning-session" };
    if (request.method === "session/prompt") {
      update("Warning: " + warning + "\n\n");
      update(warning);
      update("Warning: this is ordinary assistant text.", "answer");
      result = { stopReason: "end_turn" };
    }
    send({ id: request.id, result });
    if (request.method === "session/new")
      send({
        method: "session/update",
        params: {
          sessionId: "warning-session",
          update: { sessionUpdate: "available_commands_update", availableCommands: [] },
        },
      });
  });
}
