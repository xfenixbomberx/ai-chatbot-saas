import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy | ChatBot Config",
  description:
    "How ChatBot Config collects, uses and protects your data and your visitors' data.",
};

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How we collect, use and protect information — yours and your website visitors'."
      sections={[
        {
          heading: "Information we collect",
          body: "We collect information you provide directly to us, including when you create an account, subscribe to our service, or communicate with us. This may include your name, email address, payment information (processed securely by Stripe), and any data you upload to train your chatbots.",
        },
        {
          heading: "How we use your information",
          body: "We use the information we collect to provide, maintain and improve our services, process transactions, send technical notices, and respond to customer service requests.",
        },
        {
          heading: "Chatbot data & lead capture",
          body: "Our chatbot widgets process conversations between your website visitors and the AI. If enabled, the widget may capture visitor email addresses. As the service provider we store this data on your behalf, but you remain the data controller responsible for ensuring you have the right to collect it from your users.",
        },
        {
          heading: "Cookies and tracking",
          body: "We use cookies and similar technologies to track activity on our service and hold certain information in order to improve and analyse it. You can accept or decline non-essential cookies using the banner shown on your first visit.",
        },
        {
          heading: "Data retention",
          body: "We retain account and conversation data for as long as your account is active. If you close your account you can request deletion of your stored data, and we will remove it other than where we are required to retain records for legal or accounting purposes.",
        },
        {
          heading: "Contact us",
          body: "If you have any questions about this Privacy Policy, or would like to exercise your data rights, please contact us at legal@chatbotconfig.uk.",
        },
      ]}
    />
  );
}
