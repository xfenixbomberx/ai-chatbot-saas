import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { category, message, replyTo } = await req.json();

    if (!message || !replyTo) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "AI Support Form <onboarding@resend.dev>",
        to: "jordanpotter41@gmail.com",
        reply_to: replyTo,
        subject: `New ${category} Request from Dashboard`,
        html: `<p><strong>Category:</strong> ${category}</p>
               <p><strong>From:</strong> ${replyTo}</p>
               <p><strong>Message:</strong></p>
               <blockquote>${message}</blockquote>`
      })
    });

    if (!resendRes.ok) {
      throw new Error("Failed to send email via Resend");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Support form error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
