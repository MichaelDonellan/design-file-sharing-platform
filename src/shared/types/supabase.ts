export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      designs: {
        Row: {
          id: string;
          name: string;
          description: string;
          user_id: string;
          price: number;
          category: string;
          is_free_download: boolean;
          created_at: string;
          updated_at: string;
          downloads: number;
          status: 'approved' | 'pending' | 'rejected';
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          user_id: string;
          price?: number;
          category: string;
          is_free_download?: boolean;
          created_at?: string;
          updated_at?: string;
          downloads?: number;
          status?: 'approved' | 'pending' | 'rejected';
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          user_id?: string;
          price?: number;
          category?: string;
          is_free_download?: boolean;
          created_at?: string;
          updated_at?: string;
          downloads?: number;
          status?: 'approved' | 'pending' | 'rejected';
          tags?: string[] | null;
        };
      };
      design_mockups: {
        Row: {
          id: string;
          design_id: string;
          mockup_path: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          design_id: string;
          mockup_path: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          design_id?: string;
          mockup_path?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      design_files: {
        Row: {
          id: string;
          design_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          file_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          design_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          file_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          design_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          created_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          design_id: string;
          amount: number;
          created_at: string;
          payment_intent_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          design_id: string;
          amount: number;
          created_at?: string;
          payment_intent_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          design_id?: string;
          amount?: number;
          created_at?: string;
          payment_intent_id?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          website: string | null;
          store_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          store_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          store_name?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_download_count: {
        Args: {
          design_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
