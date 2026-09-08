import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chatbotconfig.uk"),
  title: {
    default: "ChatBot Config — AI support trained on your own website",
    template: "%s | ChatBot Config",
  },
  description:
    "Train a custom AI assistant on your website and documents, embed it with one line of code, and answer customers 24/7 with cited, grounded answers.",
  openGraph: {
    title: "ChatBot Config — AI support trained on your own website",
    description:
      "Train a custom AI assistant on your website and documents, embed it with one line of code, and answer customers 24/7.",
    url: "https://chatbotconfig.uk",
    siteName: "ChatBot Config",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatBot Config — AI support trained on your own website",
    description:
      "Custom-trained AI assistants that answer from your content and hand off to your team.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="ds-scrollbar min-h-full flex flex-col bg-background text-ink">
        {children}
        <CookieBanner />
        <script src="/widget-v2.js" data-bot-id="dfc234a6-7bf4-4c34-af72-a0cd5253680a" async></script>
      </body>
    </html>
  );
}
