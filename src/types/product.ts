export interface TProduct {
  id: string;
  name: string;
  imageUrl: string;
  // description: string;
  // price: number;
  category: string;
}


// These types is used for ACs
export interface AProducts {
  id: string;
  category: string;
  product_title: string;
  description: string;
  brand: string;
  mrp: number;
  price: number;
  gross_volume: string;
  energy_rating: string;
  swing: string;
  qty: number;
  imageUrl: string;
  thumbnail_images: {
    thumbnail1: string;
    thumbnail2: string;
    thumbnail3: string;
    thumbnail4: string;
  };
}

export interface SProducts {
  category: string;
  name: string;
  products: Array<{ id: number; name: string; description: string }>;
}
