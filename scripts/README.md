# Database Seeder Scripts

This directory contains database seeder scripts to populate your HVAC e-commerce database with sample data.

## Available Seeders

### 1. Basic Product Seeder (`seed-products.js`)

Seeds the database with a basic set of products from both Air-conditioning and Ventilation categories.

**Products included:**
- 5 Air Conditioning products (Voltas, Blue Star, Daikin)
- 7 Ventilation products (Havells, Luker, Crompton)

**Run with:**
```bash
npm run seed
```

### 2. Comprehensive Product Seeder (`seed-comprehensive.js`)

Seeds the database with a more comprehensive set of products based on the data.tsx file.

**Products included:**
- 10 Air Conditioning products (Various brands and models)
- 15 Ventilation products (Various types: Exhaust Fans, Fresh Air Fans, Inline Fans, etc.)

**Run with:**
```bash
npm run seed:comprehensive
```

## Prerequisites

Before running the seeders, make sure:

1. Your database is set up and connected
2. Prisma schema is pushed to the database:
   ```bash
   npm run db:push
   ```

## What the Seeders Do

1. **Create Categories**: Creates "Air Conditioning" and "Ventilation" categories
2. **Create Products**: Adds products with complete information including:
   - Name, description, pricing
   - Brand, model, specifications
   - Images and thumbnails
   - Category associations
3. **Create Inventory**: Adds inventory records for each product with random stock quantities (10-60 units)

## Product Data Structure

Each product includes:
- Basic info (name, slug, description)
- Pricing (price, MRP)
- Brand and model information
- Technical specifications (JSON format)
- Image URLs
- Category association
- Stock status and featured flags

## Running the Seeders

### First Time Setup
```bash
# Push database schema
npm run db:push

# Run basic seeder
npm run seed

# OR run comprehensive seeder
npm run seed:comprehensive
```

### Re-running Seeders
The seeders use `upsert` operations, so they can be run multiple times safely. Existing records will be updated, and new ones will be created.

## Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push
```

## Notes

- All products are marked as "in stock" by default
- Featured products are strategically selected for homepage display
- Inventory quantities are randomly generated between 10-60 units
- Image paths reference the public directory structure
- GST is set to 18% for applicable products

## Customization

To add more products or modify existing ones:
1. Edit the respective seeder file
2. Add your product data following the existing structure
3. Run the seeder again

The seeder scripts are designed to be idempotent, so you can run them multiple times without creating duplicates.