export const CUSTOM_CSS_KEY = "paseo.fork.custom-css.v1";

export const WIDE_COMPACT_CSS = `:root {
  --paseo-content-max-width: none;
  --paseo-content-padding: 4px;
  --paseo-paragraph-gap: 8px;
  --paseo-assistant-padding: 4px;
  --paseo-activity-gap: 2px;
}
`;

// Explicit anchors avoid depending on generated Unistyles classes or DOM nesting.
// Fallbacks match upstream; an empty user stylesheet removes these rules entirely.
export const TRANSCRIPT_CSS = `
[data-paseo-content] {
  max-width: var(--paseo-content-max-width, 820px) !important;
}
[data-paseo-content="transcript"] {
  padding-left: var(--paseo-content-padding, 8px) !important;
  padding-right: var(--paseo-content-padding, 8px) !important;
}
[data-paseo-assistant-spacing="default"],
[data-paseo-assistant-spacing="compactBottom"] {
  padding-top: var(--paseo-assistant-padding, 12px) !important;
}
[data-paseo-assistant-spacing="default"],
[data-paseo-assistant-spacing="compactTop"] {
  padding-bottom: var(--paseo-assistant-padding, 12px) !important;
}
[data-paseo-block-gap="true"],
[data-paseo-gap="paragraph"] {
  margin-bottom: var(--paseo-paragraph-gap, 12px) !important;
}
[data-paseo-assistant-spacing] [data-paseo-markdown-tag="p"] {
  margin-bottom: var(--paseo-paragraph-gap, 12px) !important;
}
[data-paseo-gap="activity"] {
  margin-bottom: var(--paseo-activity-gap, 4px) !important;
}
`;

export function customStylesheet(css: string): string {
  return css.trim() ? `${TRANSCRIPT_CSS}\n${css}` : "";
}
