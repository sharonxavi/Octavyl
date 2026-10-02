"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ease, MQ } from "@/lib/motion";
import { getLenis } from "@/lib/scroll";
import { CONTACT_HOME } from "@/content/home";
import { whatsappHref } from "@/content/site";
import { sendContact, validateField, type ContactErrors, type ContactField, type ContactInput } from "@/lib/contact";
import { Magnetic } from "@/components/Magnetic";

type Status = "idle" | "sending" | "failed" | "sent" | "resetting";
type Changeable = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const ORDER: ContactField[] = ["name", "business", "contact", "message"];
const EMPTY: ContactInput = { name: "", business: "", contact: "", message: "", company: "" };
const F = CONTACT_HOME.fields;
/** "Sending" stays up at least this long, so a fast reply still reads as a step. */
const MIN_SENDING_MS = 700;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const reduced = () => window.matchMedia(MQ.reduce).matches;

/** Scrolls an element into the middle of the view when it's hidden under the nav or below the fold. */
function bringIntoView(el: HTMLElement | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top >= 96 && r.bottom <= window.innerHeight - 24) return;
  const lenis = getLenis();
  const offset = -Math.round(window.innerHeight * 0.3);
  if (lenis) lenis.scrollTo(el, { offset, immediate: reduced(), force: true, duration: 0.9 });
  else window.scrollTo({ top: r.top + window.scrollY + offset, behavior: reduced() ? "auto" : "smooth" });
}

/**
 * The write-to-us form. Fields check themselves when you leave them (once
 * you've typed) and on send. Sending shows three squares; success lifts the
 * form away like a shutter to show the reply underneath; failure keeps every
 * word you typed and offers a retry or WhatsApp.
 */
