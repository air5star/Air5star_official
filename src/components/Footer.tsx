import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <>
      <footer
        className=" text-black pt-8 pb-4 mt-10 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('/footer-bg-img.jpg')" }}
      >
        <div className="container flex flex-col mx-auto px-5 md:px-12">
          <div className="self-start mb-6 md:mb-8">
            {/* Footer Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center">
                {/* Logo Image */}
                <Image
                  src="/A5S-logo.jpg"
                  alt="Air5Star"
                  width={110}
                  height={100}
                  className="object-contain"
                />
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col mb-6 md:mb-0">
              <p className="text-gray-400 font-medium mb-3">DISCOVER US</p>
              <Link href="/about-us" className="hover:underline mb-2">
                About Us
              </Link>
              <Link href="/contact-us" className="hover:underline mb-2">
                Contact Us
              </Link>
            </div>
            <div className="flex flex-col mb-6 md:mb-0">
              <p className="text-gray-400 font-medium mb-3">POLICY INFO</p>
              <p className="mb-2">Privacy Policy</p>
              <p className="mb-2">Terms Of Use</p>
            </div>
            <div className="flex flex-col mb-6 md:mb-0">
              <p className="text-gray-400 font-medium mb-3">SOCIAL</p>
              <p className="mb-2">Twitter</p>
              <p className="mb-2">Facebook</p>
              <p className="mb-2">YouTube</p>
              <p className="mb-2">
                <a
                  href="https://www.linkedin.com/in/air5star-cti-910984369?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                >
                  LinkedIn
                </a>
              </p>
              <p className="mb-2">Instagram</p>
            </div>
            <div className="flex flex-col mb-6 md:mb-0 md:border-l md:border-gray-600 md:pl-8">
              <p className="text-gray-400 font-medium mb-3">CORPORATE OFFICE</p>
              <p className="mb-2">
                Air5Star Cooling Technology India Pvt. Ltd.
              </p>
              <p className="mb-2">
                19-3-422/8, 1st floor Jahanuma, Hyderabad - 500053
              </p>
              <p className="mb-2">
                <a
                  href="mailto:info.air5star@gmail.com"
                  className="hover:underline"
                >
                  info.air5star@gmail.com
                </a>
              </p>
              <p className="mb-2">+91-7337072610</p>
            </div>
          </div>
          <div className="self-center mt-8 pt-4 border-t border-gray-800 w-full text-center">
            <h2 className="text-md font-medium text-gray-400">
              © 2025 by D. Jamieson.
            </h2>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
