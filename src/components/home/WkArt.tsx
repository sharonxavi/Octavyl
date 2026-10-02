import { TRADES, type TradeId } from "@/content/trades";

export type WkArtKind = "register" | "chat" | "calendar";

/**
 * Placeholder compositions for the case-study cards: a drawn "screen" of the thing an
 * agent touched, until real screenshots exist. Bars stand in for words, so nothing here
 * can pass for a real client's data. Decorative: the card's text carries the meaning.
 * All three share one frame, one header and one palette (rule, dim, dawn, one signal square).
 */
export function WkArt({ kind, trade }: { kind: WkArtKind; trade: TradeId }) {
  return (
    <svg className="wk-svg" viewBox="0 0 560 420" aria-hidden="true" focusable="false">
      {kind === "register" && <Register trade={trade} />}
      {kind === "chat" && <Chat />}
      {kind === "calendar" && <Calendar />}
    </svg>
  );
}

/** Frame and header bar shared by every screen. */
function Frame({ x = 0, w = 560, time }: { x?: number; w?: number; time?: string }) {
  return (
    <>
      <rect className="wk-s-frame" x={x + 0.5} y={0.5} width={w - 1} height={470} />
      <rect className="wk-s-dim" x={x + 22} y={22} width={Math.min(132, w * 0.36)} height={6} />
      {time ? (
        <text className="wk-s-text" x={x + w - 22} y={30} textAnchor="end">
          {time}
        </text>
      ) : (
        <rect className="wk-s-bar" x={x + w - 64} y={22} width={42} height={6} />
      )}
      <line className="wk-s-rule" x1={x} x2={x + w} y1={50.5} y2={50.5} />
    </>
  );
}

/** The day's register, as on /solutions: booked rows, free rows, and one slot the agent just filled. */
function Register({ trade }: { trade: TradeId }) {
  const rows = TRADES[trade].register;
  const firstFree = rows.findIndex((r, i) => !r.who && i > 1);
  const target = firstFree === -1 ? 3 : firstFree;
  const H = 46;
  return (
    <>
      <Frame time="21:42" />
      {rows.map((r, i) => {
        const y = 51 + i * H;
        const booked = !!r.who;
        const isTarget = i === target;
        const entry = booked ? 84 + ((r.who!.length * 7 + (r.what?.length ?? 0) * 5) % 110) : 30;
        return (
          <g key={r.time}>
            {isTarget && <rect className="wk-s-target" x={8.5} y={y + 4.5} width={543} height={H - 9} />}
            <text className={isTarget ? "wk-s-text wk-s-text-on" : "wk-s-text"} x={22} y={y + 28}>
              {r.time}
            </text>
            <rect
              className={isTarget ? "wk-s-dawn" : booked ? "wk-s-bar-hi" : "wk-s-bar"}
              x={96}
              y={y + 20}
              width={isTarget ? 152 : entry}
              height={6}
            />
            {booked && <rect className="wk-s-bar" x={488} y={y + 20} width={50} height={6} />}
            {isTarget && (
              <>
                <rect className="wk-s-signal" x={446} y={y + 19} width={8} height={8} />
                <rect className="wk-s-dawn" x={462} y={y + 20} width={76} height={6} />
              </>
            )}
            {i < rows.length - 1 && <line className="wk-s-rule" x1={0} x2={560} y1={y + H + 0.5} y2={y + H + 0.5} />}
          </g>
        );
      })}
    </>
  );
}

/** A WhatsApp-style thread: questions on the left, the agent's replies on the right, ticks in dawn. */
function Chat() {
  const X = 124;
  const W = 312;
  const ticks = (x: number, y: number) => (
    <path className="wk-s-tick" d={`M${x} ${y} l3.5 3.5 l6.5 -7.5 M${x + 6} ${y + 3.5} l6.5 -7.5`} />
  );
  return (
    <>
      <Frame x={X} w={W} />
      <rect className="wk-s-bar-hi" x={X + 20} y={72} width={150} height={40} />
      <rect className="wk-s-bar-hi" x={X + 20} y={120} width={108} height={40} />
      <text className="wk-s-text" x={X + 20} y={180}>
        21:42
      </text>

      <rect className="wk-s-reply" x={X + W - 20 - 168} y={196.5} width={168} height={62} />
      <rect className="wk-s-dim" x={X + W - 20 - 152} y={214} width={124} height={6} />
      <rect className="wk-s-dim" x={X + W - 20 - 152} y={230} width={88} height={6} />
      {ticks(X + W - 44, 272)}

      <rect className="wk-s-bar-hi" x={X + 20} y={296} width={132} height={40} />

      <rect className="wk-s-reply" x={X + W - 20 - 136} y={352.5} width={136} height={44} />
      <rect className="wk-s-signal" x={X + W - 20 - 136 - 18} y={370} width={8} height={8} />
      <rect className="wk-s-dim" x={X + W - 20 - 120} y={372} width={96} height={6} />
    </>
  );
}

/** A week of slots: booked earlier in rule, booked tonight in dawn, one landing now in signal. */
function Calendar() {
  const cols = 7;
  const rows = 5;
  const x0 = 22;
  const y0 = 92;
  const cw = (560 - 44) / cols;
  const ch = 62;
  const earlier = new Set(["0-1", "1-3", "2-0", "3-2", "4-4", "5-1", "6-3", "2-4", "6-0", "0-3"]);
  const tonight = new Set(["1-1", "3-0", "4-2"]);
  const landing = "5-3";
  const cells = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const key = `${c}-${r}`;
      const x = x0 + c * cw;
      const y = y0 + r * ch;
      const cls = key === landing ? "wk-s-cell-now" : tonight.has(key) ? "wk-s-cell-dawn" : earlier.has(key) ? "wk-s-cell-bar" : "wk-s-cell";
      cells.push(<rect key={key} className={cls} x={x + 3.5} y={y + 3.5} width={cw - 7} height={ch - 7} />);
      if (tonight.has(key)) cells.push(<rect key={key + "t"} className="wk-s-ink" x={x + 12} y={y + 16} width={cw * 0.46} height={5} />);
    }
  }
  return (
    <>
      <Frame time="Tue" />
      {Array.from({ length: cols }, (_, c) => (
        <rect key={c} className="wk-s-bar" x={x0 + c * cw + 4} y={70} width={22} height={5} />
      ))}
      {cells}
    </>
  );
}
