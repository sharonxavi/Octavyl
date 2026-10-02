/**
 * The contact form's rules, shared by the browser (instant feedback) and the
 * API route (the real check). Plain functions, no dependencies.
 */
export type ContactInput = { name: string; business: string; contact: string; message: string; company?: string };
export type ContactField = "name" | "business" | "contact" | "message";
export type ContactErrors = Partial<Record<ContactField, true>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Indian mobile or landline: 10 digits, or with a leading 0 or +91. */
export function isPhone(value: string) {
  const digits = value.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return false;
  const d = digits.replace(/^\+/, "");
  if (d.length === 12 && d.startsWith("91")) return true;
  if (d.length === 11 && d.startsWith("0")) return true;
  return d.length === 10;
}

export const isEmail = (value: string) => EMAIL.test(value.trim());

export function validateField(field: ContactField, value: string): boolean {
  const v = value.trim();
  switch (field) {
    case "name":
      return v.length >= 2 && v.length <= 80;
    case "business":
      return v.length > 0 && v.length <= 60;
    case "contact":
      return isEmail(v) || isPhone(v);
    case "message":
      return v.length >= 8 && v.length <= 2000;
  }
}

export function validateContact(input: unknown): { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors } {
  const src = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const read = (k: string) => (typeof src[k] === "string" ? (src[k] as string) : "");
  const data: ContactInput = { name: read("name"), business: read("business"), contact: read("contact"), message: read("message"), company: read("company") };
  const errors: ContactErrors = {};
  (["name", "business", "contact", "message"] as const).forEach((f) => {
    if (!validateField(f, data[f])) errors[f] = true;
  });
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/**
 * Where enquiries go. NEXT_PUBLIC_CONTACT_ENDPOINT (a form service that accepts JSON,
 * e.g. Formspree) wins; otherwise this site's own /api/contact. The static GitHub Pages
 * build has no server, so without an endpoint it reports "not sent" and the form offers WhatsApp.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || ""; // TODO: set to your form service URL for the GitHub Pages build.
const STATIC = process.env.NEXT_PUBLIC_STATIC === "true";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Browser side: send the enquiry. Resolves true when it was accepted. */
export async function sendContact(data: ContactInput): Promise<boolean> {
  const url = ENDPOINT || (STATIC ? "" : `${BASE}/api/contact`);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}
