import React from 'react';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900">Privacy Policy</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="mb-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Introduction</h2>
          <p>
            Air5Star is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Air5Star. This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
          <p>
            We collect information from you when you sign up on our site, place an order, subscribe to our newsletter, respond to a survey, fill out a form, or enter information on our site. The information we collect may include:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Personal identification information (Name, email address, phone number, etc.)</li>
            <li>Billing and shipping address</li>
            <li>Payment details</li>
            <li>Device information and browsing data</li>
            <li>Information about your preferences and purchase history</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
          <p>
            We may use the information we collect from you in the following ways:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>To personalize your experience and to deliver content and product offerings relevant to your interests</li>
            <li>To improve our website in order to better serve you</li>
            <li>To process transactions and send order confirmations</li>
            <li>To administer promotions, surveys, or other site features</li>
            <li>To send periodic emails regarding your orders or other products and services</li>
            <li>To follow up with you after correspondence (live chat, email, or phone inquiries)</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">How We Protect Your Information</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. We use secure server technology and encryption to protect your financial information. However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Cookies</h2>
          <p>
            We use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits, and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future. You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies through your browser settings.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Third-Party Disclosure</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except as described below:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Trusted third parties who assist us in operating our website, conducting our business, or servicing you</li>
            <li>Legal authorities when we believe disclosure is appropriate to comply with the law or protect our rights</li>
            <li>In the event of a merger, acquisition, or sale of all or a portion of our assets</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information. You can also object to processing of your personal information, ask us to restrict processing of your personal information, or request portability of your personal information. If we have collected and processed your personal information with your consent, you can withdraw your consent at any time. Please note that withdrawing your consent will not affect the lawfulness of any processing we conducted prior to your withdrawal, nor will it affect processing of your personal information conducted in reliance on lawful processing grounds other than consent.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> <a href="mailto:info.air5star@gmail.com" className="text-blue-600 hover:underline">info.air5star@gmail.com</a><br />
            <strong>Phone:</strong> <a href="tel:+917337072610" className="text-blue-600 hover:underline">+91-7337072610</a>
          </p>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;