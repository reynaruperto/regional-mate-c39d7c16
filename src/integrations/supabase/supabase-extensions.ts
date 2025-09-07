import type { Database as OriginalDatabase } from "./types";

export interface Database extends OriginalDatabase {
  public: OriginalDatabase["public"] & {
    Tables: OriginalDatabase["public"]["Tables"] & {
      country: {
        Row: { country_id: number; name: string; scheme: "417" | "462" };
        Insert: { country_id?: number; name: string; scheme: "417" | "462" };
        Update: { country_id?: number; name?: string; scheme?: "417" | "462" };
      };

      country_eligibility: {
        Row: { 
          eligibility_id: string; 
          stage_id: number; 
          country_id: number; 
          created_at?: string; 
        };
        Insert: { 
          eligibility_id?: string; 
          stage_id: number; 
          country_id: number; 
          created_at?: string; 
        };
        Update: { 
          eligibility_id?: string; 
          stage_id?: number; 
          country_id?: number; 
          created_at?: string; 
        };
      };

      visa_stage: {
        Row: { stage_id: number; sub_class: "417" | "462"; stage: number; label: string };
        Insert: { stage_id?: number; sub_class: "417" | "462"; stage: number; label: string };
        Update: { stage_id?: number; sub_class?: "417" | "462"; stage?: number; label?: string };
      };

      whv_maker: {
        Row: {
          user_id: string;
          given_name: string;
          middle_name?: string | null;
          family_name: string;
          birth_date: string;
          nationality: string;
          mobile_num?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          suburb?: string | null;
          state?: string | null;
          postcode?: string | null;
          is_profile_visible?: boolean;
          profile_photo?: string | null;
          tagline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          user_id: string;
          given_name: string;
          middle_name?: string | null;
          family_name: string;
          birth_date: string;
          nationality: string;
          mobile_num?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          suburb?: string | null;
          state?: string | null;
          postcode?: string | null;
          is_profile_visible?: boolean;
          profile_photo?: string | null;
          tagline?: string | null;
        };
        Update: {
          user_id?: string;
          given_name?: string;
          middle_name?: string | null;
          family_name?: string;
          birth_date?: string;
          nationality?: string;
          mobile_num?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          suburb?: string | null;
          state?: string | null;
          postcode?: string | null;
          is_profile_visible?: boolean;
          profile_photo?: string | null;
          tagline?: string | null;
        };
      };

      region_rules: {
        Row: {
          id: string;
          industry_name: string;
          sub_class: string;
          stage: string;
          state: string;
          area: string;
          postcode_range?: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          industry_name: string;
          sub_class: string;
          stage: string;
          state: string;
          area: string;
          postcode_range?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          industry_name?: string;
          sub_class?: string;
          stage?: string;
          state?: string;
          area?: string;
          postcode_range?: string | null;
          created_at?: string;
        };
      };

      industry: {
        Row: {
          industry_id: number;
          name: string;
        };
        Insert: {
          industry_id?: number;
          name: string;
        };
        Update: {
          industry_id?: number;
          name?: string;
        };
      };

      maker_preference: {
        Row: {
          preference_id: number;
          user_id: string;
          state?: string | null;
          suburb_city?: string | null;
          industry_id?: number | null;
          industry_role_id?: number | null;
        };
        Insert: {
          preference_id?: number;
          user_id: string;
          state?: string | null;
          suburb_city?: string | null;
          industry_id?: number | null;
          industry_role_id?: number | null;
        };
        Update: {
          preference_id?: number;
          user_id?: string;
          state?: string | null;
          suburb_city?: string | null;
          industry_id?: number | null;
          industry_role_id?: number | null;
        };
      };

      maker_visa: {
        Row: { user_id: string; visa_type: string; expiry_date: string };
        Insert: { user_id: string; visa_type: string; expiry_date: string };
        Update: { user_id?: string; visa_type?: string; expiry_date?: string };
      };
    };
  };
}