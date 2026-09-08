import { NextResponse } from "next/server";

// Shared CORS headers for routes called cross-origin from the embedded
// widget on customer sites (api/chat, api/bot/[id], api/lead). Previously
// each route hand-rolled its own copy, and api/lead had none at all.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsOptionsResponse() {
  return NextResponse.json({}, { headers: corsHeaders });
}
