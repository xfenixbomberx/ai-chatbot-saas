import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireOrgAccess, AuthError } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export async function POST(req: Request) {
  try {
    const { orgId, email } = await req.json();

    if (!orgId || !email) {
      return NextResponse.json({ error: "Missing organization or email" }, { status: 400 });
    }

    const user = await requireUser();
    await requireOrgAccess(user.id, orgId, "admin");

    const supabase = await createClient();

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", orgId)
      .single();

    let customerId = org?.stripe_customer_id;

    // Fallback: If we don't have the customer ID in DB (because we didn't use a webhook), search Stripe!
    if (!customerId) {
      const customers = await stripe.customers.list({ email: email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save it for future use -- allowed under RLS since we already
        // confirmed this user is an owner/admin of the org.
        await supabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", orgId);
      } else {
        return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
      }
    }

    // Create Stripe Billing Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Stripe Portal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
