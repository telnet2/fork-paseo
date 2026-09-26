import { i18n } from "@/i18n/i18next";

export const APPEARANCE_NAMESPACE = "forkAppearance";

const resources = {
  en: {
    title: "Custom CSS",
    hint: "Style this desktop app or browser. Apply saves locally and takes effect immediately. Use the preset to adjust conversation width, side padding, paragraph spacing, and reasoning/tool gaps. Reset restores the original layout.",
    apply: "Apply CSS",
    preset: "Wide & compact",
    reset: "Reset CSS",
    saved: "CSS saved and applied.",
    error:
      "Could not save CSS in this browser. Check that local storage is available, then try again.",
  },
  ko: {
    title: "사용자 CSS",
    hint: "데스크톱 앱이나 브라우저의 모양을 변경합니다. 적용하면 로컬에 저장되고 즉시 반영됩니다. 프리셋으로 대화 너비, 좌우 여백, 문단 간격과 추론·도구 간격을 조절할 수 있습니다. 초기화하면 원래 레이아웃으로 돌아갑니다.",
    apply: "CSS 적용",
    preset: "넓고 촘촘하게",
    reset: "CSS 초기화",
    saved: "CSS를 저장하고 적용했습니다.",
    error: "CSS를 저장하지 못했습니다. 브라우저의 로컬 저장소를 확인한 후 다시 시도하세요.",
  },
  "zh-CN": {
    title: "自定义 CSS",
    hint: "调整此桌面应用或浏览器的样式。应用后保存在本地并立即生效。预设可调整对话宽度、左右边距、段落间距以及推理和工具摘要的间距。重置可恢复原始布局。",
    apply: "应用 CSS",
    preset: "宽屏紧凑",
    reset: "重置 CSS",
    saved: "CSS 已保存并应用。",
    error: "无法保存 CSS。请确认浏览器本地存储可用后重试。",
  },
};
for (const [locale, strings] of Object.entries(resources)) {
  i18n.addResourceBundle(locale, APPEARANCE_NAMESPACE, strings, true, false);
}
