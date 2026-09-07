import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // Allow max time for bulk scraping

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    // Basic API Key protection for cron jobs
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all chatbots that have a website_url
    const { data: bots, error } = await supabase
      .from("chatbots")
      .select("id, website_url")
      .not("website_url", "is", null);

    if (error) throw error;
    if (!bots || bots.length === 0) {
      return NextResponse.json({ message: "No bots to sync." });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    let successCount = 0;
    const errors: any[] = [];

    // 2. Iterate through bots and trigger retraining
    for (const bot of bots) {
      try {
        console.log(`Syncing bot ${bot.id} - ${bot.website_url}`);
        
        // Clear old vectors first
        await supabase.from("bot_documents").delete().eq("bot_id", bot.id);
        
        // Call our own train endpoint
        const trainRes = await fetch(`${protocol}://${host}/api/train`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botId: bot.id, websiteUrl: bot.website_url })
        });
        
        if (trainRes.ok) {
          successCount++;
        } else {
          const errData = await trainRes.text();
          errors.push({ botId: bot.id, error: errData });
        }
      } catch (err: any) {
        errors.push({ botId: bot.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: successCount,
      failedCount: errors.length,
      errors
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
