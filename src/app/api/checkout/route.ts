import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser, requireOrgAccess, AuthError } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

// Server-side allowlist -- previously any client-supplied priceId was
// passed straight to Stripe, so a request could check out against an
// arbitrary price (including one not meant to be self-serve).
const ALLOWED_PRICE_IDS = new Set(
  [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
    process.env.STRIPE_PRICE_ID,
  ].filter(Boolean)
);

export async function POST(req: Request) {
  try {
    const { orgId, email, priceId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: "Missing organization" }, { status: 400 });
    }

    const user = await requireUser();
    // Billing is an owner/admin action -- editors and viewers can't start checkout.
    await requireOrgAccess(user.id, orgId, "admin");

    const selectedPrice = priceId || process.env.STRIPE_PRICE_ID;

    if (!selectedPrice) {
      return NextResponse.json({ error: "Missing Stripe Price ID" }, { status: 400 });
    }

    if (!ALLOWED_PRICE_IDS.has(selectedPrice)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPrice,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      customer_email: email,
      metadata: {
        orgId: orgId, // We store the org ID so we know which organization paid when Stripe sends the webhook
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
