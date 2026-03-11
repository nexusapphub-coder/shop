export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image: string;
  rating?: number;
  reviews?: number;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  featuredTitle: string;
  featuredSubtitle: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterDescription: string;
  footerText: string;
  // New fields
  aboutTitle?: string;
  aboutText?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  banners?: Banner[];
}
