export interface Database {
  public: {
    Tables: {
      designs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          description: string | null;
          file_type: 'image' | 'font' | 'template';
          user_id: string;
          downloads: number;
          category: 'Templates' | 'Fonts' | 'Logos' | 'Icons' | 'UI Kits';
          store_id: string | null;
          average_rating: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          description?: string | null;
          file_type: 'image' | 'font' | 'template';
          user_id: string;
          downloads?: number;
          category: 'Templates' | 'Fonts' | 'Logos' | 'Icons' | 'UI Kits';
          store_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          description?: string | null;
          file_type?: 'image' | 'font' | 'template';
          user_id?: string;
          downloads?: number;
          category?: 'Templates' | 'Fonts' | 'Logos' | 'Icons' | 'UI Kits';
          store_id?: string | null;
          average_rating?: number | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          design_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          design_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          design_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
        };
      };
      design_files: {
        Row: {
          id: string;
          created_at: string;
          design_id: string;
          file_path: string;
          file_type: 'image' | 'font' | 'template';
          display_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          design_id: string;
          file_path: string;
          file_type: 'image' | 'font' | 'template';
          display_order?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          design_id?: string;
          file_path?: string;
          file_type?: 'image' | 'font' | 'template';
          display_order?: number;
        };
      };
      design_mockups: {
        Row: {
          id: string;
          created_at: string;
          design_id: string;
          mockup_path: string;
          display_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          design_id: string;
          mockup_path: string;
          display_order?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          design_id?: string;
          mockup_path?: string;
          display_order?: number;
        };
      };
    };
  };
}