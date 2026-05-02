export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          avatar_color: string;
          total_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          avatar_color?: string;
          total_points?: number;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      friend_groups: {
        Row: {
          id: string;
          group_name: string;
          invite_code: string;
          creator_user_id: string;
          bad_categories: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_name: string;
          invite_code: string;
          creator_user_id: string;
          bad_categories?: string[];
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['friend_groups']['Insert']>;
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'creator' | 'member';
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'creator' | 'member';
          left_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>;
      };
      weekly_challenges: {
        Row: {
          id: string;
          group_id: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          bad_category_snapshot: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          bad_category_snapshot?: string[];
        };
        Update: Partial<Database['public']['Tables']['weekly_challenges']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          challenge_id: string;
          amount: number;
          currency: string;
          description: string;
          merchant: string;
          occurred_at: string;
          category: string | null;
          category_method: string | null;
          categorized_at: string | null;
          is_bad_spend: boolean;
          needs_review: boolean;
          source_transaction_id: string;
          raw_payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          challenge_id: string;
          amount: number;
          currency?: string;
          description: string;
          merchant: string;
          occurred_at: string;
          category?: string | null;
          category_method?: string | null;
          categorized_at?: string | null;
          is_bad_spend?: boolean;
          needs_review?: boolean;
          source_transaction_id: string;
          raw_payload?: Json;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      merchant_category_cache: {
        Row: {
          merchant: string;
          category: string;
          method: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          merchant: string;
          category: string;
          method: string;
        };
        Update: Partial<Database['public']['Tables']['merchant_category_cache']['Insert']>;
      };
      weekly_results: {
        Row: {
          id: string;
          group_id: string;
          challenge_id: string;
          user_id: string;
          final_rank: number;
          bad_spend_total: number;
          medal: 'gold' | 'silver' | 'bronze' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          challenge_id: string;
          user_id: string;
          final_rank: number;
          bad_spend_total?: number;
          medal?: 'gold' | 'silver' | 'bronze' | null;
        };
        Update: Partial<Database['public']['Tables']['weekly_results']['Insert']>;
      };
      weekly_recaps: {
        Row: {
          id: string;
          group_id: string;
          challenge_id: string;
          leaderboard_snapshot: Json;
          cumulative_graph_snapshot: Json;
          daily_breakdown: Json;
          highlights: Json;
          key_stats: Json;
          generated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          challenge_id: string;
          leaderboard_snapshot?: Json;
          cumulative_graph_snapshot?: Json;
          daily_breakdown?: Json;
          highlights?: Json;
          key_stats?: Json;
        };
        Update: Partial<Database['public']['Tables']['weekly_recaps']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
