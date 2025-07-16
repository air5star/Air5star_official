import Image from 'next/image';

const Shipping = () => {
  return (
    <div className="container mx-auto px-6 py-3 my-5">
      <div className="flex flex-col md:flex-row items-center justify-center">
        <div className="w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
          <Image
            src="/shipping-imgs/warranty-filled.svg"
            alt=""
            width={100}
            height={100}
          />
          <h2 className="font-bold">Extended Warranty</h2>
          <p className="text-gray-500">
            Got a question? Look no further calls us.
          </p>
        </div>
        <div className="w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
          <Image
            src="/shipping-imgs/package.svg"
            alt=""
            width={100}
            height={100}
          />
          <h2 className="font-bold">Free Delivery</h2>
          <p className="text-gray-500">Available on all our products.</p>
        </div>
        <div className="w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
          <Image
            src="/shipping-imgs/delivery.svg"
            alt=""
            width={100}
            height={100}
          />
          <h2 className="font-bold">Same Day Shipping</h2>
          <p className="text-gray-500">Order by 4pm for same day shipping.</p>
        </div>
        <div className="w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
          <Image
            src="/shipping-imgs/easy-installment.svg"
            alt=""
            width={100}
            height={100}
          />
          <h2 className="font-bold">Easy Installment</h2>
          <p className="text-gray-500">Pay for your purchase in easy EMIs.</p>
        </div>
      </div>
    </div>
  );
};

export default Shipping;
