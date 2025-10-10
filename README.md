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
## CI/CD: Deploy from GitHub via Cloud Build

This project includes `cloudbuild.yaml` to build and deploy to Cloud Run automatically from GitHub. Use these steps to wire it up without using local CLI:

1. Enable services (already enabled): `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`, `secretmanager.googleapis.com`, `sqladmin.googleapis.com`.
2. Create Artifact Registry repo:
   - Console → Artifact Registry → Repositories → Create
   - Name: `air5star`, Format: Docker, Location: `asia-south1`.
3. Create secrets in Secret Manager:
   - `NEXTAUTH_SECRET`: strong random base64 string
   - `DATABASE_URL`: e.g. `postgresql://appuser:<password>@localhost:5432/ecommerce?host=/cloudsql/air5star-ecommerce:asia-south1:air5star-postgres`
   - Keep special characters URL-encoded (`#` → `%23`).
4. Grant Cloud Build service account permissions:
   - Principal: `<PROJECT_NUMBER>@cloudbuild.gserviceaccount.com`
   - Roles: `roles/run.admin`, `roles/artifactregistry.writer`, `roles/secretmanager.secretAccessor`.
   - Runtime service account for Cloud Run should have `roles/cloudsql.client` to access Cloud SQL.
5. Connect GitHub repo:
   - Console → Cloud Build → Triggers → Connect repository (GitHub App)
   - Create trigger: Event: push to `main`, Config: `cloudbuild.yaml`.
6. Push to `main` (or trigger branch): Cloud Build will build the Docker image, push to Artifact Registry, and deploy to Cloud Run.

### Notes
- The deploy step sets env vars and adds Cloud SQL connection automatically.
- For the first deploy, seeding runs via `start.js` with `SEED_DB=true` and `scripts/seed-all-products.js`.
- After products are populated, set `SEED_DB=false` (update the trigger with a substitution or change `cloudbuild.yaml`).
- Update `NEXTAUTH_URL` in Cloud Run to your final HTTPS domain or service URL.
