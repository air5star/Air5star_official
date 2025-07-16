import Link from 'next/link';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

const UserProfilePage = () => {
  return (
    <>
    <Header />
    <div className="flex h-screen">
        <div className='w-1/4 p-4 shadow-md flex-start'>
            <ul>
                <Link href="#">
                    <li className='text-xl font-medium pb-2'>Orders</li>
                </Link>
                <Link href="#">
                    <li className='text-xl font-medium pb-2'>Wishlist</li>
                </Link>
            </ul>
        </div>
        <div className='w-3/4 p-4'>
            <div className=''>
                <h1 className="text-2xl font-bold mb-4">User Profile</h1>
            </div>
            <div className=''>
                <h1 className='text-xl'>User Name</h1>
                <div>
                    <h2>Address</h2>
                    <p>37-45/A, Ramnagar, Hyderabad, Telangana</p>
                    <p>500001</p>
                    <p>India</p>
                </div>
            </div>
        </div>
    </div>
    <Footer />
    </>
    );
    }

export default UserProfilePage;