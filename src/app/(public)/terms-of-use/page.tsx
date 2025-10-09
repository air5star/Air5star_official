import React from 'react';
import Link from 'next/link';

const TermsOfUsePage = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900">Terms of Use</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="mb-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Introduction</h2>
          <p>
            Welcome to Air5Star. These Terms of Use govern your use of our website and services. By accessing or using our website, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use our website.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Use of Our Website</h2>
          <p>
            You may use our website only for lawful purposes and in accordance with these Terms of Use. You agree not to use our website:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation</li>
            <li>To impersonate or attempt to impersonate Air5Star, an Air5Star employee, another user, or any other person or entity</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the website, or which may harm Air5Star or users of the website</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Products and Services</h2>
          <p>
            All products and services displayed on our website are subject to availability. Descriptions of products and services are accurate to the best of our knowledge, but we do not warrant that product descriptions or other content on the website are accurate, complete, reliable, current, or error-free. Prices for our products are subject to change without notice. We reserve the right to modify or discontinue any product or service without notice at any time.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Orders and Payments</h2>
          <p>
            When you place an order through our website, you are making an offer to purchase the products you have selected. We reserve the right to accept or decline your order for any reason. After placing an order, you will receive an email confirmation with your order details. This email is an acknowledgment that we have received your order, but it does not constitute acceptance of your order.
          </p>
          <p className="mt-2">
            Payment must be made at the time of placing your order. We accept various payment methods as indicated on our website. By providing your payment information, you represent and warrant that you have the legal right to use the payment method you provide.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Shipping and Delivery</h2>
          <p>
            We will make reasonable efforts to deliver products within the estimated delivery time indicated on our website or in the order confirmation. However, delivery times are estimates only and are not guaranteed. We are not responsible for delays in delivery due to circumstances beyond our control, including but not limited to weather conditions, transportation issues, or supplier delays.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Returns and Refunds</h2>
          <p>
            Our return and refund policy is outlined in our Shipping Policy. Please refer to our Shipping Policy for detailed information on returns, exchanges, and refunds.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Intellectual Property</h2>
          <p>
            The website and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof), are owned by Air5Star, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>
          <p className="mt-2">
            You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without our prior written consent.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Limitation of Liability</h2>
          <p>
            In no event will Air5Star, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind, under any legal theory, arising out of or in connection with your use, or inability to use, the website, any websites linked to it, any content on the website or such other websites, including any direct, indirect, special, incidental, consequential, or punitive damages, including but not limited to, personal injury, pain and suffering, emotional distress, loss of revenue, loss of profits, loss of business or anticipated savings, loss of use, loss of goodwill, loss of data, and whether caused by tort (including negligence), breach of contract, or otherwise, even if foreseeable.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Air5Star, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms of Use or your use of the website.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Changes to Terms of Use</h2>
          <p>
            We may revise and update these Terms of Use from time to time at our sole discretion. All changes are effective immediately when we post them. Your continued use of the website following the posting of revised Terms of Use means that you accept and agree to the changes.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
          <p>
            If you have any questions about these Terms of Use, please contact us at:
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

export default TermsOfUsePage;