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

      employer_job_type: {
        Row: {
          user_id: string;
          type_id: number;
        };
        Insert: {
          user_id: string;
          type_id: number;
        };
        Update: {
          user_id?: string;
          type_id?: number;
        };
        Relationships: [];
      };

      // ==========================
      // FACILITY & INDUSTRY
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
          salary_range: Database["public"]["Enums"]["pay_range"] | null;
          req_experience: Database["public"]["Enums"]["years_experience"];
          postcode: string | null;
          start_date: string;
          employment_type: Database["public"]["Enums"]["job_type_enum"];
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
          salary_range?: Database["public"]["Enums"]["pay_range"] | null;
          req_experience: Database["public"]["Enums"]["years_experience"];
          postcode?: string | null;
          start_date: string;
          employment_type: Database["public"]["Enums"]["job_type_enum"];
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
          salary_range?: Database["public"]["Enums"]["pay_range"] | null;
          req_experience?: Database["public"]["Enums"]["years_experience"];
          postcode?: string | null;
          start_date?: string;
          employment_type?: Database["public"]["Enums"]["job_type_enum"];
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
            foreignKeyName: "job_license_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "job";
            referencedColumns: ["job_id"];
          },
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
          liker_type: string;
          liked_job_post_id: number | null;
          liked_whv_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          liker_id: string;
          liker_type: string;
          liked_job_post_id?: number | null;
          liked_whv_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          liker_id?: string;
          liker_type?: string;
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
          state: Database["public"]["Enums"]["state"];
          suburb_city: string;
          postcode: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          state: Database["public"]["Enums"]["state"];
          suburb_city: string;
          postcode: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          state?: Database["public"]["Enums"]["state"];
          suburb_city?: string;
          postcode?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };

      maker_preference: {
        Row: {
          preference_id: number;
          user_id: string;
          region_rules_id: number;
          industry_role_id: number;
          created_at: string;
        };
        Insert: {
          preference_id?: number;
          user_id: string;
          region_rules_id: number;
          industry_role_id: number;
          created_at?: string;
        };
        Update: {
          preference_id?: number;
          user_id?: string;
          region_rules_id?: number;
          industry_role_id?: number;
          created_at?: string;
        };
        Relationships: [];
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

      maker_visa: {
        Row: {
          user_id: string;
          country_id: number;
          stage_id: number;
          expiry_date: string;
          dob: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          country_id: number;
          stage_id: number;
          expiry_date: string;
          dob: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          country_id?: number;
          stage_id?: number;
          expiry_date?: string;
          dob?: string;
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

      maker_work_experience: {
        Row: {
          work_experience_id: number;
          user_id: string;
          industry_id: number;
          position: string;
          company: string;
          location: string | null;
          job_description: string | null;
          start_date: string;
          end_date: string;
        };
        Insert: {
          work_experience_id?: number;
          user_id: string;
          industry_id: number;
          position: string;
          company: string;
          location?: string | null;
          job_description?: string | null;
          start_date: string;
          end_date: string;
        };
        Update: {
          work_experience_id?: number;
          user_id?: string;
          industry_id?: number;
          position?: string;
          company?: string;
          location?: string | null;
          job_description?: string | null;
          start_date?: string;
          end_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maker_work_experience_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industry";
            referencedColumns: ["industry_id"];
          }
        ];
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
          whm_viewed_at: string | null;
          employer_viewed_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          whv_id: string;
          employer_id: string;
          job_post_id: number;
          match_score?: number | null;
          matched_at?: string | null;
          whm_viewed_at?: string | null;
          employer_viewed_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          whv_id?: string;
          employer_id?: string;
          job_post_id?: number;
          match_score?: number | null;
          matched_at?: string | null;
          whm_viewed_at?: string | null;
          employer_viewed_at?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
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
        Relationships: [];
      };

      // ==========================
      // POSTCODE & REGIONAL
      // ==========================
      postcode: {
        Row: {
          id: number;
          postcode: string | null;
          suburb_city: string | null;
          state: string | null;
        };
        Insert: {
          id?: number;
          postcode?: string | null;
          suburb_city?: string | null;
          state?: string | null;
        };
        Update: {
          id?: number;
          postcode?: string | null;
          suburb_city?: string | null;
          state?: string | null;
        };
        Relationships: [];
      };

      profile: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          user_type: string | null;
          created_at: string | null;
          updated_at: string | null;
          encrypt_email: unknown | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          user_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          encrypt_email?: unknown | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          user_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          encrypt_email?: unknown | null;
        };
        Relationships: [];
      };

      region_postcode: {
        Row: {
          id: number;
          state: string;
          area: string;
          postcode_range: string;
        };
        Insert: {
          id?: number;
          state: string;
          area: string;
          postcode_range: string;
        };
        Update: {
          id?: number;
          state?: string;
          area?: string;
          postcode_range?: string;
        };
        Relationships: [];
      };

      region_rules: {
        Row: {
          id: number;
          sub_class: string;
          stage: number;
          state: string;
          area: string;
          postcode_range: string | null;
          industry_id: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          sub_class: string;
          stage: number;
          state: string;
          area: string;
          postcode_range?: string | null;
          industry_id?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          sub_class?: string;
          stage?: number;
          state?: string;
          area?: string;
          postcode_range?: string | null;
          industry_id?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      regional_rules: {
        Row: {
          id: number;
          state: Database["public"]["Enums"]["state"];
          area: string;
          suburb_city: string;
          postcode: string;
          stage_id: number | null;
          industry_id: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          state: Database["public"]["Enums"]["state"];
          area: string;
          suburb_city: string;
          postcode: string;
          stage_id?: number | null;
          industry_id?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          state?: Database["public"]["Enums"]["state"];
          area?: string;
          suburb_city?: string;
          postcode?: string;
          stage_id?: number | null;
          industry_id?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      visa_stage: {
        Row: {
          stage_id: number;
          sub_class: string;
          stage: number;
          label: string;
        };
        Insert: {
          stage_id?: number;
          sub_class: string;
          stage: number;
          label: string;
        };
        Update: {
          stage_id?: number;
          sub_class?: string;
          stage?: number;
          label?: string;
        };
        Relationships: [];
      };

      whv_maker: {
        Row: {
          user_id: string;
          given_name: string;
          middle_name: string | null;
          family_name: string;
          birth_date: string;
          nationality: Database["public"]["Enums"]["nationality"];
          mobile_num: string;
          profile_photo: string | null;
          address_line1: string;
          address_line2: string | null;
          suburb: string;
          state: Database["public"]["Enums"]["state"];
          postcode: string;
          tagline: string | null;
          is_profile_visible: boolean | null;
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
          mobile_num: string;
          profile_photo?: string | null;
          address_line1: string;
          address_line2?: string | null;
          suburb: string;
          state: Database["public"]["Enums"]["state"];
          postcode: string;
          tagline?: string | null;
          is_profile_visible?: boolean | null;
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
          mobile_num?: string;
          profile_photo?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          suburb?: string;
          state?: Database["public"]["Enums"]["state"];
          postcode?: string;
          tagline?: string | null;
          is_profile_visible?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      // ==========================
      // MATERIALIZED VIEWS
      // ==========================
      mvw_emp_location_roles: {
        Row: {
          industry_id: number | null;
          industry_role_id: number | null;
          industry_role: string | null;
          state: string | null;
          suburb_city: string | null;
          postcode: string | null;
        };
        Insert: {
          industry_id?: never;
          industry_role_id?: never;
          industry_role?: never;
          state?: never;
          suburb_city?: never;
          postcode?: never;
        };
        Update: {
          industry_id?: never;
          industry_role_id?: never;
          industry_role?: never;
          state?: never;
          suburb_city?: never;
          postcode?: never;
        };
        Relationships: [];
      };

      mvw_eligibility_visa_country_stage_industry: {
        Row: {
          country_id: number | null;
          country_name: string | null;
          stage_id: number | null;
          stage_label: string | null;
          industry_id: number | null;
          industry_name: string | null;
        };
        Insert: {
          country_id?: never;
          country_name?: never;
          stage_id?: never;
          stage_label?: never;
          industry_id?: never;
          industry_name?: never;
        };
        Update: {
          country_id?: never;
          country_name?: never;
          stage_id?: never;
          stage_label?: never;
          industry_id?: never;
          industry_name?: never;
        };
        Relationships: [];
      };

      // Regular views
      vw_emp_match_scores: {
        Row: {
          emp_id: string | null;
          job_id: number | null;
          match_score: number | null;
          work_experience_score: number | null;
          license_score: number | null;
          location_score: number | null;
          industry_score: number | null;
          matching_rank: number | null;
        };
        Insert: {
          emp_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Update: {
          emp_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Relationships: [];
      };

      vw_emp_private_active_jobs: {
        Row: {
          job_id: number | null;
          user_id: string | null;
          role: string | null;
          location: string | null;
          job_type: Database["public"]["Enums"]["job_type_enum"] | null;
          pay_range: Database["public"]["Enums"]["pay_range"] | null;
          status: Database["public"]["Enums"]["job_status"] | null;
        };
        Insert: {
          job_id?: never;
          user_id?: never;
          role?: never;
          location?: never;
          job_type?: never;
          pay_range?: never;
          status?: never;
        };
        Update: {
          job_id?: never;
          user_id?: never;
          role?: never;
          location?: never;
          job_type?: never;
          pay_range?: never;
          status?: never;
        };
        Relationships: [];
      };

      vw_emp_private_all_jobs: {
        Row: {
          job_id: number | null;
          user_id: string | null;
          role: string | null;
          location: string | null;
          job_type: Database["public"]["Enums"]["job_type_enum"] | null;
          pay_range: Database["public"]["Enums"]["pay_range"] | null;
          status: Database["public"]["Enums"]["job_status"] | null;
        };
        Insert: {
          job_id?: never;
          user_id?: never;
          role?: never;
          location?: never;
          job_type?: never;
          pay_range?: never;
          status?: never;
        };
        Update: {
          job_id?: never;
          user_id?: never;
          role?: never;
          location?: never;
          job_type?: never;
          pay_range?: never;
          status?: never;
        };
        Relationships: [];
      };

      vw_emp_private_inactive_jobs: {
        Row: {
          job_id: number | null;
          user_id: string | null;
          role: string | null;
          location: string | null;
          job_type: Database["public"]["Enums"]["job_type_enum"] | null;
          pay_range: Database["public"]["Enums"]["pay_range"] | null;
          status: Database["public"]["Enums"]["job_status"] | null;
        };
        Insert: {
          job_id?: never;
          user_id?: never;
          role?: never;
          location?: never;
          job_type?: never;
          pay_range?: never;
          status?: never;
        };
        Update: {
          job_id?: never;
          user_id?: never;
          role?: never;
          location?: never;
          job_type?: never;
          pay_range?: never;
          status?: never;
        };
        Relationships: [];
      };

      vw_industry_roles: {
        Row: {
          industry_id: number | null;
          industry_name: string | null;
          industry_role_id: number | null;
          role: string | null;
        };
        Insert: {
          industry_id?: never;
          industry_name?: never;
          industry_role_id?: never;
          role?: never;
        };
        Update: {
          industry_id?: never;
          industry_name?: never;
          industry_role_id?: never;
          role?: never;
        };
        Relationships: [];
      };

      vw_maker_match_scores: {
        Row: {
          user_id: string | null;
          job_id: number | null;
          match_score: number | null;
          work_experience_score: number | null;
          license_score: number | null;
          location_score: number | null;
          industry_score: number | null;
          matching_rank: number | null;
        };
        Insert: {
          user_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Update: {
          user_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Relationships: [];
      };

      vw_maker_match_scores_top10: {
        Row: {
          user_id: string | null;
          job_id: number | null;
          match_score: number | null;
          work_experience_score: number | null;
          license_score: number | null;
          location_score: number | null;
          industry_score: number | null;
          matching_rank: number | null;
        };
        Insert: {
          user_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Update: {
          user_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Relationships: [];
      };

      vw_maker_match_scores_top5: {
        Row: {
          user_id: string | null;
          job_id: number | null;
          match_score: number | null;
          work_experience_score: number | null;
          license_score: number | null;
          location_score: number | null;
          industry_score: number | null;
          matching_rank: number | null;
        };
        Insert: {
          user_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Update: {
          user_id?: never;
          job_id?: never;
          match_score?: never;
          work_experience_score?: never;
          license_score?: never;
          location_score?: never;
          industry_score?: never;
          matching_rank?: never;
        };
        Relationships: [];
      };

      vw_maker_preference_industry_role: {
        Row: {
          industry: string | null;
          role: string | null;
        };
        Insert: {
          industry?: never;
          role?: never;
        };
        Update: {
          industry?: never;
          role?: never;
        };
        Relationships: [];
      };

      vw_maker_preview_licenses: {
        Row: {
          name: string | null;
        };
        Insert: {
          name?: never;
        };
        Update: {
          name?: never;
        };
        Relationships: [];
      };

      vw_maker_preview_reference_location: {
        Row: {
          state: string | null;
          area: string | null;
        };
        Insert: {
          state?: never;
          area?: never;
        };
        Update: {
          state?: never;
          area?: never;
        };
        Relationships: [];
      };

      vw_maker_preview_work_history: {
        Row: {
          position: string | null;
          company: string | null;
          location: string | null;
          years_of_experience: unknown | null;
        };
        Insert: {
          position?: never;
          company?: never;
          location?: never;
          years_of_experience?: never;
        };
        Update: {
          position?: never;
          company?: never;
          location?: never;
          years_of_experience?: never;
        };
        Relationships: [];
      };

      vw_maker_work_preference_industry_role: {
        Row: {
          industry: string | null;
          role: string | null;
        };
        Insert: {
          industry?: never;
          role?: never;
        };
        Update: {
          industry?: never;
          role?: never;
        };
        Relationships: [];
      };

      vw_regional_rules_base: {
        Row: {
          id: number | null;
          state: Database["public"]["Enums"]["state"] | null;
          area: string | null;
          suburb_city: string | null;
          postcode: string | null;
          stage_id: number | null;
          industry_id: number | null;
          visa_stage_label: string | null;
          industry_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: never;
          state?: never;
          area?: never;
          suburb_city?: never;
          postcode?: never;
          stage_id?: never;
          industry_id?: never;
          visa_stage_label?: never;
          industry_name?: never;
          created_at?: never;
        };
        Update: {
          id?: never;
          state?: never;
          area?: never;
          suburb_city?: never;
          postcode?: never;
          stage_id?: never;
          industry_id?: never;
          visa_stage_label?: never;
          industry_name?: never;
          created_at?: never;
        };
        Relationships: [];
      };

      vw_stage_eligible_countries: {
        Row: {
          stage_id: number | null;
          stage_label: string | null;
          country_id: number | null;
          country_name: string | null;
        };
        Insert: {
          stage_id?: never;
          stage_label?: never;
          country_id?: never;
          country_name?: never;
        };
        Update: {
          stage_id?: never;
          stage_label?: never;
          country_id?: never;
          country_name?: never;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
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
      job_status: "active" | "inactive" | "draft";
      job_type_enum:
        | "Full-time"
        | "Part-time"
        | "Casual"
        | "Contract"
        | "Seasonal";
      nationality:
        | "Afghan"
        | "Albanian"
        | "Algerian"
        | "American"
        | "Andorran"
        | "Angolan"
        | "Antiguans"
        | "Argentinean"
        | "Armenian"
        | "Australian"
        | "Austrian"
        | "Azerbaijani"
        | "Bahamian"
        | "Bahraini"
        | "Bangladeshi"
        | "Barbadian"
        | "Barbudans"
        | "Batswana"
        | "Belarusian"
        | "Belgian"
        | "Belizean"
        | "Beninese"
        | "Bhutanese"
        | "Bolivian"
        | "Bosnian"
        | "Brazilian"
        | "British"
        | "Bruneian"
        | "Bulgarian"
        | "Burkinabe"
        | "Burmese"
        | "Burundian"
        | "Cambodian"
        | "Cameroonian"
        | "Canadian"
        | "Cape Verdean"
        | "Central African"
        | "Chadian"
        | "Chilean"
        | "Chinese"
        | "Colombian"
        | "Comoran"
        | "Congolese"
        | "Costa Rican"
        | "Croatian"
        | "Cuban"
        | "Cypriot"
        | "Czech"
        | "Danish"
        | "Djibouti"
        | "Dominican"
        | "Dutch"
        | "East Timorese"
        | "Ecuadorean"
        | "Egyptian"
        | "Emirian"
        | "Equatorial Guinean"
        | "Eritrean"
        | "Estonian"
        | "Ethiopian"
        | "Fijian"
        | "Filipino"
        | "Finnish"
        | "French"
        | "Gabonese"
        | "Gambian"
        | "Georgian"
        | "German"
        | "Ghanaian"
        | "Greek"
        | "Grenadian"
        | "Guatemalan"
        | "Guinea-Bissauan"
        | "Guinean"
        | "Guyanese"
        | "Haitian"
        | "Herzegovinian"
        | "Honduran"
        | "Hungarian"
        | "I-Kiribati"
        | "Icelander"
        | "Indian"
        | "Indonesian"
        | "Iranian"
        | "Iraqi"
        | "Irish"
        | "Israeli"
        | "Italian"
        | "Ivorian"
        | "Jamaican"
        | "Japanese"
        | "Jordanian"
        | "Kazakhstani"
        | "Kenyan"
        | "Kittian and Nevisian"
        | "Kuwaiti"
        | "Kyrgyz"
        | "Laotian"
        | "Latvian"
        | "Lebanese"
        | "Liberian"
        | "Libyan"
        | "Liechtensteiner"
        | "Lithuanian"
        | "Luxembourger"
        | "Macedonian"
        | "Malagasy"
        | "Malawian"
        | "Malaysian"
        | "Maldivan"
        | "Malian"
        | "Maltese"
        | "Marshallese"
        | "Mauritanian"
        | "Mauritian"
        | "Mexican"
        | "Micronesian"
        | "Moldovan"
        | "Monacan"
        | "Mongolian"
        | "Moroccan"
        | "Mosotho"
        | "Motswana"
        | "Mozambican"
        | "Namibian"
        | "Nauruan"
        | "Nepalese"
        | "New Zealander"
        | "Ni-Vanuatu"
        | "Nicaraguan"
        | "Nigerian"
        | "Nigerien"
        | "North Korean"
        | "Northern Irish"
        | "Norwegian"
        | "Omani"
        | "Pakistani"
        | "Palauan"
        | "Panamanian"
        | "Papua New Guinean"
        | "Paraguayan"
        | "Peruvian"
        | "Polish"
        | "Portuguese"
        | "Qatari"
        | "Romanian"
        | "Russian"
        | "Rwandan"
        | "Saint Lucian"
        | "Salvadoran"
        | "Samoan"
        | "San Marinese"
        | "Sao Tomean"
        | "Saudi"
        | "Scottish"
        | "Senegalese"
        | "Serbian"
        | "Seychellois"
        | "Sierra Leonean"
        | "Singaporean"
        | "Slovakian"
        | "Slovenian"
        | "Solomon Islander"
        | "Somali"
        | "South African"
        | "South Korean"
        | "Spanish"
        | "Sri Lankan"
        | "Sudanese"
        | "Surinamer"
        | "Swazi"
        | "Swedish"
        | "Swiss"
        | "Syrian"
        | "Taiwanese"
        | "Tajik"
        | "Tanzanian"
        | "Thai"
        | "Togolese"
        | "Tongan"
        | "Trinidadian or Tobagonian"
        | "Tunisian"
        | "Turkish"
        | "Tuvaluan"
        | "Ugandan"
        | "Ukrainian"
        | "Uruguayan"
        | "Uzbekistani"
        | "Venezuelan"
        | "Vietnamese"
        | "Welsh"
        | "Yemenite"
        | "Zambian"
        | "Zimbabwean";
      pay_range:
        | "$25-30/hour"
        | "$30-35/hour"
        | "$35-40/hour"
        | "$40-45/hour"
        | "$45+/hour"
        | "Undisclosed";
      state:
        | "Australian Capital Territory"
        | "New South Wales"
        | "Northern Territory"
        | "Queensland"
        | "South Australia"
        | "Tasmania"
        | "Victoria"
        | "Western Australia";
      years_experience: "None" | "<1" | "1-2" | "3-4" | "5-7" | "8-10" | "10+";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Export helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];