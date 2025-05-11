export interface Design {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  file_type: 'image' | 'font' | 'template';
  user_id: string;
  downloads: number;
  category: 'Fonts' | 'Logos' | 'Templates' | 'Icons' | 'UI Kits';
  subcategory?: string;
  tags?: string[];
  store_id?: string;
  average_rating?: number;
  file_path?: string;
  mockup_path?: string;
  price?: number;
  currency?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Store {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  user_id: string;
  avatar_url: string | null;
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
}

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

export const CATEGORIES = {
  'Fonts': ['Serif', 'Sans Serif', 'Display', 'Script', 'Monospace'],
  'Logos': ['Minimal', 'Vintage', 'Abstract', 'Mascot', 'Lettermark'],
  'Templates': ['Social Media', 'Print', 'Web', 'Mobile', 'Presentation'],
  'Icons': ['Line', 'Filled', 'Duotone', 'Outline', 'Animated'],
  'UI Kits': ['Mobile', 'Dashboard', 'Landing Page', 'E-commerce', 'Components']
} as const;