import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose prose-blue text-gray-600 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-gray-900 mt-6">1. Acceptance of Terms</h2>
          <p>By accessing or using our AI Chatbot SaaS platform ("the Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.</p>
          
          <h2 className="text-xl font-bold text-gray-900 mt-6">2. Subscriptions & Billing</h2>
          <p>The Service is billed on a subscription basis. You will be billed in advance on a recurring, periodic basis. Payments are processed securely via Stripe. We reserve the right to modify our pricing at any time, with reasonable advance notice.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-6">3. Acceptable Use</h2>
          <p>You agree not to use the Service to generate malicious, illegal, or harmful content. You are responsible for the data you use to train your chatbots and must ensure you have the legal right to use such data.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-6">4. Limitation of Liability</h2>
          <p>In no event shall our company, directors, employees, or partners be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-6">5. Changes to Terms</h2>
          <p>We reserve the right to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
        </div>
      </div>
    </div>
  );
}
