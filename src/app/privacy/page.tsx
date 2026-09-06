import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose prose-blue text-gray-600 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-gray-900 mt-6">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including when you create an account, subscribe to our service, or communicate with us. This may include your name, email address, payment information (processed securely by Stripe), and any data you upload to train your chatbots.</p>
          
          <h2 className="text-xl font-bold text-gray-900 mt-6">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send technical notices, and respond to customer service requests.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-6">3. Chatbot Data & Lead Capture</h2>
          <p>Our chatbot widgets process conversations between your website visitors and the AI. If enabled, the widget may capture visitor email addresses. As the service provider, we store this data on your behalf, but you remain the data controller responsible for ensuring you have the right to collect this data from your users.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-6">4. Cookies and Tracking</h2>
          <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve and analyze our service.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-6">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at legal@chatbotconfig.uk.</p>
        </div>
      </div>
    </div>
  );
}
