import { Button } from '@/components/ui/button';
import Link from 'next/link';

const About = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-3 my-8">
        <div className="flex flex-col items-center justify-items-center space-y-3 md:px-6">
          {/* About Us Heading */}
          <h1 className="text-4xl font-medium">About Us</h1>
          <p>
            Welcome to Air5star Cooling Technology Pvt Ltd, your one-stop
            destination for premium quality.
            We’re passionate about delivering top-notch products with
            exceptional customer service. At Air5star Cooling Technology Pvt
            Ltd, we combine innovation, trust, and customer satisfaction to
            redefine your online shopping experience.
          </p>
            <Button className="bg-black text-white rounded-full my-3 px-8 py-6 text-sm  font-medium hover:bg-gray-800">
              <Link href="/contact-us" className="w-full">Learn More</Link>
            </Button>
        </div>
      </div>
    </>
  );
};

export default About;
