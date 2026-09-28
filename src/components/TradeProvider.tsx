"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { TRADES, type Trade, type TradeId } from "@/content/trades";

type Ctx = { tradeId: TradeId; trade: Trade; setTrade: (id: TradeId) => void };
const TradeContext = createContext<Ctx | null>(null);

/** One trade for the whole page: the hero, the night and the demo all follow it. */
export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [tradeId, setTrade] = useState<TradeId>("dental");
  const value = useMemo(() => ({ tradeId, trade: TRADES[tradeId], setTrade }), [tradeId]);
  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export function useTrade() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrade must be used inside TradeProvider");
  return ctx;
}
