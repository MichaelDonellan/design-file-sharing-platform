export interface Design {
  id: string;
  name: string;
  description: string;
  user_id: string;
  price: number;
  category: string;
  free_download: boolean;
  created_at: string;
  updated_at: string;
  downloads: number;
  status: 'approved' | 'pending' | 'rejected';
  tags?: string[];
}

export interface DesignMockup {
  id: string;
  design_id: string;
  mockup_path: string;
  display_order: number;
}

export interface DesignFile {
  id: string;
  design_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface DesignReview {
  id: string;
  design_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  design_id: string;
  amount: number;
  created_at: string;
  payment_intent_id?: string;
}

// Constants
export const CATEGORIES = {
  'UI Kits': 'UI Kits',
  'Icons': 'Icons',
  'Illustrations': 'Illustrations',
  'Mockups': 'Mockups', 
  'Templates': 'Templates',
  'Free Downloads': 'Free Downloads'
};
