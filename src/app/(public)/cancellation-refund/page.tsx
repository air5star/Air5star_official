"use client";
import Link from "next/link";

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cancellation & Refund Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">Order Cancellation</h2>
            <p className="mt-2 text-gray-700">
              Orders can be cancelled within <span className="font-medium">12 hours</span> of placement or before the order is processed for shipping, whichever is earlier. To cancel, contact us using the details below with your order ID. Once an order has been shipped, it cannot be cancelled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Refund Policy</h2>
            <p className="mt-2 text-gray-700">
              Refunds are issued to the original payment method after we receive and inspect returned items or confirm eligibility due to cancellation or order issues. Refund initiation typically occurs within <span className="font-medium">3–5 business days</span> from approval, and funds may take an additional <span className="font-medium">5–7 business days</span> to reflect depending on your bank or payment provider.
            </p>
            <ul className="mt-3 list-disc pl-6 text-gray-700">
              <li>Items must be unused, in original packaging, with all tags/accessories.</li>
              <li>Proof of purchase (order ID/invoice) is required.</li>
              <li>Refunds may be prorated for missing parts or wear-and-tear.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Exchanges</h2>
            <p className="mt-2 text-gray-700">
              Exchanges are available for eligible products subject to inventory and inspection. If an exchange is not possible, a refund may be offered per the policy above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Non‑Returnable Items</h2>
            <p className="mt-2 text-gray-700">
              Certain items are not eligible for return/refund due to hygiene, installation, or customization reasons. This includes used filters, consumables, customized ducting, and items installed by third‑party technicians. Please review product pages for specific eligibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Damaged or Defective Items</h2>
            <p className="mt-2 text-gray-700">
              If you receive a damaged or defective item, contact us within <span className="font-medium">48 hours</span> of delivery with photos/videos. We will assist with replacement, exchange, or refund based on the assessment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">How to Initiate Cancellation/Refund</h2>
            <ol className="mt-3 list-decimal pl-6 text-gray-700">
              <li>Contact us via email or phone with your order ID.</li>
              <li>Share reason and any supporting photos/videos if applicable.</li>
              <li>Follow the return shipping instructions provided by our team.</li>
              <li>Once inspected, we process refund/exchange as eligible.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Shipping & Returns</h2>
            <p className="mt-2 text-gray-700">
              For details on shipping timelines, delivery, returns and exchanges logistics, please see our <Link href="/shipping-policy" className="text-blue-600 hover:underline">Shipping Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
            <p className="mt-2 text-gray-700">
              Email: <a href="mailto:info.air5star@gmail.com" className="text-blue-600 hover:underline">info.air5star@gmail.com</a>
              <br />
              Phone: <a href="tel:+917337072610" className="text-blue-600 hover:underline">+91‑7337072610</a>
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link href="/" className="text-blue-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}