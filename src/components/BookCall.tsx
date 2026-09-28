"use client";

import { bookHref, BOOKING_URL } from "@/content/site";
import { Magnetic } from "./Magnetic";

/** The one primary action. Always says exactly what happens. */
export function BookCall({ size = "md", className = "", wide = false }: { size?: "sm" | "md"; className?: string; wide?: boolean }) {
  const external = !BOOKING_URL || /^https?:/.test(BOOKING_URL);
  return (
    <Magnetic className={wide ? "w-full sm:w-auto" : ""}>
      <a
        href={bookHref()}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`btn btn-primary ${size === "sm" ? "btn-sm" : ""} ${wide ? "btn-lg-mobile" : ""} ${className}`}
        data-cursor="link"
      >
        <span data-magnet-label className="inline-block">
          Book a call
        </span>
      </a>
    </Magnetic>
  );
}
