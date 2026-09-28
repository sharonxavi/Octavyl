/** Minutes since midnight of the first day. 00:40 on the next day is 24*60+40. */
export const toMin = (hhmm: string, nextDay = false) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m + (nextDay ? 1440 : 0);
};

/** 24-hour clock text, wrapping past midnight. */
export const clock = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Spoken form for screen readers and range inputs, e.g. "9:40 pm". */
export const spoken = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${suffix}`;
};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Piecewise-linear lookup over sorted [x, y] points. */
export const piecewise = (points: ReadonlyArray<readonly [number, number]>, x: number) => {
  if (!points.length) return 0;
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return points[points.length - 1][1];
};
