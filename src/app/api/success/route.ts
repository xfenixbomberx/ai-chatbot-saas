import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Using the service role key or anon key (if RLS is off)
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // For MVP prototyping: We trust the success callback.
    // NOTE FOR PRODUCTION: You should use actual Stripe Webhooks to verify the payment signature securely!
    const { error } = await supabase
      .from("profiles")
      .update({ is_subscribed: true })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
