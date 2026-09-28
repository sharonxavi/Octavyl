"use client";

import { TRADES, TRADE_IDS, type TradeId } from "@/content/trades";
import { useTrade } from "./TradeProvider";

/**
 * A trade picker that reads as part of a sentence. The visible face hugs the
 * chosen word; a transparent native select sits on top for keyboard, screen
 * readers and the phone's own picker.
 */
export function TradeSelect({ label, className = "" }: { label: string; className?: string }) {
  const { tradeId, trade, setTrade } = useTrade();
  return (
    <span className={`inline-select ${className}`} data-cursor="link">
      <span className="inline-select-face" aria-hidden="true">
        {trade.label}
        <span className="caret" />
      </span>
      <select aria-label={label} value={tradeId} onChange={(e) => setTrade(e.target.value as TradeId)}>
        {TRADE_IDS.map((id) => (
          <option key={id} value={id}>
            {TRADES[id].label}
          </option>
        ))}
      </select>
    </span>
  );
}
