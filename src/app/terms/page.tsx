import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Service | ChatBot Config",
  description: "The terms that govern your use of the ChatBot Config platform.",
};

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The agreement between you and ChatBot Config covering use of the platform, billing and acceptable use."
      sections={[
        {
          heading: "Acceptance of terms",
          body: 'By accessing or using our AI chatbot platform ("the Service"), you agree to be bound by these Terms. If you disagree with any part of them, you may not access the Service.',
        },
        {
          heading: "Subscriptions & billing",
          body: "The Service is billed on a subscription basis. You are billed in advance on a recurring, periodic basis, and payments are processed securely via Stripe. You may cancel or change your plan at any time from the customer portal in your dashboard. We reserve the right to modify our pricing with reasonable advance notice.",
        },
        {
          heading: "Acceptable use",
          body: "You agree not to use the Service to generate malicious, illegal or harmful content. You are responsible for the data you use to train your chatbots and must ensure you hold the legal right to use it.",
        },
        {
          heading: "Availability",
          body: "We work to keep the Service available and performant, but we do not warrant uninterrupted or error-free operation. Planned maintenance will be communicated in advance where practical.",
        },
        {
          heading: "Limitation of liability",
          body: "In no event shall our company, its directors, employees or partners be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation loss of profits, data, use or goodwill, resulting from your access to, use of, or inability to use the Service.",
        },
        {
          heading: "Changes to these terms",
          body: "We reserve the right to modify or replace these Terms at any time. By continuing to access or use the Service after revisions take effect, you agree to be bound by the revised terms.",
        },
      ]}
    />
  );
}
