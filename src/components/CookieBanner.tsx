"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-600">
        We use cookies to improve your experience, analyze traffic, and serve tailored content. By continuing to use our site, you agree to our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={handleDecline} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Decline
        </button>
        <button onClick={handleAccept} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          Accept Cookies
        </button>
      </div>
    </div>
  );
}
