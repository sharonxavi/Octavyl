"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TRADES, type Trade, type TradeId } from "@/content/trades";
import { DEFAULT_TRADE, tradeFromParam } from "@/lib/trade-param";

type Ctx = { tradeId: TradeId; trade: Trade; setTrade: (id: TradeId) => void };
const TradeContext = createContext<Ctx | null>(null);

/** Reads ?type= from the address. Alone in its Suspense boundary, so the rest of the page stays static. */
function TradeFromUrl({ onTrade }: { onTrade: (id: TradeId | null) => void }) {
  const params = useSearchParams();
  const type = params.get("type") ?? undefined;
  useEffect(() => {
    onTrade(tradeFromParam(type));
  }, [type, onTrade]);
  return null;
}

/**
 * One trade for the whole page: the hero, the night and the demo all follow it.
 * It starts from /solutions?type=, and changing it keeps the address shareable.
 */
export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [fromUrl, setFromUrl] = useState<TradeId | null>(null);
  const [chosen, setChosen] = useState<TradeId | null>(null);
  const tradeId = chosen ?? fromUrl ?? DEFAULT_TRADE;
  const setTrade = useCallback((id: TradeId) => {
    setChosen(id);
    const url = new URL(window.location.href);
    url.searchParams.set("type", id);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  const value = useMemo(() => ({ tradeId, trade: TRADES[tradeId], setTrade }), [tradeId, setTrade]);
  return (
    <TradeContext.Provider value={value}>
      <Suspense fallback={null}>
        <TradeFromUrl onTrade={setFromUrl} />
      </Suspense>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrade() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrade must be used inside TradeProvider");
  return ctx;
}
