import React from 'react'
import Image from 'next/image'

const ContactUs = () => {
  return (
    <div>
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6 my-4 sm:my-6 md:my-8">
        <div className="flex flex-col items-center justify-items-center space-y-3 md:px-6">
            <Image src={"/contact-us-images/contactUs-img.jpg"} alt="contact-us" width={800} height={400} className="w-full max-w-full object-cover rounded-md" />
            {/* Contact Us Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium py-3 sm:py-4 md:py-5">Contact Us</h1>
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
                <div className="text-center sm:text-left mt-3 sm:mt-0">
                    <Image src={'/contact-us-images/office.png'} alt="contact-office" width={300} height={200} className="w-full max-w-[250px] sm:max-w-[300px] object-contain" />
                </div>
                <div>
                    <h2 className='text-base sm:text-lg font-medium mb-1 sm:mb-2'>Corporate Office</h2>
                    <p className="text-sm sm:text-base mb-1">Air5Star Cooling Technology India Pvt. Ltd.</p>
                    <p className="text-sm sm:text-base mb-1">19-3-422/8, 1st floor Jahanuma,</p>
                    <p className="text-sm sm:text-base mb-1">Hyderabad - 500053</p>
                    <p className="text-sm sm:text-base mb-1">
                      <a href="mailto:info.air5star@gmail.com?cc=mkshvacengineer@gmail.com" className="text-blue-600 hover:underline">
                        info.air5star@gmail.com
                      </a>
                    </p>
                    <p className="text-sm sm:text-base">+91-7337072610</p>
                </div>
            </div>
        </div>
       </div>
    </div>
  )
}

export default ContactUs
