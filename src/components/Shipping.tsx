import Image from 'next/image';

const Shipping = () => {
  return (
    <section className="bg-blue-50 py-8 md:py-12 my-8 md:my-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
          <h2 className="text-xl md:text-3xl font-semibold mb-3 md:mb-4 text-gray-900">Why Shop With Us</h2>
          <p className="text-sm md:text-base text-gray-600">
            We offer premium services to ensure your complete satisfaction
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-4 md:p-6 flex flex-col items-center justify-center text-center rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-5px]">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Image
                src="/shipping-imgs/warranty-filled.svg"
                alt="Extended Warranty"
                width={60}
                height={60}
                className="w-10 h-10 md:w-12 md:h-12"
              />
            </div>
            <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2">Extended Warranty</h3>
            <p className="text-gray-600 text-xs md:text-sm">
              Comprehensive coverage for your peace of mind
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-white p-4 md:p-6 flex flex-col items-center justify-center text-center rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-5px]">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Image
                src="/shipping-imgs/package.svg"
                alt="Free Delivery"
                width={60}
                height={60}
                className="w-10 h-10 md:w-12 md:h-12"
              />
            </div>
            <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2">Free Delivery</h3>
            <p className="text-gray-600 text-xs md:text-sm">Available on all our products nationwide</p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-white p-4 md:p-6 flex flex-col items-center justify-center text-center rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-5px]">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Image
                src="/shipping-imgs/delivery.svg"
                alt="Same Day Shipping"
                width={60}
                height={60}
                className="w-10 h-10 md:w-12 md:h-12"
              />
            </div>
            <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2">Same Day Shipping</h3>
            <p className="text-gray-600 text-xs md:text-sm">Order by 4pm for same day shipping</p>
          </div>
          
          {/* Feature 4 */}
          <div className="bg-white p-4 md:p-6 flex flex-col items-center justify-center text-center rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-5px]">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Image
                src="/shipping-imgs/easy-installment.svg"
                alt="Easy Installment"
                width={60}
                height={60}
                className="w-10 h-10 md:w-12 md:h-12"
              />
            </div>
            <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2">Easy Installment</h3>
            <p className="text-gray-600 text-xs md:text-sm">Flexible payment options with easy EMIs</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Shipping;
