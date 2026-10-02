import type { TradeId } from "@/content/trades";

/**
 * Words a Home link or a visitor might put in /solutions?type=, mapped to the
 * trades the sample page knows. Anything else opens the default trade.
 */
const ALIASES: Record<string, TradeId> = {
  dental: "dental",
  dentist: "dental",
  clinic: "dental",
  diagnostics: "diagnostics",
  diagnostic: "diagnostics",
  lab: "diagnostics",
  gym: "gym",
  fitness: "gym",
  salon: "salon",
  parlour: "salon",
  optician: "optician",
  optical: "optician",
  opticals: "optician",
};

export const DEFAULT_TRADE: TradeId = "dental";

export function tradeFromParam(value: string | string[] | undefined): TradeId | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return raw ? (ALIASES[raw] ?? null) : null;
}

export const solutionsHref = (id: TradeId) => `/solutions?type=${id}`;
