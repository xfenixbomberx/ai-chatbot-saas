import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Unauthorized or missing email" }, { status: 401 });
    }

    // Get the stripe_customer_id from the profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Fallback: If we don't have the customer ID in DB (because we didn't use a webhook), search Stripe!
    if (!customerId) {
      const customers = await stripe.customers.list({ email: email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save it for future use
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
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
    console.error("Stripe Portal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
