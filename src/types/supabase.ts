// Auto-generated from Supabase export (tables, views, enums)
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
      country: {
        Row: {
          country_id: number;
          name: string;
          scheme: string;
        };
        Insert: {
          country_id?: number;
          name: string;
          scheme: string;
        };
        Update: {
          country_id?: number;
          name?: string;
          scheme?: string;
        };
      };

      country_eligibility: {
        Row: {
          eligibility_id: string;
          country_id: number;
          stage_id: number;
          created_at: string | null;
          id: number;
        };
        Insert: {
          eligibility_id?: string;
          country_id: number;
          stage_id: number;
          created_at?: string | null;
          id?: number;
        };
        Update: {
          eligibility_id?: string;
          country_id?: number;
          stage_id?: number;
          created_at?: string | null;
          id?: number;
        };
      };

      employer: {
        Row: {
          user_id: string;
          company_name: string;
          abn: string | null;
          contact_name: string;
          email: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          company_name: string;
          abn?: string | null;
          contact_name: string;
          email: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          company_name?: string;
          abn?: string | null;
          contact_name?: string;
          email?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      employer_facility: {
        Row: {
          facility_id: number;
          employer_id: string;
          name: string;
          address: string | null;
          created_at: string | null;
        };
        Insert: {
          facility_id?: number;
          employer_id: string;
          name: string;
          address?: string | null;
          created_at?: string | null;
        };
        Update: {
          facility_id?: number;
          employer_id?: string;
          name?: string;
          address?: string | null;
          created_at?: string | null;
        };
      };

      employer_role: {
        Row: {
          employer_role_id: number;
          employer_id: string;
          role: string;
        };
        Insert: {
          employer_role_id?: number;
          employer_id: string;
          role: string;
        };
        Update: {
          employer_role_id?: number;
          employer_id?: string;
          role?: string;
        };
      };

      facility: {
        Row: {
          facility_id: number;
          name: string;
        };
        Insert: {
          facility_id?: number;
          name: string;
        };
        Update: {
          facility_id?: number;
          name?: string;
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

      industry_role: {
        Row: {
          industry_role_id: number;
          industry_id: number;
          role: string;
        };
        Insert: {
          industry_role_id?: number;
          industry_id: number;
          role: string;
        };
        Update: {
          industry_role_id?: number;
          industry_id?: number;
          role?: string;
        };
      };
      job: {
        Row: {
          job_id: number;
          employer_id: string;
          title: string;
          description: string | null;
          location: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          job_id?: number;
          employer_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          job_id?: number;
          employer_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      job_license: {
        Row: {
          job_license_id: number;
          job_id: number;
          license_id: number;
        };
        Insert: {
          job_license_id?: number;
          job_id: number;
          license_id: number;
        };
        Update: {
          job_license_id?: number;
          job_id?: number;
          license_id?: number;
        };
      };

      license: {
        Row: {
          license_id: number;
          name: string;
        };
        Insert: {
          license_id?: number;
          name: string;
        };
        Update: {
          license_id?: number;
          name?: string;
        };
      };

      likes: {
        Row: {
          like_id: number;
          user_id: string;
          job_id: number;
          created_at: string | null;
        };
        Insert: {
          like_id?: number;
          user_id: string;
          job_id: number;
          created_at?: string | null;
        };
        Update: {
          like_id?: number;
          user_id?: string;
          job_id?: number;
          created_at?: string | null;
        };
      };

      maker_license: {
        Row: {
          maker_license_id: number;
          user_id: string;
          license_id: number;
        };
        Insert: {
          maker_license_id?: number;
          user_id: string;
          license_id: number;
        };
        Update: {
          maker_license_id?: number;
          user_id?: string;
          license_id?: number;
        };
      };

      maker_reference: {
        Row: {
          reference_id: number;
          user_id: string;
          name: string;
          business_name: string | null;
          email: string | null;
        };
        Insert: {
          reference_id?: number;
          user_id: string;
          name: string;
          business_name?: string | null;
          email?: string | null;
        };
        Update: {
          reference_id?: number;
          user_id?: string;
          name?: string;
          business_name?: string | null;
          email?: string | null;
        };
      };

      maker_visa: {
        Row: {
          user_id: string;
          visa_type: string;
          expiry_date: string;
        };
        Insert: {
          user_id: string;
          visa_type: string;
          expiry_date: string;
        };
        Update: {
          user_id?: string;
          visa_type?: string;
          expiry_date?: string;
        };
      };

      maker_preference: {
        Row: {
          preference_id: number;
          user_id: string;
          industry_id: number | null;
          industry_role_id: number | null;
          state: string | null;
          suburb_city: string | null;
        };
        Insert: {
          preference_id?: number;
          user_id: string;
          industry_id?: number | null;
          industry_role_id?: number | null;
          state?: string | null;
          suburb_city?: string | null;
        };
        Update: {
          preference_id?: number;
          user_id?: string;
          industry_id?: number | null;
          industry_role_id?: number | null;
          state?: string | null;
          suburb_city?: string | null;
        };
      };

      maker_work_experience: {
        Row: {
          work_experience_id: number;
          user_id: string;
          position: string;
          company: string;
          industry: string | null;
          location: string | null;
          description: string | null;
          start_date: string;
          end_date: string | null;
        };
        Insert: {
          work_experience_id?: number;
          user_id: string;
          position: string;
          company: string;
          industry?: string | null;
          location?: string | null;
          description?: string | null;
          start_date: string;
          end_date?: string | null;
        };
        Update: {
          work_experience_id?: number;
          user_id?: string;
          position?: string;
          company?: string;
          industry?: string | null;
          location?: string | null;
          description?: string | null;
          start_date?: string;
          end_date?: string | null;
        };
      };
      matches: {
        Row: {
          match_id: number;
          user_id: string;
          job_id: number;
          score: number;
          created_at: string | null;
        };
        Insert: {
          match_id?: number;
          user_id: string;
          job_id: number;
          score: number;
          created_at?: string | null;
        };
        Update: {
          match_id?: number;
          user_id?: string;
          job_id?: number;
          score?: number;
          created_at?: string | null;
        };
      };

      matching_score: {
        Row: {
          score_id: number;
          job_id: number;
          user_id: string;
          score: number;
        };
        Insert: {
          score_id?: number;
          job_id: number;
          user_id: string;
          score: number;
        };
        Update: {
          score_id?: number;
          job_id?: number;
          user_id?: string;
          score?: number;
        };
      };

      profile: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          user_type: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          user_type: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          user_type?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      region_postcode: {
        Row: {
          id: number;
          state: string;
          region: string | null;
          postcode: string;
        };
        Insert: {
          id?: number;
          state: string;
          region?: string | null;
          postcode: string;
        };
        Update: {
          id?: number;
          state?: string;
          region?: string | null;
          postcode?: string;
        };
      };

      visa_stage: {
        Row: {
          stage_id: number;
          scheme: string;
          stage: number;
          label: string;
        };
        Insert: {
          stage_id?: number;
          scheme: string;
          stage: number;
          label: string;
        };
        Update: {
          stage_id?: number;
          scheme?: string;
          stage?: number;
          label?: string;
        };
      };

      whv_maker: {
        Row: {
          user_id: string;
          given_name: string;
          family_name: string;
          middle_name: string | null;
          birth_date: string;
          nationality: string;
          tagline: string | null;
          mobile_num: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postcode: string | null;
          suburb: string | null;
          profile_photo: string | null;
          is_profile_visible: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          given_name: string;
          family_name: string;
          middle_name?: string | null;
          birth_date: string;
          nationality: string;
          tagline?: string | null;
          mobile_num?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postcode?: string | null;
          suburb?: string | null;
          profile_photo?: string | null;
          is_profile_visible?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          given_name?: string;
          family_name?: string;
          middle_name?: string | null;
          birth_date?: string;
          nationality?: string;
          tagline?: string | null;
          mobile_num?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postcode?: string | null;
          suburb?: string | null;
          profile_photo?: string | null;
          is_profile_visible?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };

    Views: {
      vw_maker_preview_licenses: { Row: { [key: string]: any } };
      vw_maker_preview_reference_location: { Row: { [key: string]: any } };
      vw_maker_preview_work_history: { Row: { [key: string]: any } };
      vw_maker_work_preference_industry_role: { Row: { [key: string]: any } };
      vw_stage_eligible_countries: { Row: { [key: string]: any } };
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      nationality: 'Australia' | 'Canada' | 'Norway' | 'Philippines'; // etc. from your export
    };
  };
}