export function ContactForm() {
  const root = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const failRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef<Status>("idle");
  const busy = useRef(false);

  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [dirty, setDirty] = useState<Partial<Record<ContactField, true>>>({});
  const [errors, setErrors] = useState<ContactErrors>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [failed, setFailed] = useState(false);
  const [sentName, setSentName] = useState("");
  const [sent, setSent] = useState({ message: "", contact: "" });
  const [announce, setAnnounce] = useState("");

  const sending = status === "sending";
  const panelShown = status === "sent" || status === "resetting";

  // Each change of state animates after React has committed it, so the panel is in the DOM.
  useGSAP(
    () => {
      const from = prevStatus.current;
      prevStatus.current = status;
      const form = formRef.current;
      const panel = panelRef.current;
      if (!form || !panel || from === status) return;
      const calm = reduced();

      if (status === "sent") {
        headingRef.current?.focus({ preventScroll: true });
        if (calm) {
          gsap.set(form, { visibility: "hidden" });
          // Opacity only: visibility:hidden would drop the focus we just moved to the heading.
          gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none", clearProps: "opacity" });
        } else {
          // The form rolls up from its bottom edge and uncovers the reply beneath it.
          gsap.fromTo(
            form,
            { clipPath: "inset(0% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 100% 0%)",
              duration: 0.5,
              ease: ease.shutter,
              onComplete: () => {
                gsap.set(form, { visibility: "hidden" });
              },
            }
          );
          gsap.fromTo(
            panel.querySelectorAll(".ct-success-rise"),
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6, ease: ease.arrive, stagger: 0.06, delay: 0.2, clearProps: "opacity,transform" }
          );
          // The little route: your message travels its line and lands as handled.
          const msg = panel.querySelector(".ct-sent-msg");
          const fill = panel.querySelector(".ct-sent-end i");
          const run = panel.querySelector<HTMLElement>(".ct-sent-mark")!.offsetWidth - 8;
          gsap
            .timeline({ delay: 0.45 })
            .fromTo(msg, { x: 0, autoAlpha: 1 }, { x: run, duration: 0.8, ease: ease.shutter })
            .set(msg, { autoAlpha: 0 })
            .fromTo(fill, { scale: 0 }, { scale: 1, duration: 0.45, ease: ease.settle }, "<");
        }
        requestAnimationFrame(() => bringIntoView(headingRef.current));
      }

      if (status === "resetting") {
        // The form comes back down over the reply; the reply leaves once it's covered.
        gsap.set(form, { visibility: "visible" });
        gsap.fromTo(
          form,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.55,
            ease: ease.shutter,
            onComplete: () => {
              gsap.set(form, { clearProps: "clipPath,visibility" });
              setStatus("idle");
            },
          }
        );
      }

      if (status === "idle" && (from === "resetting" || from === "sent")) {
        gsap.set(form, { clearProps: "clipPath,visibility" });
        const first = document.getElementById("ct-name");
        first?.focus({ preventScroll: true });
        bringIntoView(first);
      }

      if (status === "failed" && from === "sending" && failRef.current) {
        if (!calm) {
          gsap.fromTo(failRef.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: ease.arrive, clearProps: "opacity,visibility,transform" });
        }
        ScrollTrigger.refresh();
      }
    },
    { dependencies: [status], scope: root }
  );

  const change = (field: keyof ContactInput) => (e: React.ChangeEvent<Changeable>) => {
    const v = e.target.value;
    setValues((p) => ({ ...p, [field]: v }));
    if (field === "company") return;
    if (!dirty[field]) setDirty((d) => ({ ...d, [field]: true }));
    // A choice from the list is a finished act, so it's checked right away.
    if (field === "business") {
      setErrors((p) => ({ ...p, business: validateField("business", v) ? undefined : true }));
      return;
    }
    // A flagged field clears the moment it's fixed; new complaints wait for blur.
    if (errors[field] && validateField(field, v)) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const blur = (field: ContactField) => () => {
    if (!dirty[field] && !errors[field] && !tried) return;
    setErrors((p) => ({ ...p, [field]: validateField(field, values[field]) ? undefined : true }));
  };

  const submit = async () => {
    if (busy.current || status === "sent" || status === "resetting") return;
    const found: ContactErrors = {};
    ORDER.forEach((f) => {
      if (!validateField(f, values[f])) found[f] = true;
    });
    setErrors(found);
    setTried(true);
    const first = ORDER.find((f) => found[f]);
    if (first) {
      const el = document.getElementById(`ct-${first}`);
      el?.focus({ preventScroll: true });
      bringIntoView(el?.closest<HTMLElement>(".ct-field") ?? el);
      return;
    }

    busy.current = true;
    setStatus("sending");
    setAnnounce(CONTACT_HOME.sending);
    // Posts to /api/contact (src/app/api/contact/route.ts); connecting email or a CRM is the TODO there.
    const [ok] = await Promise.all([sendContact(values), wait(MIN_SENDING_MS)]);
    busy.current = false;
    if (ok) {
      const name = values.name.trim();
      setSentName(name);
      setSent({ message: values.message.trim(), contact: values.contact.trim() });
      setStatus("sent");
      setAnnounce(`${CONTACT_HOME.success.title.replace("{name}", name)} ${CONTACT_HOME.success.body}`);
    } else {
      setFailed(true);
      setStatus("failed");
      setAnnounce(`${CONTACT_HOME.failure.title} ${CONTACT_HOME.failure.body}`);
    }
  };

  const again = () => {
    setValues(EMPTY);
    setErrors({});
    setDirty({});
    setTried(false);
    setFailed(false);
    setAnnounce("");
    setStatus(reduced() ? "idle" : "resetting");
  };

  const describedBy = (field: ContactField, hint: boolean) =>
    [errors[field] ? `ct-${field}-error` : "", hint ? `ct-${field}-hint` : ""].filter(Boolean).join(" ") || undefined;

  const common = (field: ContactField, hint = false) => ({
    id: `ct-${field}`,
    name: field,
    value: values[field],
    onChange: change(field),
    onBlur: blur(field),
    "aria-invalid": errors[field] ? ("true" as const) : undefined,
    "aria-describedby": describedBy(field, hint),
    "aria-required": true as const,
  });

  const errorFor = (field: ContactField) =>
    errors[field] ? (
      <p id={`ct-${field}-error`} className="ct-error">
        {F[field].error}
      </p>
    ) : null;

  // The WhatsApp fallback carries over what they already typed, so nothing is written twice.
  const waText = `Hi, I'm ${values.name.trim()}. ${values.message.trim()}`; // TODO: adjust the prefilled message.

  return (
    <div ref={root} className="ct-formwrap">
      <h3 id="ct-form-title" className="ct-form-title t-h3">
        {CONTACT_HOME.formTitle}
      </h3>

      <div className="ct-stage">
        <form
          ref={formRef}
          className="ct-form"
          aria-labelledby="ct-form-title"
          noValidate
          inert={panelShown}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="ct-field" data-invalid={errors.name || undefined}>
            <label htmlFor="ct-name" className="ct-label">
              {F.name.label}
            </label>
            <input {...common("name")} type="text" className="ct-input" autoComplete="name" autoCapitalize="words" />
            {errorFor("name")}
          </div>

          <div className="ct-field" data-invalid={errors.business || undefined}>
            <label htmlFor="ct-business" className="ct-label">
              {F.business.label}
            </label>
            <div className="ct-select" data-empty={!values.business || undefined}>
              <select {...common("business")} className="ct-input">
                <option value="">{F.business.placeholder}</option>
                {F.business.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            {errorFor("business")}
          </div>

          <div className="ct-field ct-wide" data-invalid={errors.contact || undefined}>
            <label htmlFor="ct-contact" className="ct-label">
              {F.contact.label}
            </label>
            <p id="ct-contact-hint" className="ct-hint t-small">
              {F.contact.hint}
            </p>
            <input
              {...common("contact", true)}
              type="text"
              className="ct-input"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
            />
            {errorFor("contact")}
          </div>

          <div className="ct-field ct-wide" data-invalid={errors.message || undefined}>
            <label htmlFor="ct-message" className="ct-label">
              {F.message.label}
            </label>
            <p id="ct-message-hint" className="ct-hint t-small">
              {F.message.hint}
            </p>
            <textarea {...common("message", true)} className="ct-input ct-textarea" rows={4} />
            {errorFor("message")}
          </div>

          {/* Bots fill this in; people never see it. The API drops anything that has it. */}
          <div className="ct-hp" aria-hidden="true">
            <label htmlFor="ct-company">Company</label>
            <input id="ct-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={values.company} onChange={change("company")} />
          </div>

          {failed ? (
            <div ref={failRef} className="ct-failure ct-wide">
              <p className="ct-failure-title">{CONTACT_HOME.failure.title}</p>
              <p className="ct-failure-body">{CONTACT_HOME.failure.body}</p>
              <div className="ct-failure-actions">
                <button type="button" className="btn btn-quiet btn-sm" aria-disabled={sending || undefined} onClick={submit}>
                  {CONTACT_HOME.failure.retry}
                </button>
                <a className="link" href={whatsappHref(waText)} target="_blank" rel="noopener noreferrer">
                  {CONTACT_HOME.failure.whatsapp}
                </a>
              </div>
            </div>
          ) : null}

          <div className="ct-actions ct-wide">
            <Magnetic className="w-full sm:w-auto">
              <button type="submit" className="btn btn-primary btn-lg-mobile ct-submit" aria-disabled={sending || undefined}>
                <span data-magnet-label className="ct-submit-label">
                  {sending ? CONTACT_HOME.sending : CONTACT_HOME.submit}
                  {sending ? (
                    <span className="ct-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null}
                </span>
              </button>
            </Magnetic>
          </div>
        </form>

        <div ref={panelRef} className="ct-success" hidden={!panelShown}>
          <div className="ct-sent-mark ct-success-rise" aria-hidden="true">
            <span className="ct-sent-line" />
            <span className="ct-sent-msg" />
            <span className="ct-sent-end">
              <i />
            </span>
          </div>
          {/* What was sent, so the owner can see it went through as typed. */}
          <dl className="ct-sent-summary ct-success-rise">
            <div>
              <dt>You wrote</dt>
              <dd className="ct-sent-quote">&ldquo;{sent.message}&rdquo;</dd>
            </div>
            <div>
              <dt>We&apos;ll reply on</dt>
              <dd>{sent.contact}</dd>
            </div>
          </dl>
          <div className="ct-success-foot">
            <h4 ref={headingRef} tabIndex={-1} className="ct-success-title ct-success-rise">
              {CONTACT_HOME.success.title.replace("{name}", sentName)}
            </h4>
            <p className="ct-success-body ct-success-rise">{CONTACT_HOME.success.body}</p>
            <div className="ct-success-again ct-success-rise">
              <button type="button" className="btn btn-quiet" onClick={again}>
                {CONTACT_HOME.success.again}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
    </div>
  );
}
