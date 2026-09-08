import { NextResponse } from "next/server";

// Superseded by src/app/api/stripe/webhook/route.ts, which verifies
// Stripe's signature before updating subscription state. This route used
// to trust a client-supplied userId to flip is_subscribed -- anyone who
// knew another user's id could call it directly and grant themselves a
// paid plan. Kept as a no-op so old/cached client bundles calling it don't
// hard-crash; the dashboard's ?success=true handler no longer calls this.
export async function POST() {
  return NextResponse.json(
    { success: true, note: "Subscription state is now updated via Stripe webhook." },
    { status: 200 }
  );
}
