import { DEMO_LINK, DEMO_TEMPLATES, type Trade } from "@/content/trades";
import { clock } from "./time";

export type Lang = "en" | "ta";
export type ShopState = "busy" | "closed";

export const shopState = (trade: Trade, minutes: number): ShopState =>
  minutes >= trade.open && minutes < trade.close ? "busy" : "closed";

/**
 * The exact reply a customer would get after a missed call.
 * A pure function of the inputs so the demo is honest: same inputs, same text.
 */
export function renderReply(trade: Trade, minutes: number, lang: Lang) {
  const state = shopState(trade, minutes);
  const template = DEMO_TEMPLATES[lang][state];
  const beforeOpening = minutes < trade.open;
  const day = lang === "en" ? (beforeOpening ? "today" : "tomorrow") : beforeOpening ? "இன்று" : "நாளை";
  const text = template
    .replace("{shop}", trade.shop)
    .replace("{reason}", trade.busyReason)
    .replace("{open}", lang === "en" ? formatOpen(trade.open) : clock(trade.open))
    .replace("{day}", day)
    .replace("{link}", DEMO_LINK);
  return { state, text };
}

const formatOpen = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
};
