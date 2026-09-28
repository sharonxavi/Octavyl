"use client";

import type { Ref } from "react";

export type RowView = {
  time: string;
  state: "free" | "preset" | "booked";
  entry?: string;
  status?: string;
  history?: string;
};

type Props = {
  id: string;
  rows: RowView[];
  header: React.ReactNode;
  /** Initial clock text. The hero rewrites it in place through clockRef. */
  clock: string;
  hours: string;
  needs: number;
  footerEnd?: React.ReactNode;
  interactive?: boolean;
  openHistory?: number | null;
  rowRef?: (i: number, el: HTMLLIElement | null) => void;
  needsRef?: Ref<HTMLSpanElement>;
  clockRef?: Ref<HTMLSpanElement>;
  shutterRef?: Ref<HTMLDivElement>;
  onFreeClick?: (i: number) => void;
  onBookedClick?: (i: number) => void;
};

/**
 * Tomorrow's appointment register: the owner's own object, drawn as a working
 * component. Used live in the hero and full in the contact section.
 */
export function RegisterView({
  id,
  rows,
  header,
  clock,
  hours,
  needs,
  footerEnd,
  interactive = false,
  openHistory = null,
  rowRef,
  needsRef,
  clockRef,
  shutterRef,
  onFreeClick,
  onBookedClick,
}: Props) {
  return (
    <div className="reg">
      <div ref={shutterRef} className="reg-shutter" aria-hidden="true">
        <div className="reg-shutter-paint">
          <span className="fd text-[0.8125rem] [font-weight:640] [--wdth:104]">{hours}</span>
        </div>
      </div>
      <div className="reg-head">
        <p className="fd text-[1.125rem] [font-weight:640] [--wdth:66]">{header}</p>
        <span ref={clockRef} className="t-data text-[1.0625rem] text-chalk" aria-hidden="true">
          {clock}
        </span>
      </div>
      <ol className="reg-rows">
        {rows.map((row, i) => {
          const historyId = `${id}-h${i}`;
          const body = (
            <>
              <span className="time t-data">{row.time}</span>
              <span className="entry">
                <span className="entry-inner">{row.state === "free" ? "Free" : row.entry}</span>
              </span>
              <span className="status">{row.status}</span>
            </>
          );
          return (
            <li
              key={row.time}
              ref={(el) => rowRef?.(i, el)}
              className={`reg-row ${openHistory === i ? "show-history" : ""}`}
              data-state={row.state}
            >
              {interactive && row.state === "free" ? (
                <button
                  type="button"
                  data-cursor="slot"
                  data-cursor-label="Book here"
                  aria-label={`Free slot at ${row.time}. Send the next request here.`}
                  onClick={() => onFreeClick?.(i)}
                >
                  {body}
                </button>
              ) : interactive && row.state === "booked" ? (
                <button type="button" aria-describedby={historyId} onClick={() => onBookedClick?.(i)}>
                  {body}
                </button>
              ) : (
                <div>{body}</div>
              )}
              {row.history && (
                <span id={historyId} role="tooltip" className="history">
                  {row.history}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="reg-foot">
        <span ref={needsRef} className={`needs ${needs > 0 ? "has-some" : ""}`}>
          Needs you <b className="fd text-[1.0625rem] [font-weight:680] [--wdth:60]">{needs}</b>
        </span>
        {footerEnd}
      </div>
    </div>
  );
}
