import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Design File Sharing Platform.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <ul className="list-disc ml-6">
            <li>Personal information you provide when registering (such as name, email address).</li>
            <li>Content and files you upload to the platform.</li>
            <li>Usage and analytics data collected automatically.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Use of Your Information</h2>
          <ul className="list-disc ml-6">
            <li>To operate and maintain the platform.</li>
            <li>To communicate with you regarding your account or services.</li>
            <li>To improve and personalize your experience.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Sharing of Information</h2>
          <p>
            We do not sell your personal information. We may share information with service providers as needed to operate the platform, or if required by law.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Security</h2>
          <p>
            We implement reasonable security measures to protect your data. However, no system is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">6. Your Choices</h2>
          <p>
            You may update your account information at any time. You may also request deletion of your account by contacting support.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Continued use of the platform constitutes acceptance of the revised policy.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
          <p>
            For questions about this Privacy Policy, please contact us at support@designfilesharing.com.
          </p>
        </section>
      </div>
    </div>
  );
}
