# Air5Star HVAC E-commerce

A modern e-commerce web application for Air5Star Cooling Technology Pvt Ltd, offering premium HVAC products, air conditioners, air purifiers, washing machines, and more.

## Features

- Product catalog with categories (Air Conditioners, Air Purifiers, Washing Machines, Mobiles, etc.)
- User authentication (Google, Facebook, Apple, Email/Password)
- Responsive UI built with Next.js, React, and Tailwind CSS
- Shopping cart and checkout flow
- About Us, Contact Us, and user profile pages
- Modern UI components (cards, buttons, forms)
- Carousel banners and brand highlights

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Zod](https://zod.dev/) for schema validation
- [React Hook Form](https://react-hook-form.com/) for forms

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/hvac_ecommerce-main.git
   cd hvac_ecommerce-main/frontend
   ```

2. Install dependencies:

   ```sh
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root with the following (fill in your credentials):

   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_CLIENT_ID=your-facebook-client-id
   FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
   APPLE_CLIENT_ID=your-apple-client-id
   APPLE_CLIENT_SECRET=your-apple-client-secret
   NEXTAUTH_SECRET=your-random-secret
   ```

4. Run the development server:

   ```sh
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app/` - Next.js app directory (pages, layouts, API routes)
- `src/components/` - Reusable UI components
- `src/data.tsx` - Product data
- `src/lib/` - Utility functions and user data
- `public/` - Static assets (images, favicon, etc.)

## Customization

- Update product data in [`src/data.tsx`](src/data.tsx)
- Change branding images in [`public/`](public/)
- Update authentication providers in [`src/auth.config.ts`](src/auth.config.ts)

## Favicon

See [`public/generate-favicon.html`](public/generate-favicon.html) and [`public/favicon-instructions.html`](public/favicon-instructions.html) for instructions on generating and updating your favicon.

## License

This project is for demonstration and educational purposes. Please contact Air5Star Cooling Technology Pvt Ltd for commercial use.

---

© 2025 Air5Star Cooling Technology Pvt Ltd
