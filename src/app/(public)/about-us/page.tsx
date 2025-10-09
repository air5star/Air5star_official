'use client';

import React from 'react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="container w-7xl mx-auto px-4 py-12">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold font-sans mb-6 text-center text-blue-900">
          About Air5Star
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-12 leading-relaxed">
          Welcome to <strong>Air5Star Cooling Technology Pvt Ltd</strong>, your
          one-stop destination for premium quality. We’re passionate about
          delivering top-notch products with exceptional customer service. At
          Air5Star, we combine innovation, trust, and customer satisfaction to
          redefine your online shopping experience.
        </p>

        {/* What We Offer */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              title: 'Air Conditioners',
              desc: 'Explore a wide range of energy-efficient and modern air conditioning solutions for every need.',
            },
            {
              title: 'Ventilation & Heating',
              desc: 'Ensure optimal indoor comfort with our high-performance ventilation and heating systems.',
            },
            {
              title: 'Refrigeration',
              desc: 'Advanced cooling systems for homes, industries, and commercial spaces.',
            },
            {
              title: 'HVAC Materials & Spares',
              desc: 'Complete HVAC accessories and spare parts to keep your system running smoothly.',
            },
            {
              title: 'Reliable Service',
              desc: 'We deliver not just products, but also trust, prompt service, and post-sales support.',
            },
            {
              title: 'E-commerce Convenience',
              desc: 'Shop easily and securely from the comfort of your home, with timely delivery and best prices.',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="border rounded-2xl p-6 shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                {item.title}
              </h2>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
