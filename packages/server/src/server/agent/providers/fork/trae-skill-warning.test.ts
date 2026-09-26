import { expect, test } from "vitest";
import { parseTraeSkillWarning } from "./trae-skill-warning.js";

const body =
  "Skill descriptions were shortened to fit the 2% skills context budget. TraeCode can still see every skill, but some descriptions are shorter. Disable unused skills or plugins to leave more room for the rest.";

for (const percent of [true, false]) {
  for (const prefix of ["", "Warning: "]) {
    test(`recognizes a complete skill warning: percent=${percent}, prefix=${prefix}`, () => {
      const message = prefix + (percent ? body : body.replace("2% ", ""));
      expect(
        parseTraeSkillWarning({
          sessionUpdate: "agent_message_chunk",
          content: { type: "text", text: message + "\n\n" },
        }),
      ).toEqual({ type: "notification", level: "warning", message });
    });
  }
}

test("leaves model messages, partial notices, quotes and other content unchanged", () => {
  for (const text of [
    "Warning: be careful",
    "Quoted: " + body,
    body.slice(0, 80),
    body + " Here is my answer.",
    "```\n" + body + "\n```",
    "",
  ]) {
    expect(
      parseTraeSkillWarning({
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text },
      }),
    ).toBeNull();
  }
  expect(
    parseTraeSkillWarning({
      sessionUpdate: "agent_message_chunk",
      messageId: "model-message",
      content: { type: "text", text: body },
    }),
  ).toBeNull();
  expect(
    parseTraeSkillWarning({
      sessionUpdate: "agent_message_chunk",
      content: { type: "image", data: "", mimeType: "image/png" },
    }),
  ).toBeNull();
});
