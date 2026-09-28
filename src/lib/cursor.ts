"use client";

/** Lets a section change the cursor's state or label, e.g. the time under the pointer on the night track. */
type CursorMessage = { state?: string; label?: string };
let listener: ((m: CursorMessage) => void) | null = null;

export const cursorBus = {
  set(m: CursorMessage) {
    listener?.(m);
  },
  subscribe(fn: (m: CursorMessage) => void) {
    listener = fn;
    return () => {
      if (listener === fn) listener = null;
    };
  },
};
