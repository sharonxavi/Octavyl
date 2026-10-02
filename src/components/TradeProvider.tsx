"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { TRADES, type Trade, type TradeId } from "@/content/trades";
import { DEFAULT_TRADE } from "@/lib/trade-param";

type Ctx = { tradeId: TradeId; trade: Trade; setTrade: (id: TradeId) => void };
const TradeContext = createContext<Ctx | null>(null);

/**
 * One trade for the whole page: the hero, the night and the demo all follow it.
 * It starts from /solutions?type=, and changing it keeps the address shareable.
 */
export function TradeProvider({ children, initial = DEFAULT_TRADE }: { children: React.ReactNode; initial?: TradeId }) {
  const [tradeId, setTradeId] = useState<TradeId>(initial);
  const setTrade = useCallback((id: TradeId) => {
    setTradeId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("type", id);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  const value = useMemo(() => ({ tradeId, trade: TRADES[tradeId], setTrade }), [tradeId, setTrade]);
  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export function useTrade() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrade must be used inside TradeProvider");
  return ctx;
}
