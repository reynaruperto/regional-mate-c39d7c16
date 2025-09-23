// src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "country_eligibility_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "country";
            referencedColumns: ["country_id"];
          },
          {
            foreignKeyName: "country_eligibility_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "visa_stage";
            referencedColumns: ["stage_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "employer_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industry";
            referencedColumns: ["industry_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "employer_facility_facility_id_fkey";
            columns: ["facility_id"];
            isOneToOne: false;
            referencedRelation: "facility";
            referencedColumns: ["facility_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "employer_role_industry_role_id_fkey";
            columns: ["industry_role_id"];
            isOneToOne: false;
            referencedRelation: "industry_role";
            referencedColumns: ["industry_role_id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "industry_role_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industry";
            referencedColumns: ["industry_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "job_industry_role_id_fkey";
            columns: ["industry_role_id"];
            isOneToOne: false;
            referencedRelation: "industry_role";
            referencedColumns: ["industry_role_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "job_license_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "license";
            referencedColumns: ["license_id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "maker_license_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "license";
            referencedColumns: ["license_id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industry";
            referencedColumns: ["industry_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey";
            columns: ["industry_role_id"];
            isOneToOne: false;
            referencedRelation: "industry_role";
            referencedColumns: ["industry_role_id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "maker_preference_industry_role_id_fkey";
            columns: ["industry_role_id"];
            isOneToOne: false;
            referencedRelation: "industry_role";
            referencedColumns: ["industry_role_id"];
          },
          {
            foreignKeyName: "maker_preference_region_rules_id_fkey";
            columns: ["region_rules_id"];
            isOneToOne: false;
            referencedRelation: "region_rules";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "maker_visa_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "country";
            referencedColumns: ["country_id"];
          },
          {
            foreignKeyName: "maker_visa_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "visa_stage";
            referencedColumns: ["stage_id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "matches_job_post_id_fkey";
            columns: ["job_post_id"];
            isOneToOne: false;
            referencedRelation: "job";
            referencedColumns: ["job_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "matching_score_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "job";
            referencedColumns: ["job_id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    }
    Views: {
      // ==========================
      // MATERIALIZED VIEW
      // ==========================
      mvw_emp_location_roles: {
        Row: {
          industry_id: number;
          industry_role_id: number;
          industry_role: string;
          state: string;
          suburb_city: string;
          postcode: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      job_status: "draft" | "active" | "closed";
      employment_type:
        | "full_time"
        | "part_time"
        | "casual"
        | "contract";
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
        | "<1"
        | "1"
        | "2"
        | "3"
        | "4"
        | "5"
        | "6-10"
        | "11-15"
        | "16-20"
        | "20+";
      employee_count:
        | "1"
        | "2-5"
        | "6-10"
        | "11-20"
        | "21-50"
        | "51-100"
        | "100+";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  }
};
