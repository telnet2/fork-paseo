import { i18n } from "@/i18n/i18next";
import type { SupportedLocale } from "@/i18n/locales";

const resources = {
  en: {
    queued: "Queued",
    position: "Queue #{{position}}",
    waiting: "Waiting for capacity",
    compactionQueued: "Compaction queued",
    compactionPosition: "Compaction queue #{{position}}",
    compactionWaiting: "Compaction waiting",
    compaction: "Context compaction",
    response: "Response",
    positionDetail: "Queue position: {{position}}",
  },
  ko: {
    queued: "대기열에 등록됨",
    position: "대기 순서 #{{position}}",
    waiting: "처리 용량 대기 중",
    compactionQueued: "컨텍스트 압축 대기 중",
    compactionPosition: "압축 대기 순서 #{{position}}",
    compactionWaiting: "압축 처리 대기 중",
    compaction: "컨텍스트 압축",
    response: "응답",
    positionDetail: "대기 순서: {{position}}",
  },
  "zh-CN": {
    queued: "已进入队列",
    position: "排队第 {{position}} 位",
    waiting: "等待可用容量",
    compactionQueued: "上下文压缩已排队",
    compactionPosition: "压缩排队第 {{position}} 位",
    compactionWaiting: "等待上下文压缩",
    compaction: "上下文压缩",
    response: "响应",
    positionDetail: "队列位置：{{position}}",
  },
  ja: {
    queued: "キューに登録済み",
    position: "待機順 #{{position}}",
    waiting: "空き容量を待機中",
    compactionQueued: "コンテキスト圧縮の待機中",
    compactionPosition: "圧縮の待機順 #{{position}}",
    compactionWaiting: "圧縮の空きを待機中",
    compaction: "コンテキスト圧縮",
    response: "応答",
    positionDetail: "待機順：{{position}}",
  },
  es: {
    queued: "En cola",
    position: "Cola #{{position}}",
    waiting: "Esperando capacidad",
    compactionQueued: "Compactación en cola",
    compactionPosition: "Cola de compactación #{{position}}",
    compactionWaiting: "Compactación en espera",
    compaction: "Compactación del contexto",
    response: "Respuesta",
    positionDetail: "Posición en la cola: {{position}}",
  },
  fr: {
    queued: "En file d’attente",
    position: "File #{{position}}",
    waiting: "En attente de capacité",
    compactionQueued: "Compactage en file d’attente",
    compactionPosition: "File de compactage #{{position}}",
    compactionWaiting: "Compactage en attente",
    compaction: "Compactage du contexte",
    response: "Réponse",
    positionDetail: "Position dans la file : {{position}}",
  },
  "pt-BR": {
    queued: "Na fila",
    position: "Fila #{{position}}",
    waiting: "Aguardando capacidade",
    compactionQueued: "Compactação na fila",
    compactionPosition: "Fila de compactação #{{position}}",
    compactionWaiting: "Compactação em espera",
    compaction: "Compactação de contexto",
    response: "Resposta",
    positionDetail: "Posição na fila: {{position}}",
  },
  ru: {
    queued: "В очереди",
    position: "Очередь №{{position}}",
    waiting: "Ожидание свободных ресурсов",
    compactionQueued: "Сжатие в очереди",
    compactionPosition: "Очередь сжатия №{{position}}",
    compactionWaiting: "Ожидание сжатия",
    compaction: "Сжатие контекста",
    response: "Ответ",
    positionDetail: "Позиция в очереди: {{position}}",
  },
  ar: {
    queued: "في قائمة الانتظار",
    position: "الترتيب {{position}}",
    waiting: "في انتظار سعة متاحة",
    compactionQueued: "ضغط السياق في قائمة الانتظار",
    compactionPosition: "ترتيب ضغط السياق {{position}}",
    compactionWaiting: "ضغط السياق قيد الانتظار",
    compaction: "ضغط السياق",
    response: "الاستجابة",
    positionDetail: "الموضع في قائمة الانتظار: {{position}}",
  },
} satisfies Record<
  SupportedLocale,
  Record<
    | "queued"
    | "position"
    | "waiting"
    | "compactionQueued"
    | "compactionPosition"
    | "compactionWaiting"
    | "compaction"
    | "response"
    | "positionDetail",
    string
  >
>;

// Keep fork copy out of upstream locale files while sharing its language selection.
for (const [locale, strings] of Object.entries(resources)) {
  i18n.addResourceBundle(locale, "forkQueue", strings);
}

export { i18n };
