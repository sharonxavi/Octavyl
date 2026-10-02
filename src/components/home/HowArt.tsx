/**
 * The How-we-work drawing. Twelve notes that start as the mess we find at a
 * front desk and end as a running system: inputs on the left, the agent's jobs
 * in the middle, results on the right.
 *
 * The markup is the Build stage, so reduced motion and no-JS see a finished,
 * readable diagram. HowWeWork moves every piece between four stages.
 * Geometry is in viewBox units (560 x 460).
 */

export const ART_W = 560;
export const ART_H = 460;
export const PW = 104; // piece width: fits "Sunday enquiry" at the 14px phone size
export const PH = 28; // piece height
export const ROWS = [130, 180, 230, 280];
export const COL = { in: 8, rule: 228, out: 448 } as const;
export const AGENT = { x: 220, y: 112, w: 120, h: 214 } as const;

type Group = keyof typeof COL;
export type Piece = { group: Group; label: string; row: number; scatter: [number, number, number] };

// TODO: these labels are examples; change them once you know your first client's real inputs.
export const PIECES: Piece[] = [
  { group: "in", label: "Missed call", row: 0, scatter: [58, 58, -9] },
  { group: "in", label: "Sunday enquiry", row: 1, scatter: [318, 40, 7] },
  { group: "in", label: "Paper register", row: 2, scatter: [150, 236, -13] },
  { group: "in", label: "Instagram DM", row: 3, scatter: [424, 140, 11] },
  { group: "rule", label: "Answer", row: 0, scatter: [36, 330, 5] },
  { group: "rule", label: "Book", row: 1, scatter: [256, 300, -6] },
  { group: "rule", label: "Remind", row: 2, scatter: [436, 348, 14] },
  { group: "rule", label: "Hand over", row: 3, scatter: [178, 116, 6] },
  { group: "out", label: "Booked", row: 0, scatter: [440, 238, -10] },
  { group: "out", label: "Reminded", row: 1, scatter: [96, 392, -4] },
  { group: "out", label: "Replied", row: 2, scatter: [330, 398, 8] },
  { group: "out", label: "Sent to you", row: 3, scatter: [300, 186, -15] },
];

export const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const WEEK_X = [176, 246, 316, 386];
const WEEK_Y = 392;

const mid = (row: number) => ROWS[row] + PH / 2;

export function HowArt() {
  return (
    <svg className="hw-svg" viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {/* Wires: dashed while planned (Design), solid once built. */}
      <g className="hw-wires-plan">
        {ROWS.map((_, r) => (
          <g key={r}>
            <path className="h-plan" data-h="plan" d={`M${COL.in + PW},${mid(r)} H${AGENT.x}`} />
            <path className="h-plan" data-h="plan" d={`M${AGENT.x + AGENT.w},${mid(r)} H${COL.out}`} />
          </g>
        ))}
      </g>
      <g className="hw-wires-built">
        {ROWS.map((_, r) => (
          <g key={r}>
            <path className="h-wire" data-h="wire" d={`M${COL.in + PW},${mid(r)} H${AGENT.x}`} />
            <path className="h-wire" data-h="wire" d={`M${AGENT.x + AGENT.w},${mid(r)} H${COL.out}`} />
          </g>
        ))}
      </g>

      {/* The agent: a dashed outline while it's a plan, a solid block once it's built. */}
      <rect className="h-agent-plan" data-h="agent-plan" x={AGENT.x} y={AGENT.y} width={AGENT.w} height={AGENT.h} />
      <rect className="h-agent" data-h="agent" x={AGENT.x} y={AGENT.y} width={AGENT.w} height={AGENT.h} />
      <text className="h-t h-hi" data-h="agent-title" x={AGENT.x + AGENT.w / 2} y={AGENT.y - 12} textAnchor="middle">
        Your agent
      </text>

      {PIECES.map((p, i) => (
        <g key={i} className={`h-piece h-${p.group}`} data-h="piece" transform={`translate(${COL[p.group]},${ROWS[p.row]})`}>
          <rect className="h-card" width={PW} height={PH} />
          {p.group !== "in" && <rect className="h-bar" data-h={p.group === "rule" ? "bar" : "lit"} width={p.group === "out" ? PW : 3} height={PH} />}
          {p.group !== "in" && <rect className="h-scribble" data-h="scribble" x={10} y={12} width={p.group === "rule" ? 36 : 44} height={3} />}
          <text className="h-t" data-h={p.group === "in" ? undefined : "label"} x={9} y={18}>
            {p.label}
          </text>
        </g>
      ))}

      {/* Launch: messages run the wires, and the first weeks tick by. */}
      {ROWS.map((_, r) => (
        <rect key={r} className="h-msg" data-h="msg" x={COL.in + PW - 3} y={mid(r) - 3} width={6} height={6} />
      ))}
      <g data-h="weeks">
        <path className="h-week-line" d={`M${WEEK_X[0]},${WEEK_Y} H${WEEK_X[3]}`} />
        {WEEKS.map((w, i) => (
          <g key={w}>
            <rect className="h-week" x={WEEK_X[i] - 5} y={WEEK_Y - 5} width={10} height={10} />
            <rect className="h-week-on" data-h="week" x={WEEK_X[i] - 5} y={WEEK_Y - 5} width={10} height={10} />
            <text className="h-t" x={WEEK_X[i]} y={WEEK_Y + 26} textAnchor="middle">
              {w}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
