'use client';

import { products } from '@/data';
import React, { useState } from 'react';

const faqs = [
  {
    question: 'How do I place an order on Air5Star?',
    answer:
      'Simply browse our categories, select a product, and click "Add to Cart". You can review your cart and proceed to checkout using our secure payment system.',
  },
  {
    question: 'Can I cancel or modify my order after placing it?',
    answer:
      'You can cancel or request modifications within 12 hours of placing your order. After that, processing may begin and cancellation might not be possible.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 7-day return window from the date of delivery. Products must be unused, in original packaging, and include all accessories and documentation.',
  },
  {
    question: 'When will I receive my order?',
    answer:
      'Domestic product orders are delivered within 3-7 Days, and commercial products and delivered within 2-4 weeks in accordance with the manufactures norms.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept credit/debit cards, UPI, net banking, and major wallets like Paytm and PhonePe. All payments are securely processed.',
  },
  {
    question: 'Is Cash on Delivery (COD) available?',
    answer:
      'Currently, we do not offer Cash on Delivery. All orders must be prepaid through our secure checkout system.',
  },
  {
    question: 'Do you ship across India?',
    answer:
      'Yes, we offer pan-India shipping for all Air5Star products. Delivery timelines vary based on region.',
  },
  {
    question: 'Who can I contact for support?',
    answer:
      'You can reach our support team through the Contact Us page or email us at support@air5star.com for any assistance.',
  },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-4 text-center">
          FAQs
        </h1>
        <p className="text-center text-gray-600 mb-10 text-lg">
          Answers to common questions about orders, returns, shipping, payments,
          and more.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-5 shadow-sm transition-all duration-300"
            >
              <button
                onClick={() => toggleIndex(index)}
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 focus:outline-none"
              >
                <span>{faq.question}</span>
                <span className="ml-4 text-2xl text-blue-600 cursor-pointer">
                  {openIndex === index ? '-' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <p className="mt-4 text-gray-600">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
