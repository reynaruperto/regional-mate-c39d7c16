// src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ==========================
      // COUNTRY
      // ==========================
      country: {
        Row: {
          country_id: number;
          name: string;
        };
        Insert: {
          country_id?: number;
          name: string;
        };
        Update: {
          country_id?: number;
          name?: string;
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

      // ==========================
      // EMPLOYER
      // ==========================
      employer: {
        Row: {
          user_id: string;
          given_name: string;
          middle_name: string | null;
          family_name: string;
          abn: string;
          company_name: string;
          tagline: string | null;
          business_tenure: Database["public"]["Enums"]["business_tenure"];
          employee_count: Database["public"]["Enums"]["employee_count"];
          mobile_num: string;
          website: string | null;
          profile_photo: string | null;
          address_line1: string;
          address_line2: string | null;
          suburb_city: string;
          state: Database["public"]["Enums"]["state"];
          postcode: string | null;
          industry_id: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          given_name: string;
          middle_name?: string | null;
          family_name: string;
          abn: string;
          company_name: string;
          tagline?: string | null;
          business_tenure: Database["public"]["Enums"]["business_tenure"];
          employee_count: Database["public"]["Enums"]["employee_count"];
          mobile_num: string;
          website?: string | null;
          profile_photo?: string | null;
          address_line1: string;
          address_line2?: string | null;
          suburb_city: string;
          state: Database["public"]["Enums"]["state"];
          postcode?: string | null;
          industry_id: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          given_name?: string;
          middle_name?: string | null;
          family_name?: string;
          abn?: string;
          company_name?: string;
          tagline?: string | null;
          business_tenure?: Database["public"]["Enums"]["business_tenure"];
          employee_count?: Database["public"]["Enums"]["employee_count"];
          mobile_num?: string;
          website?: string | null;
          profile_photo?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          suburb_city?: string;
          state?: Database["public"]["Enums"]["state"];
          postcode?: string | null;
          industry_id?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      employer_facility: {
        Row: {
          user_id: string;
          facility_id: number;
          other: string | null;
        };
        Insert: {
          user_id: string;
          facility_id: number;
          other?: string | null;
        };
        Update: {
          user_id?: string;
          facility_id?: number;
          other?: string | null;
        };
      };

      employer_role: {
        Row: {
          user_id: string;
          industry_role_id: number;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          industry_role_id: number;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          industry_role_id?: number;
          created_at?: string | null;
        };
      };

      // ==========================
      // INDUSTRY
      // ==========================
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
          industry_id: number | null;
          role: string;
        };
        Insert: {
          industry_role_id?: number;
          industry_id?: number | null;
          role: string;
        };
        Update: {
          industry_role_id?: number;
          industry_id?: number | null;
          role?: string;
        };
      };
      // ==========================
      // JOB
      // ==========================
      job: {
        Row: {
          job_id: number;
          description: string;
          job_status: Database["public"]["Enums"]["job_status"];
          user_id: string;
          created_at: string | null;
          updated_at: string | null;
          industry_role_id: number | null;
          salary_range: string | null;
          req_experience: string;
          postcode: string | null;
          start_date: string;
          employment_type: Database["public"]["Enums"]["employment_type"];
          state: Database["public"]["Enums"]["state"];
          suburb_city: string;
        };
        Insert: {
          job_id?: number;
          description: string;
          job_status?: Database["public"]["Enums"]["job_status"];
          user_id: string;
          created_at?: string | null;
          updated_at?: string | null;
          industry_role_id?: number | null;
          salary_range?: string | null;
          req_experience: string;
          postcode?: string | null;
          start_date: string;
          employment_type: Database["public"]["Enums"]["employment_type"];
          state: Database["public"]["Enums"]["state"];
          suburb_city: string;
        };
        Update: {
          job_id?: number;
          description?: string;
          job_status?: Database["public"]["Enums"]["job_status"];
          user_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          industry_role_id?: number | null;
          salary_range?: string | null;
          req_experience?: string;
          postcode?: string | null;
          start_date?: string;
          employment_type?: Database["public"]["Enums"]["employment_type"];
          state?: Database["public"]["Enums"]["state"];
          suburb_city?: string;
        };
      };

      job_license: {
        Row: {
          job_id: number;
          license_id: number;
          other: string | null;
        };
        Insert: {
          job_id: number;
          license_id: number;
          other?: string | null;
        };
        Update: {
          job_id?: number;
          license_id?: number;
          other?: string | null;
        };
      };

      // ==========================
      // LIKES
      // ==========================
      likes: {
        Row: {
          id: string;
          liker_id: string;
          liker_type: "whv" | "employer";
          liked_job_post_id: number | null;
          liked_whv_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          liker_id: string;
          liker_type: "whv" | "employer";
          liked_job_post_id?: number | null;
          liked_whv_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          liker_id?: string;
          liker_type?: "whv" | "employer";
          liked_job_post_id?: number | null;
          liked_whv_id?: string | null;
          created_at?: string | null;
        };
      };

      // ==========================
      // MAKER TABLES
      // ==========================
      maker_license: {
        Row: {
          user_id: string;
          license_id: number;
          other: string | null;
        };
        Insert: {
          user_id: string;
          license_id: number;
          other?: string | null;
        };
        Update: {
          user_id?: string;
          license_id?: number;
          other?: string | null;
        };
      };

      maker_pref_availability: {
        Row: {
          user_id: string;
          availability: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          availability: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          availability?: string;
          created_at?: string | null;
        };
      };

      maker_pref_industry: {
        Row: {
          id: string;
          user_id: string;
          industry_id: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          industry_id: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          industry_id?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      maker_pref_industry_role: {
        Row: {
          id: string;
          user_id: string | null;
          industry_role_id: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          industry_role_id?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          industry_role_id?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      maker_pref_location: {
        Row: {
          id: string;
          user_id: string;
          suburb_city: string;
          state: Database["public"]["Enums"]["state"];
          postcode: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          suburb_city: string;
          state: Database["public"]["Enums"]["state"];
          postcode?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          suburb_city?: string;
          state?: Database["public"]["Enums"]["state"];
          postcode?: string | null;
          created_at?: string | null;
        };
      };

      maker_preference: {
        Row: {
          preference_id: number;
          user_id: string;
          industry_role_id: number;
          region_rules_id: number;
          created_at: string | null;
        };
        Insert: {
          preference_id?: number;
          user_id: string;
          industry_role_id: number;
          region_rules_id: number;
          created_at?: string | null;
        };
        Update: {
          preference_id?: number;
          user_id?: string;
          industry_role_id?: number;
          region_rules_id?: number;
          created_at?: string | null;
        };
      };

      maker_reference: {
        Row: {
          reference_id: number;
          user_id: string;
          name: string | null;
          business_name: string | null;
          email: string | null;
          mobile_num: string | null;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          reference_id?: number;
          user_id: string;
          name?: string | null;
          business_name?: string | null;
          email?: string | null;
          mobile_num?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          reference_id?: number;
          user_id?: string;
          name?: string | null;
          business_name?: string | null;
          email?: string | null;
          mobile_num?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      // ==========================
      // MAKER VISA
      // ==========================
      maker_visa: {
        Row: {
          user_id: string;
          country_id: number;
          stage_id: number;
          dob: string;
          expiry_date: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          country_id: number;
          stage_id: number;
          dob: string;
          expiry_date: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          country_id?: number;
          stage_id?: number;
          dob?: string;
          expiry_date?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      maker_visa_eligibility: {
        Row: {
          id: string;
          stage_id: number | null;
          country_id: number | null;
          industry_id: number | null;
        };
        Insert: {
          id?: string;
          stage_id?: number | null;
          country_id?: number | null;
          industry_id?: number | null;
        };
        Update: {
          id?: string;
          stage_id?: number | null;
          country_id?: number | null;
          industry_id?: number | null;
        };
      };

      maker_work_experience: {
        Row: {
          work_experience_id: number;
          user_id: string;
          company: string;
          position: string;
          start_date: string;
          end_date: string;
          location: string | null;
          industry_id: number;
          job_description: string | null;
        };
        Insert: {
          work_experience_id?: number;
          user_id: string;
          company: string;
          position: string;
          start_date: string;
          end_date: string;
          location?: string | null;
          industry_id: number;
          job_description?: string | null;
        };
        Update: {
          work_experience_id?: number;
          user_id?: string;
          company?: string;
          position?: string;
          start_date?: string;
          end_date?: string;
          location?: string | null;
          industry_id?: number;
          job_description?: string | null;
        };
      };

      // ==========================
      // MATCHES
      // ==========================
      matches: {
        Row: {
          id: string;
          whv_id: string;
          employer_id: string;
          job_post_id: number;
          match_score: number | null;
          matched_at: string | null;
          is_active: boolean | null;
          whm_viewed_at: string | null;
          employer_viewed_at: string | null;
        };
        Insert: {
          id?: string;
          whv_id: string;
          employer_id: string;
          job_post_id: number;
          match_score?: number | null;
          matched_at?: string | null;
          is_active?: boolean | null;
          whm_viewed_at?: string | null;
          employer_viewed_at?: string | null;
        };
        Update: {
          id?: string;
          whv_id?: string;
          employer_id?: string;
          job_post_id?: number;
          match_score?: number | null;
          matched_at?: string | null;
          is_active?: boolean | null;
          whm_viewed_at?: string | null;
          employer_viewed_at?: string | null;
        };
      };

      matching_score: {
        Row: {
          whv_id: string;
          job_id: number;
          match_score: number;
          work_experience_score: number | null;
          license_score: number | null;
          location_score: number | null;
          industry_score: number | null;
          calculated_at: string | null;
        };
        Insert: {
          whv_id: string;
          job_id: number;
          match_score: number;
          work_experience_score?: number | null;
          license_score?: number | null;
          location_score?: number | null;
          industry_score?: number | null;
          calculated_at?: string | null;
        };
        Update: {
          whv_id?: string;
          job_id?: number;
          match_score?: number;
          work_experience_score?: number | null;
          license_score?: number | null;
          location_score?: number | null;
          industry_score?: number | null;
          calculated_at?: string | null;
        };
      };

      // ==========================
      // REGION TABLES
      // ==========================
      postcode: {
        Row: {
          id: number;
          state: string | null;
          suburb_city: string | null;
          postcode: string | null;
        };
        Insert: {
          id?: number;
          state?: string | null;
          suburb_city?: string | null;
          postcode?: string | null;
        };
        Update: {
          id?: number;
          state?: string | null;
          suburb_city?: string | null;
          postcode?: string | null;
        };
      };

      region_postcode: {
        Row: {
          id: number;
          state: string;
          area: "Regional" | "Northern" | "Remote" | "Very Remote";
          postcode_range: string;
        };
        Insert: {
          id?: number;
          state: string;
          area: "Regional" | "Northern" | "Remote" | "Very Remote";
          postcode_range: string;
        };
        Update: {
          id?: number;
          state?: string;
          area?: "Regional" | "Northern" | "Remote" | "Very Remote";
          postcode_range?: string;
        };
      };

      region_rules: {
        Row: {
          id: number;
          sub_class: string;
          stage: number;
          state: Database["public"]["Enums"]["state"];
          area: string;
          postcode_range: string | null;
          created_at: string | null;
          industry_id: number | null;
        };
        Insert: {
          id?: number;
          sub_class: string;
          stage: number;
          state: Database["public"]["Enums"]["state"];
          area: string;
          postcode_range?: string | null;
          created_at?: string | null;
          industry_id?: number | null;
        };
        Update: {
          id?: number;
          sub_class?: string;
          stage?: number;
          state?: Database["public"]["Enums"]["state"];
          area?: string;
          postcode_range?: string | null;
          created_at?: string | null;
          industry_id?: number | null;
        };
      };

      regional_rules: {
        Row: {
          id: number;
          stage_id: number | null;
          industry_id: number | null;
          state: Database["public"]["Enums"]["state"];
          suburb_city: string;
          area: string;
          postcode: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          stage_id?: number | null;
          industry_id?: number | null;
          state: Database["public"]["Enums"]["state"];
          suburb_city: string;
          area: string;
          postcode: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          stage_id?: number | null;
          industry_id?: number | null;
          state?: Database["public"]["Enums"]["state"];
          suburb_city?: string;
          area?: string;
          postcode?: string;
          created_at?: string | null;
        };
      };

      temp_eligibility: {
        Row: {
          sub_class: string;
          stage: number;
          country_name: string;
          industry_name: string;
          industry_id: number | null;
        };
        Insert: {
          sub_class: string;
          stage: number;
          country_name: string;
          industry_name: string;
          industry_id?: number | null;
        };
        Update: {
          sub_class?: string;
          stage?: number;
          country_name?: string;
          industry_name?: string;
          industry_id?: number | null;
        };
      };

      // ==========================
      // PROFILE
      // ==========================
      profile: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string | null;
          updated_at: string | null;
          user_type: "employer" | "whv";
          encrypt_email: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string | null;
          updated_at?: string | null;
          user_type: "employer" | "whv";
          encrypt_email?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          created_at?: string | null;
          updated_at?: string | null;
          user_type?: "employer" | "whv";
          encrypt_email?: string | null;
        };
      };
      // ==========================
      // VISA STAGE
      // ==========================
      visa_stage: {
        Row: {
          stage_id: number;
          sub_class: "417" | "462";
          stage: number;
          label: string;
        };
        Insert: {
          stage_id?: number;
          sub_class: "417" | "462";
          stage: number;
          label: string;
        };
        Update: {
          stage_id?: number;
          sub_class?: "417" | "462";
          stage?: number;
          label?: string;
        };
      };

      // ==========================
      // WHV MAKER
      // ==========================
      whv_maker: {
        Row: {
          user_id: string;
          given_name: string;
          middle_name: string | null;
          family_name: string;
          birth_date: string;
          nationality: Database["public"]["Enums"]["nationality"];
          tagline: string | null;
          mobile_num: string;
          address_line1: string;
          address_line2: string | null;
          suburb: string;
          state: Database["public"]["Enums"]["state"];
          postcode: string;
          is_profile_visible: boolean | null;
          profile_photo: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          given_name: string;
          middle_name?: string | null;
          family_name: string;
          birth_date: string;
          nationality: Database["public"]["Enums"]["nationality"];
          tagline?: string | null;
          mobile_num: string;
          address_line1: string;
          address_line2?: string | null;
          suburb: string;
          state: Database["public"]["Enums"]["state"];
          postcode: string;
          is_profile_visible?: boolean | null;
          profile_photo?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          given_name?: string;
          middle_name?: string | null;
          family_name?: string;
          birth_date?: string;
          nationality?: Database["public"]["Enums"]["nationality"];
          tagline?: string | null;
          mobile_num?: string;
          address_line1?: string;
          address_line2?: string | null;
          suburb?: string;
          state?: Database["public"]["Enums"]["state"];
          postcode?: string;
          is_profile_visible?: boolean | null;
          profile_photo?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      // ==========================
      // ENUMERATED TYPES
      // ==========================
      Enums: {
        job_status: "draft" | "active" | "closed";
        employment_type: "full_time" | "part_time" | "casual" | "contract";
        state:
          | "Queensland"
          | "New South Wales"
          | "Victoria"
          | "South Australia"
          | "Western Australia"
          | "Tasmania"
          | "Northern Territory"
          | "Australian Capital Territory";
        nationality:
          | "Philippines"
          | "Singapore"
          | "United Kingdom"
          | "Germany"
          | "France"
          | "United States"
          | "Canada"
          | "Japan"
          | "South Korea"
          | "India";
        business_tenure:
          | "Less than 1 year"
          | "1-2 years"
          | "3-5 years"
          | "5-10 years"
          | "10+ years";
        employee_count:
          | "1-10"
          | "11-50"
          | "51-200"
          | "201-500"
          | "501-1000"
          | "1000+";
      };

      // ==========================
      // VIEWS (Normal + Materialized)
      // ==========================
      Views: {
        v_visa_stage_industries_roles: {
          Row: {
            stage_id: number | null;
            industry_id: number | null;
            industry_role_id: number | null;
            industry: string | null;
            role: string | null;
          };
        };

        vw_emp_full_profile: { Row: any };
        vw_emp_private_active_jobs: { Row: any };
        vw_emp_private_all_jobs: { Row: any };
        vw_emp_public_profile: { Row: any };
        vw_maker_private_profile: { Row: any };
        vw_maker_work_history: { Row: any };
        vw_maker_work_preference: { Row: any };

        // 🗂️ Materialized View
        mvw_emp_location_roles: {
          Row: {
            industry: string;
            industry_role: string;
            state: Database["public"]["Enums"]["state"];
            suburb_city: string;
            postcode: string;
            industry_id: number;
            industry_role_id: number;
          };
        };
      };
    };
  };
}
