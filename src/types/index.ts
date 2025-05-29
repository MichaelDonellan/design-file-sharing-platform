import { Database } from './supabase';

// Type for design from the database
type DbDesign = Database['public']['Tables']['designs']['Row'];

// Enhanced Design type with additional properties used in the app
export interface Design extends DbDesign {
  views: number;
  favorites: number;
  free_download: boolean;
  tags?: string[];
  thumbnail_url?: string;
  price: number | null;
}

// Type for store from the database
export interface Store {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  user_id: string;
  logo_url: string | null;
  banner_url: string | null;
}

// Type for review from the database
export interface Review {
  id: string;
  created_at: string;
  updated_at: string;
  design_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  user_name?: string;
  user_avatar_url?: string;
}

// Enhanced DesignMockup type with URL property
export interface DesignMockup {
  id: string;
  created_at: string;
  design_id: string;
  mockup_path: string; // Original property from DB
  display_order: number;
  url: string; // URL for frontend display
}

// Enhanced DesignFile type
export interface DesignFile {
  id: string;
  created_at: string;
  design_id: string;
  file_path: string;
  file_type: 'image' | 'font' | 'template';
  display_order: number;
  url: string; // URL for frontend display
}

// Type for ImageCarousel component props
export interface ImageCarouselProps {
  images: string[];
}
