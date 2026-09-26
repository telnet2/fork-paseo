import type { ACPNotificationParser } from "../acp-agent.js";

// Trae core-skills/src/render.rs emits these complete notices. App-server ACP
// adds "Warning: "; legacy ACP sends the body. Neither provides severity metadata.
// Match the full known notice, not arbitrary model text beginning with Warning.
const SKILL_WARNING =
  /^Skill descriptions were shortened to fit the (?:2% )?skills context budget\. TraeCode can still see every skill, but some descriptions are shorter\. Disable unused skills or plugins to leave more room for the rest\.$/;

export const parseTraeSkillWarning: ACPNotificationParser = (update) => {
  if (update.messageId || update.content.type !== "text") return null;
  const message = update.content.text.trim();
  const body = message.startsWith("Warning: ") ? message.slice("Warning: ".length) : message;
  if (!SKILL_WARNING.test(body)) return null;
  return { type: "notification", level: "warning", message };
};
