export interface Design {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  file_type: 'image' | 'font' | 'template';
  user_id: string;
  downloads: number;
  views: number;
  category: 'SVGs' | 'Images' | 'Fonts' | 'Bundles' | 'Templates' | 'Laser Cutting' | 'Sublimation';
  subcategory?: string;
  tags?: string[];
  store_id?: string;
  average_rating?: number;
  price?: number;
  currency?: string;
  free_download: boolean;
  stores?: {
    name: string;
  } | null;
}

export interface User {
  id: string;
  email: string;
  role?: 'admin' | 'user';
}

export interface Store {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  user_id: string;
  avatar_url: string | null;
  profile_image_url: string | null;
  store_url: string | null;
  currency: string;
  payout_method: 'bank' | 'paypal' | null;
  bank_details: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
  } | null;
  paypal_email: string | null;
}

export interface Review {
  id: string;
  created_at: string;
  updated_at: string;
  design_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  user?: User;
}

export interface DesignFile {
  id: string;
  created_at: string;
  design_id: string;
  file_path: string;
  file_type: 'image' | 'font' | 'template';
  display_order: number;
  url?: string; // Optional property for frontend use
};

export interface DesignMockup {
  id: string;
  created_at: string;
  design_id: string;
  mockup_path: string;
  display_order: number;
}

export interface CategoryFilter {
  main: string;
  sub?: string;
}

export const CATEGORIES = [
  'SVGs',
  'Images',
  'Fonts',
  'Bundles',
  'Templates',
  'Laser Cutting',
  'Sublimation',
] as const;