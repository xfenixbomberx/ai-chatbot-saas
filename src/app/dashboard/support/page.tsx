import { Mail, MessageCircle, FileText } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-2">We are here to help you get the most out of your AI assistants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Email Support */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Email Support</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Have a technical issue or billing question? Send us an email and our team will get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@chatbotconfig.uk"
            className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* Sales & Custom Plans */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Sales & Custom Plans</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Need a higher message limit or custom AI development? Let's chat about a custom enterprise plan.
          </p>
          <a
            href="mailto:sales@chatbotconfig.uk"
            className="mt-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">How do I train my chatbot?</h3>
          <p className="text-gray-600 text-sm">
            You can train your chatbot in the dashboard by providing a website URL to scrape, or by uploading a PDF document. The AI will automatically read the data and use it to answer questions.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">How do I embed the widget on my site?</h3>
          <p className="text-gray-600 text-sm">
            Under the "Training & Integration" tab of your bot, copy the 1-line HTML snippet and paste it just before the closing <code>&lt;/body&gt;</code> tag of your website.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">How does lead capture work?</h3>
          <p className="text-gray-600 text-sm">
            If a user asks a question, the bot will automatically ask for their email address after a short delay. If the user provides it, the lead will appear in your "Leads" tab.
          </p>
        </div>

      </div>
    </div>
  );
}
