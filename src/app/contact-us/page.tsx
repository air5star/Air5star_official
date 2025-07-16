import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'

const ContactUs = () => {
  return (
    <div>
      <div className="container mx-auto px-4 py-3 my-8">
        <div className="flex flex-col items-center justify-items-center space-y-3 md:px-6">
            <Image src={"/contact-us-images/contactUs-img.jpg"} alt="contact-us" width={800} height={400} />
            {/* Contact Us Heading */}
            <h1 className="text-4xl font-medium py-5">Contact Us</h1>
            <div className='flex items-center justify-center space-x-4'>
                <div>
                    <Image src={'/contact-us-images/office.png'} alt="contact-office" width={300} height={200} />
                </div>
                <div>
                    <h2 className='text-lg font-medium'>Corporate Office</h2>
                    <p>Air5Star Cooling Technology India Pvt. Ltd.</p>
                    <p>500 Terry Francine St. San Francisco, CA 94158</p>
                    <p>
                        <a href="mailto:info.air5star@gmail.com?cc=mkshvacengineer@gmail.com">
                        info.air5star@gmail.com
                        </a>
                    </p>
                    <p>+91-7337072610</p>
                </div>
            </div>
        </div>
       </div>
    </div>
  )
}

export default ContactUs
