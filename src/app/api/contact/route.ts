import { NextResponse } from "next/server";
import { validateContact } from "@/lib/contact";

/**
 * Placeholder handler for the Home contact form.
 * It validates the enquiry and prints it to the server log. Nothing is emailed or stored yet.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const result = validateContact(body);
  if (!result.ok) return NextResponse.json({ ok: false, errors: result.errors }, { status: 422 });

  // A bot filled the hidden field: accept quietly and drop it.
  if (result.data.company) return NextResponse.json({ ok: true });

  // TODO: connect to email service / CRM (e.g. Resend, a Google Sheet, Zoho). Until then enquiries are only logged here.
  console.info("[contact] enquiry", { ...result.data, company: undefined, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
