import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      className="text-black pt-6 md:pt-10 pb-4 mt-6 md:mt-10 bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/footer-bg-img.jpg')" }}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        {/* Footer Top Section with Logo */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-8 md:mb-10">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/A5S-logo.jpg"
                alt="Air5Star"
                width={90}
                height={80}
                className="object-contain w-20 h-16 md:w-[110px] md:h-[100px]"
              />
            </Link>
          </div>
          
          {/* Newsletter Signup */}
          <div className="w-full md:w-auto md:max-w-md">
            <h3 className="text-gray-400 font-medium text-sm md:text-base mb-2">SUBSCRIBE TO OUR NEWSLETTER</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-4 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Discover Us */}
          <div className="flex flex-col">
            <h3 className="text-gray-400 font-medium text-sm md:text-base mb-3 md:mb-4">DISCOVER US</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Policy Info */}
          <div className="flex flex-col">
            <h3 className="text-gray-400 font-medium text-sm md:text-base mb-3 md:mb-4">POLICY INFO</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-use" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-refund" className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors">
                  Cancellation & Refund
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social */}
          <div className="flex flex-col">
            <h3 className="text-gray-400 font-medium text-sm md:text-base mb-3 md:mb-4">CONNECT WITH US</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://x.com/Air5starCti"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="X (Twitter)"
              >
                <Twitter className="h-5 w-5 text-blue-900" />
              </a>
              <a href="#" className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-blue-900" />
              </a>
              <a
                href="https://www.youtube.com/@Air5star"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5 text-blue-900" />
              </a>
              <a 
                href="https://www.linkedin.com/in/air5star-cti-910984369?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-blue-900" />
              </a>
              <a
                href="https://www.instagram.com/air5starcti?igsh=MWk3aGl0MzNhanBsMA=="
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-blue-900" />
              </a>
            </div>
          </div>
          
          {/* Corporate Office */}
          <div className="flex flex-col">
            <h3 className="text-gray-400 font-medium text-sm md:text-base mb-3 md:mb-4">CORPORATE OFFICE</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-900 flex-shrink-0 mt-0.5" />
                <span className="text-sm md:text-base">
                  Air5Star Cooling Technology India Pvt. Ltd.<br />
                  19-3-422/8, 1st floor Jahanuma, Hyderabad - 500053
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-900 flex-shrink-0" />
                <a
                  href="mailto:info.air5star@gmail.com"
                  className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors"
                >
                  info.air5star@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-900 flex-shrink-0" />
                <a 
                  href="tel:+917337072610" 
                  className="text-sm md:text-base hover:underline hover:text-blue-900 transition-colors"
                >
                  +91-7337072610
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="mt-8 pt-4 border-t border-gray-300 w-full text-center">
          <p className="text-xs md:text-sm text-gray-500">
            © {new Date().getFullYear()} Air5Star. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
