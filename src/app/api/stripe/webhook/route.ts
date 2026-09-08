import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export const runtime = "nodejs";

// Signature-verified replacement for the old api/success/route.ts, which
// trusted a client-supplied userId to flip is_subscribed with no
// verification at all. Configure this URL as a webhook endpoint in the
// Stripe dashboard (or `stripe listen --forward-to localhost:3000/api/stripe/webhook`
// locally) and put its signing secret in STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Set by api/checkout -- an organization, not a single user, is
        // the billing unit (Phase 1: teams & roles).
        const orgId = session.metadata?.orgId;
        if (!orgId) break;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        // line_items isn't included on the event payload by default -- expand it.
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });
        const priceId = fullSession.line_items?.data?.[0]?.price?.id;

        await supabase
          .from("organizations")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId ?? null,
            stripe_price_id: priceId ?? null,
            plan_tier: tierForPrice(priceId),
            plan_status: "active",
          })
          .eq("id", orgId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        const status = mapStripeStatus(subscription.status);

        await supabase
          .from("organizations")
          .update({
            plan_status: status,
            plan_tier: status === "active" ? tierForPrice(priceId) : "free",
            stripe_price_id: priceId ?? null,
          })
          .eq("stripe_customer_id", subscription.customer as string);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("organizations")
          .update({ plan_status: "canceled", plan_tier: "free" })
          .eq("stripe_customer_id", subscription.customer as string);
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handling error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function tierForPrice(priceId?: string | null): "starter" | "pro" | "enterprise" | "free" {
  if (!priceId) return "free";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE) return "enterprise";
  return "free";
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "past_due" | "inactive" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "inactive";
}
