import React from 'react';
import Link from 'next/link';

const ShippingPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900">Shipping Policy</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="mb-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Shipping Information</h2>
          <p>
            At Air5Star, we strive to provide reliable and efficient shipping services for all our products. This Shipping Policy outlines our shipping procedures, delivery timeframes, and related information to ensure a smooth shopping experience.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Shipping Methods and Timeframes</h2>
          <p>
            We offer the following shipping options:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li><strong>Standard Shipping:</strong> Delivery within 3-5 business days (Free for orders above ₹10,000)</li>
            <li><strong>Express Shipping:</strong> Delivery within 1-2 business days (Additional charges apply)</li>
            <li><strong>Same-Day Delivery:</strong> Available for select products in select cities (Additional charges apply)</li>
          </ul>
          <p>
            Please note that these timeframes are estimates and may vary depending on your location, product availability, and other factors. Business days are Monday through Friday, excluding public holidays.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Shipping Costs</h2>
          <p>
            Shipping costs are calculated based on the following factors:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Delivery location</li>
            <li>Shipping method selected</li>
            <li>Order value</li>
            <li>Weight and dimensions of the products</li>
          </ul>
          <p>
            The exact shipping cost will be displayed during checkout before you complete your purchase. We offer free standard shipping on orders above ₹10,000.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Order Processing</h2>
          <p>
            Orders are typically processed within 24-48 hours after payment confirmation. During peak seasons or promotional periods, order processing may take longer. Once your order is processed, you will receive a shipping confirmation email with tracking information.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Tracking Your Order</h2>
          <p>
            Once your order is shipped, you will receive a tracking number via email. You can use this tracking number to monitor the status and location of your shipment. If you have any questions about your shipment, please contact our customer service team with your order number and tracking information.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Delivery and Installation</h2>
          <p>
            For large appliances such as air conditioners, we offer professional installation services at an additional cost. Our delivery team will contact you to schedule a convenient delivery and installation time. Please ensure that someone is available at the delivery address to receive the product.
          </p>
          <p className="mt-2">
            Our installation service includes:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>Unpacking and inspection of the product</li>
            <li>Installation at the designated location</li>
            <li>Basic setup and testing</li>
            <li>Removal of packaging materials</li>
          </ul>
          <p>
            Additional installation requirements or modifications may incur extra charges.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">International Shipping</h2>
          <p>
            Currently, we only ship within India. We may expand our shipping services to international locations in the future. Please check back for updates on international shipping availability.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Returns and Exchanges</h2>
          <p>
            If you are not completely satisfied with your purchase, you may return or exchange it within 7 days of delivery, subject to the following conditions:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>The product must be in its original packaging and unused condition</li>
            <li>All accessories, manuals, and free items (if any) must be included</li>
            <li>The product must not be damaged due to misuse or negligence</li>
            <li>Proof of purchase (order number or invoice) must be provided</li>
          </ul>
          <p>
            To initiate a return or exchange, please contact our customer service team. Return shipping costs may apply unless the return is due to a defective product or our error.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Refunds</h2>
          <p>
            Once we receive and inspect the returned product, we will process your refund. Refunds will be issued to the original payment method used for the purchase. Please allow 7-10 business days for the refund to be processed and reflected in your account.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Damaged or Defective Items</h2>
          <p>
            If you receive a damaged or defective product, please contact our customer service team within 48 hours of delivery. We will arrange for a replacement or refund as appropriate. Please do not discard the original packaging until the issue is resolved.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
          <p>
            If you have any questions about our Shipping Policy, please contact us at:
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

export default ShippingPolicyPage;