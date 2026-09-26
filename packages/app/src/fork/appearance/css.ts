export const CUSTOM_CSS_KEY = "paseo.fork.custom-css.v1";

export const WIDE_COMPACT_CSS = `:root {
  --paseo-content-max-width: none;
  --paseo-content-padding: 4px;
  --paseo-paragraph-gap: 4px;
  --paseo-assistant-padding: 2px;
  --paseo-activity-gap: 0px;
  --paseo-activity-line-height: 21px;
  --paseo-warning-color: #f4bf4f;
}

[data-paseo-content="transcript"] {
  padding-left: 48px !important;
}

[data-paseo-content="transcript"] [data-paseo-activity="collapsed"] [data-paseo-activity-header] {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  border-top-width: 0 !important;
  border-bottom-width: 0 !important;
  line-height: var(--paseo-activity-line-height, 21px) !important;
}

[data-paseo-content="transcript"] [data-paseo-activity="collapsed"] [data-paseo-activity-icon] {
  height: var(--paseo-activity-line-height, 21px) !important;
}

[data-paseo-content="transcript"] [data-paseo-activity="collapsed"] [data-paseo-activity-open-file] {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
`;

// Explicit anchors avoid depending on generated Unistyles classes or DOM nesting.
// Layout fallbacks match upstream; warning color matches the notification icon.
// An empty user stylesheet removes these rules entirely.
export const TRANSCRIPT_CSS = `
[data-paseo-notification="warning"] [data-paseo-notification-text] {
  color: var(--paseo-warning-color, #f59e0b) !important;
}
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
