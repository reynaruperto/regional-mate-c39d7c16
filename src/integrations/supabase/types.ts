export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      country: {
        Row: {
          country_id: number
          name: string
        }
        Insert: {
          country_id?: number
          name: string
        }
        Update: {
          country_id?: number
          name?: string
        }
        Relationships: []
      }
      country_eligibility: {
        Row: {
          country_id: number
          created_at: string | null
          eligibility_id: string
          id: number
          stage_id: number
        }
        Insert: {
          country_id: number
          created_at?: string | null
          eligibility_id?: string
          id?: number
          stage_id: number
        }
        Update: {
          country_id?: number
          created_at?: string | null
          eligibility_id?: string
          id?: number
          stage_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "country_eligibility_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "country_eligibility_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "vw_eligibility_visa_country_stage_industry"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "country_eligibility_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "country_eligibility_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "country_eligibility_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "country_eligibility_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      employer: {
        Row: {
          abn: string
          address_line1: string
          address_line2: string | null
          business_tenure: Database["public"]["Enums"]["business_tenure"]
          company_name: string
          created_at: string | null
          employee_count: Database["public"]["Enums"]["employee_count"]
          family_name: string
          given_name: string
          industry_id: number
          middle_name: string | null
          mobile_num: string
          postcode: string
          profile_photo: string | null
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          tagline: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          abn: string
          address_line1: string
          address_line2?: string | null
          business_tenure: Database["public"]["Enums"]["business_tenure"]
          company_name: string
          created_at?: string | null
          employee_count: Database["public"]["Enums"]["employee_count"]
          family_name: string
          given_name: string
          industry_id: number
          middle_name?: string | null
          mobile_num: string
          postcode: string
          profile_photo?: string | null
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          tagline?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          abn?: string
          address_line1?: string
          address_line2?: string | null
          business_tenure?: Database["public"]["Enums"]["business_tenure"]
          company_name?: string
          created_at?: string | null
          employee_count?: Database["public"]["Enums"]["employee_count"]
          family_name?: string
          given_name?: string
          industry_id?: number
          middle_name?: string | null
          mobile_num?: string
          postcode?: string
          profile_photo?: string | null
          state?: Database["public"]["Enums"]["state"]
          suburb_city?: string
          tagline?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "employer_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "employer_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "employer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employer_facility: {
        Row: {
          facility_id: number
          other: string | null
          user_id: string
        }
        Insert: {
          facility_id: number
          other?: string | null
          user_id: string
        }
        Update: {
          facility_id?: number
          other?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_facility_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "employer_facility_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      facility: {
        Row: {
          facility_id: number
          name: string
        }
        Insert: {
          facility_id?: number
          name: string
        }
        Update: {
          facility_id?: number
          name?: string
        }
        Relationships: []
      }
      industry: {
        Row: {
          industry_id: number
          name: string
        }
        Insert: {
          industry_id?: number
          name: string
        }
        Update: {
          industry_id?: number
          name?: string
        }
        Relationships: []
      }
      industry_role: {
        Row: {
          industry_id: number | null
          industry_role_id: number
          role: string
        }
        Insert: {
          industry_id?: number | null
          industry_role_id?: number
          role: string
        }
        Update: {
          industry_id?: number | null
          industry_role_id?: number
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_role_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "industry_role_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "industry_role_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
        ]
      }
      job: {
        Row: {
          created_at: string | null
          description: string
          employment_type: Database["public"]["Enums"]["job_type_enum"]
          industry_role_id: number | null
          job_id: number
          job_status: Database["public"]["Enums"]["job_status"]
          postcode: string
          posted_at: string | null
          req_experience: Database["public"]["Enums"]["years_experience"]
          salary_range: Database["public"]["Enums"]["pay_range"]
          start_date: string
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          employment_type: Database["public"]["Enums"]["job_type_enum"]
          industry_role_id?: number | null
          job_id?: number
          job_status?: Database["public"]["Enums"]["job_status"]
          postcode: string
          posted_at?: string | null
          req_experience: Database["public"]["Enums"]["years_experience"]
          salary_range: Database["public"]["Enums"]["pay_range"]
          start_date: string
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          employment_type?: Database["public"]["Enums"]["job_type_enum"]
          industry_role_id?: number | null
          job_id?: number
          job_status?: Database["public"]["Enums"]["job_status"]
          postcode?: string
          posted_at?: string | null
          req_experience?: Database["public"]["Enums"]["years_experience"]
          salary_range?: Database["public"]["Enums"]["pay_range"]
          start_date?: string
          state?: Database["public"]["Enums"]["state"]
          suburb_city?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "industry_role"
            referencedColumns: ["industry_role_id"]
          },
          {
            foreignKeyName: "job_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "job_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_role_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
        ]
      }
      job_license: {
        Row: {
          job_id: number
          license_id: number
          other: string | null
        }
        Insert: {
          job_id: number
          license_id: number
          other?: string | null
        }
        Update: {
          job_id?: number
          license_id?: number
          other?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_active_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_all_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_inactive_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_license_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "license"
            referencedColumns: ["license_id"]
          },
        ]
      }
      license: {
        Row: {
          license_id: number
          name: string
        }
        Insert: {
          license_id?: number
          name: string
        }
        Update: {
          license_id?: number
          name?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          liked_job_post_id: number | null
          liked_whv_id: string | null
          liker_id: string
          liker_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liked_job_post_id?: number | null
          liked_whv_id?: string | null
          liker_id: string
          liker_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liked_job_post_id?: number | null
          liked_whv_id?: string | null
          liker_id?: string
          liker_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_active_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_all_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_inactive_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_job_post_id_fkey"
            columns: ["liked_job_post_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "likes_liked_whv_id_fkey"
            columns: ["liked_whv_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "likes_liked_whv_id_fkey"
            columns: ["liked_whv_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "likes_liked_whv_id_fkey"
            columns: ["liked_whv_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "likes_liked_whv_id_fkey"
            columns: ["liked_whv_id"]
            isOneToOne: false
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      location_lookup: {
        Row: {
          id: number
          postcode: string | null
          state: string | null
          suburb_city: string | null
        }
        Insert: {
          id?: number
          postcode?: string | null
          state?: string | null
          suburb_city?: string | null
        }
        Update: {
          id?: number
          postcode?: string | null
          state?: string | null
          suburb_city?: string | null
        }
        Relationships: []
      }
      maker_license: {
        Row: {
          license_id: number
          other: string | null
          user_id: string
        }
        Insert: {
          license_id: number
          other?: string | null
          user_id: string
        }
        Update: {
          license_id?: number
          other?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_license_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "license"
            referencedColumns: ["license_id"]
          },
          {
            foreignKeyName: "maker_license_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_license_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_license_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_license_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_pref_availability: {
        Row: {
          available_from: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          available_from: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          available_from?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_pref_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_pref_industry: {
        Row: {
          created_at: string | null
          id: string
          industry_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_pref_industry_role: {
        Row: {
          created_at: string | null
          id: string
          industry_role_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_role_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_role_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "industry_role"
            referencedColumns: ["industry_role_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_role_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_pref_location: {
        Row: {
          created_at: string | null
          id: string
          postcode: string
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          postcode: string
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          postcode?: string
          state?: Database["public"]["Enums"]["state"]
          suburb_city?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_pref_location_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_location_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_location_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "maker_pref_location_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_reference: {
        Row: {
          business_name: string | null
          created_at: string | null
          email: string | null
          mobile_num: string | null
          name: string | null
          reference_id: number
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          mobile_num?: string | null
          name?: string | null
          reference_id?: number
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          mobile_num?: string | null
          name?: string | null
          reference_id?: number
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_reference_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_visa: {
        Row: {
          country_id: number
          created_at: string | null
          dob: string
          expiry_date: string
          stage_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country_id: number
          created_at?: string | null
          dob: string
          expiry_date: string
          stage_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country_id?: number
          created_at?: string | null
          dob?: string
          expiry_date?: string
          stage_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_visa_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "maker_visa_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "vw_eligibility_visa_country_stage_industry"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "maker_visa_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "maker_visa_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "maker_visa_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "maker_visa_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      maker_work_experience: {
        Row: {
          company: string
          end_date: string
          industry_id: number
          job_description: string | null
          location: string | null
          position: string
          start_date: string
          user_id: string
          work_experience_id: number
        }
        Insert: {
          company: string
          end_date: string
          industry_id: number
          job_description?: string | null
          location?: string | null
          position: string
          start_date: string
          user_id: string
          work_experience_id?: number
        }
        Update: {
          company?: string
          end_date?: string
          industry_id?: number
          job_description?: string | null
          location?: string | null
          position?: string
          start_date?: string
          user_id?: string
          work_experience_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "maker_work_experience_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_work_experience_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_work_experience_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_work_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matches: {
        Row: {
          employer_id: string
          employer_viewed_at: string | null
          job_id: number
          matched_at: string | null
          whm_viewed_at: string | null
          whv_id: string
        }
        Insert: {
          employer_id: string
          employer_viewed_at?: string | null
          job_id: number
          matched_at?: string | null
          whm_viewed_at?: string | null
          whv_id: string
        }
        Update: {
          employer_id?: string
          employer_viewed_at?: string | null
          job_id?: number
          matched_at?: string | null
          whm_viewed_at?: string | null
          whv_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_active_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_all_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_inactive_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "matches_whv_id_fkey"
            columns: ["whv_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "matches_whv_id_fkey"
            columns: ["whv_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "matches_whv_id_fkey"
            columns: ["whv_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["maker_id"]
          },
          {
            foreignKeyName: "matches_whv_id_fkey"
            columns: ["whv_id"]
            isOneToOne: false
            referencedRelation: "whv_maker"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_setting: {
        Row: {
          created_at: string | null
          id: number
          notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_setting_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          job_id: number
          message: string
          read_at: string | null
          recipient_id: string
          recipient_type: string | null
          sender_id: string
          sender_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string | null
          id?: never
          job_id: number
          message: string
          read_at?: string | null
          recipient_id: string
          recipient_type?: string | null
          sender_id: string
          sender_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string | null
          id?: never
          job_id?: number
          message?: string
          read_at?: string | null
          recipient_id?: string
          recipient_type?: string | null
          sender_id?: string
          sender_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top10"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_match_scores_top5"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_active_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_all_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_emp_private_inactive_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string | null
          email: string
          encrypt_email: string | null
          id: string
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          encrypt_email?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          encrypt_email?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      region_postcode: {
        Row: {
          area: string
          id: number
          postcode_range: string
          state: string
        }
        Insert: {
          area: string
          id?: number
          postcode_range: string
          state: string
        }
        Update: {
          area?: string
          id?: number
          postcode_range?: string
          state?: string
        }
        Relationships: []
      }
      regional_rules: {
        Row: {
          area: string
          created_at: string | null
          id: number
          industry_id: number | null
          postcode: string
          stage_id: number | null
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
        }
        Insert: {
          area: string
          created_at?: string | null
          id?: never
          industry_id?: number | null
          postcode: string
          stage_id?: number | null
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
        }
        Update: {
          area?: string
          created_at?: string | null
          id?: never
          industry_id?: number | null
          postcode?: string
          stage_id?: number | null
          state?: Database["public"]["Enums"]["state"]
          suburb_city?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "regional_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "regional_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "regional_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "regional_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      visa_stage: {
        Row: {
          label: string
          stage: number
          stage_id: number
          sub_class: string
        }
        Insert: {
          label: string
          stage: number
          stage_id?: number
          sub_class: string
        }
        Update: {
          label?: string
          stage?: number
          stage_id?: number
          sub_class?: string
        }
        Relationships: []
      }
      visa_work_location_rules: {
        Row: {
          area: string
          industry_id: number | null
          postcode: string | null
          rule_id: number
          stage_id: number | null
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          work_location_eligibility: string
        }
        Insert: {
          area: string
          industry_id?: number | null
          postcode?: string | null
          rule_id?: number
          stage_id?: number | null
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          work_location_eligibility: string
        }
        Update: {
          area?: string
          industry_id?: number | null
          postcode?: string | null
          rule_id?: number
          stage_id?: number | null
          state?: Database["public"]["Enums"]["state"]
          suburb_city?: string
          work_location_eligibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_work_location_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      whv_maker: {
        Row: {
          address_line1: string
          address_line2: string | null
          birth_date: string
          created_at: string | null
          family_name: string
          given_name: string
          is_profile_visible: boolean | null
          middle_name: string | null
          mobile_num: string
          nationality: Database["public"]["Enums"]["nationality"]
          postcode: string
          profile_photo: string | null
          state: Database["public"]["Enums"]["state"]
          suburb: string
          tagline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          birth_date: string
          created_at?: string | null
          family_name: string
          given_name: string
          is_profile_visible?: boolean | null
          middle_name?: string | null
          mobile_num: string
          nationality: Database["public"]["Enums"]["nationality"]
          postcode: string
          profile_photo?: string | null
          state: Database["public"]["Enums"]["state"]
          suburb: string
          tagline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          birth_date?: string
          created_at?: string | null
          family_name?: string
          given_name?: string
          is_profile_visible?: boolean | null
          middle_name?: string | null
          mobile_num?: string
          nationality?: Database["public"]["Enums"]["nationality"]
          postcode?: string
          profile_photo?: string | null
          state?: Database["public"]["Enums"]["state"]
          suburb?: string
          tagline?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whv_maker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      vw_eligibility_visa_country_stage_industry: {
        Row: {
          country: string | null
          country_id: number | null
          industry: string | null
          industry_id: number | null
          stage_id: number | null
          visa_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_work_location_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      vw_eligible_visa_country_industry_role: {
        Row: {
          country: string | null
          country_id: number | null
          industry: string | null
          industry_id: number | null
          role: string | null
          role_id: number | null
          stage_id: number | null
          visa_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_work_location_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "visa_work_location_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      vw_emp_match_scores: {
        Row: {
          emp_id: string | null
          given_name: string | null
          industry_pref: string[] | null
          industry_score: number | null
          job_id: number | null
          license_score: number | null
          location_score: number | null
          maker_id: string | null
          match_score: number | null
          matching_rank: number | null
          profile_photo: string | null
          state_pref: string[] | null
          work_experience: Json | null
          work_experience_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
          {
            foreignKeyName: "whv_maker_user_id_fkey"
            columns: ["maker_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vw_emp_match_scores_top10: {
        Row: {
          emp_id: string | null
          given_name: string | null
          industry_pref: string[] | null
          industry_score: number | null
          job_id: number | null
          license_score: number | null
          location_score: number | null
          maker_id: string | null
          match_score: number | null
          matching_rank: number | null
          profile_photo: string | null
          state_pref: string[] | null
          work_experience: Json | null
          work_experience_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
          {
            foreignKeyName: "whv_maker_user_id_fkey"
            columns: ["maker_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vw_emp_match_scores_top5: {
        Row: {
          emp_id: string | null
          given_name: string | null
          industry_pref: string[] | null
          industry_score: number | null
          job_id: number | null
          license_score: number | null
          location_score: number | null
          maker_id: string | null
          match_score: number | null
          matching_rank: number | null
          profile_photo: string | null
          state_pref: string[] | null
          work_experience: Json | null
          work_experience_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
          {
            foreignKeyName: "whv_maker_user_id_fkey"
            columns: ["maker_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vw_emp_private_active_jobs: {
        Row: {
          job_id: number | null
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          location: string | null
          pay_range: Database["public"]["Enums"]["pay_range"] | null
          role: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
        ]
      }
      vw_emp_private_all_jobs: {
        Row: {
          job_id: number | null
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          location: string | null
          pay_range: Database["public"]["Enums"]["pay_range"] | null
          role: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
        ]
      }
      vw_emp_private_inactive_jobs: {
        Row: {
          job_id: number | null
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          location: string | null
          pay_range: Database["public"]["Enums"]["pay_range"] | null
          role: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employer"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_maker_match_scores"
            referencedColumns: ["emp_id"]
          },
        ]
      }
      vw_industry_roles: {
        Row: {
          industry_id: number | null
          industry_name: string | null
          industry_role_id: number | null
          role: string | null
        }
        Relationships: []
      }
      vw_maker_match_scores: {
        Row: {
          company_name: string | null
          emp_id: string | null
          industry: string | null
          industry_score: number | null
          job_id: number | null
          license_score: number | null
          location: string | null
          location_score: number | null
          match_score: number | null
          matching_rank: number | null
          role: string | null
          start_date: string | null
          user_id: string | null
          work_experience_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_user_id_fkey"
            columns: ["emp_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vw_maker_preview_licenses: {
        Row: {
          name: string | null
        }
        Relationships: []
      }
      vw_maker_preview_pref_availability: {
        Row: {
          available_from: string | null
        }
        Insert: {
          available_from?: string | null
        }
        Update: {
          available_from?: string | null
        }
        Relationships: []
      }
      vw_maker_preview_pref_industry: {
        Row: {
          industry: string | null
          industry_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
        ]
      }
      vw_maker_preview_pref_industry_role: {
        Row: {
          industry: string | null
          role: string | null
          role_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "industry_role"
            referencedColumns: ["industry_role_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "maker_pref_industry_role_industry_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_role_id"]
          },
        ]
      }
      vw_maker_preview_pref_location: {
        Row: {
          postcode: string | null
          state: Database["public"]["Enums"]["state"] | null
          suburb_city: string | null
        }
        Insert: {
          postcode?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          suburb_city?: string | null
        }
        Update: {
          postcode?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          suburb_city?: string | null
        }
        Relationships: []
      }
      vw_maker_preview_work_history: {
        Row: {
          company: string | null
          end_date: string | null
          industry: string | null
          job_description: string | null
          location: string | null
          position: string | null
          start_date: string | null
        }
        Relationships: []
      }
      vw_maker_visa: {
        Row: {
          stage_id: number | null
          visa: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maker_visa_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "maker_visa_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      vw_regional_rules_base: {
        Row: {
          area: string | null
          created_at: string | null
          id: number | null
          industry_id: number | null
          industry_name: string | null
          postcode: string | null
          stage_id: number | null
          state: Database["public"]["Enums"]["state"] | null
          suburb_city: string | null
          visa_stage_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "regional_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_eligible_visa_country_industry_role"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "regional_rules_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "vw_industry_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "regional_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "regional_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "vw_stage_eligible_countries"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      vw_stage_eligible_countries: {
        Row: {
          country_id: number | null
          country_name: string | null
          stage_id: number | null
          stage_label: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_match_score: {
        Args: { p_job_post_id: number; p_whv_user_id: string }
        Returns: {
          industry_score: number
          license_score: number
          location_score: number
          match_score: number
          work_experience_score: number
        }[]
      }
      check_nationality_visa_eligiblity: {
        Args: { p_nationality: string }
        Returns: string[]
      }
      fetch_job_matches: {
        Args: { p_job_id: number }
        Returns: {
          availability: string
          country: string
          employer_id: string
          given_name: string
          industry_pref: string[]
          job_id: number
          licenses: string[]
          location: string
          matched_at: string
          profile_photo: string
          state_pref: string[]
          whv_id: string
          work_experience: Json
        }[]
      }
      fetch_job_recommendations: {
        Args: { p_job_id: number }
        Returns: {
          availability: string
          country: string
          given_name: string
          industry_pref: string[]
          industry_score: number
          job_id: number
          license_score: number
          licenses: string[]
          location: string
          location_score: number
          maker_id: string
          match_score: number
          matching_rank: number
          profile_photo: string
          state_pref: string[]
          work_experience: Json
          work_experience_score: number
        }[]
      }
      fetch_whv_matches: {
        Args: { p_whv_id: string }
        Returns: {
          company: string
          description: string
          emp_id: string
          employment_type: string
          industry: string
          job_id: number
          matched_at: string
          postcode: string
          profile_photo: string
          role: string
          salary_range: string
          state: string
          suburb_city: string
        }[]
      }
      fetch_whv_recommendations: {
        Args: { p_whv_id: string }
        Returns: {
          company: string
          description: string
          emp_id: string
          employment_type: string
          industry: string
          industry_score: number
          job_id: number
          license_score: number
          location_score: number
          match_score: number
          matching_rank: number
          postcode: string
          profile_photo: string
          role: string
          salary_range: string
          state: string
          suburb_city: string
          work_experience_score: number
        }[]
      }
      filter_candidates: {
        Args:
          | {
              p_employer_id?: string
              p_filter_industry_ids?: number[]
              p_filter_postcode?: string
              p_filter_state?: string
              p_filter_suburb_city?: string
              p_filter_years_experience?: string
              p_limit?: number
              p_offset?: number
            }
          | {
              p_filter_industry_ids?: number[]
              p_filter_postcode?: string
              p_filter_state?: string
              p_filter_suburb_city?: string
              p_filter_years_experience?: string
              p_limit?: number
              p_offset?: number
            }
        Returns: {
          user_id: string
        }[]
      }
      filter_employer_for_maker: {
        Args: {
          p_filter_availability?: boolean
          p_filter_facility_ids?: number[]
          p_filter_industry_ids?: number[]
          p_filter_job_type?: string
          p_filter_salary_range?: string
          p_filter_state?: string
          p_filter_suburb_city_postcode?: string
          p_maker_id: string
        }
        Returns: {
          company: string
          emp_id: string
          industry: string
          job_description: string
          job_id: number
          job_type: string
          location: string
          profile_photo: string
          role: string
          salary_range: string
        }[]
      }
      filter_employers: {
        Args: {
          p_filter_facility_ids?: number[]
          p_filter_industry_ids?: number[]
          p_filter_job_type?: string
          p_filter_pay_range?: string
          p_filter_postcode?: string
          p_filter_state?: string
          p_filter_suburb_city?: string
        }
        Returns: {
          user_id: string
        }[]
      }
      filter_jobs_for_maker: {
        Args: {
          p_filter_custom_license?: string
          p_filter_facility_ids?: number[]
          p_filter_industry_ids?: number[]
          p_filter_job_type?: string
          p_filter_license_ids?: number[]
          p_filter_salary_range?: string
          p_filter_state?: string
          p_filter_suburb_city_postcode?: string
          p_maker_id: string
        }
        Returns: {
          company: string
          emp_id: string
          industry: string
          job_description: string
          job_id: number
          job_type: string
          licenses: string[]
          location: string
          profile_photo: string
          role: string
          salary_range: string
        }[]
      }
      filter_makers_for_employer: {
        Args: {
          p_emp_id: string
          p_filter_industry_ids?: number[]
          p_filter_license_ids?: number[]
          p_filter_state?: string
          p_filter_suburb_city_postcode?: string
          p_filter_work_industry_id?: number
          p_filter_work_years_experience?: string
          p_job_id?: number
        }
        Returns: {
          given_name: string
          licenses: string[]
          maker_id: string
          maker_states: string[]
          pref_industries: string[]
          profile_photo: string
          work_experience: string
        }[]
      }
      filter_makers_for_employer_v2: {
        Args: {
          p_emp_id: string
          p_filter_custom_license?: string
          p_filter_industry_ids?: number[]
          p_filter_license_ids?: number[]
          p_filter_state?: string
          p_filter_suburb_city_postcode?: string
          p_filter_work_industry_id?: number
          p_filter_work_years_experience?: string
          p_job_id?: number
        }
        Returns: {
          given_name: string
          industry_pref: string[]
          license: string[]
          maker_id: string
          profile_photo: string
          state_pref: string[]
          work_experience: Json
        }[]
      }
      get_emp_about_business1: {
        Args: { p_user_id: string }
        Returns: {
          emp_abn: string
          emp_address_line1: string
          emp_address_line2: string
          emp_mobile_num: string
          emp_postcode: string
          emp_state: Database["public"]["Enums"]["state"]
          emp_suburb_city: string
          emp_website: string
        }[]
      }
      get_emp_private_job_info: {
        Args: { p_job_id: number }
        Returns: {
          description: string
          employment_type: string
          job_id: number
          job_status: string
          location: string
          req_experience: string
          role: string
          salary: string
          start_date: string
        }[]
      }
      get_emp_private_list_jobs: {
        Args: { p_job_status?: string }
        Returns: {
          created_at: string
          job_id: number
          job_status: string
          location: string
          role: string
        }[]
      }
      get_enum_job_type: {
        Args: Record<PropertyKey, never>
        Returns: {
          job_type: string
        }[]
      }
      get_enum_values: {
        Args: { enum_name: string }
        Returns: string[]
      }
      get_enum_years_experience: {
        Args: Record<PropertyKey, never>
        Returns: {
          years_experience: string
        }[]
      }
      get_job_type_enum: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_licenses: {
        Args: Record<PropertyKey, never>
        Returns: {
          license_id: number
          license_name: string
        }[]
      }
      get_list_industry: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          industry: string
        }[]
      }
      get_list_location: {
        Args: Record<PropertyKey, never>
        Returns: {
          location: string
        }[]
      }
      get_maker_industry_roles: {
        Args: { p_user_id: string }
        Returns: {
          maker_industry: string
          maker_role: string
        }[]
      }
      get_maker_license: {
        Args: { p_user_id: string }
        Returns: {
          maker_license: string
        }[]
      }
      get_maker_pref_location: {
        Args: { p_user_id: string }
        Returns: {
          maker_area: string
          maker_state: string
        }[]
      }
      get_maker_profile_data: {
        Args: { p_user_id: string }
        Returns: {
          maker_address_line1: string
          maker_address_line2: string
          maker_birth_date: string
          maker_nationality: string
          maker_phone_num: string
          maker_postcode: string
          maker_state: Database["public"]["Enums"]["state"]
          maker_suburb: string
          maker_visa_expiry: string
          maker_visa_type: string
        }[]
      }
      get_maker_reference: {
        Args: { p_user_id: string }
        Returns: {
          reference_business_name: string
          reference_email: string
          reference_mobile_num: string
          reference_name: string
          reference_role: string
        }[]
      }
      get_maker_tagline: {
        Args: { p_user_id: string }
        Returns: {
          maker_tagline: string
        }[]
      }
      get_maker_visa: {
        Args: { p_maker_id: string }
        Returns: string[]
      }
      get_maker_work_experience: {
        Args: { p_user_id: string }
        Returns: {
          maker_company: string
          maker_description: string
          maker_end_date: string
          maker_industry: string
          maker_location: string
          maker_position: string
          maker_start_date: string
        }[]
      }
      get_pay_range_enum: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_profile_photo_url: {
        Args: { path: string }
        Returns: string
      }
      get_state_suburbcity_postcode: {
        Args: Record<PropertyKey, never>
        Returns: {
          postcode: string
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
        }[]
      }
      get_years_experience_enum: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_matched_with_maker: {
        Args: { p_maker_id: string; p_viewer_id: string }
        Returns: boolean
      }
      mark_notification_read: {
        Args: { p_notification_id: number }
        Returns: undefined
      }
      update_emp_basic_details: {
        Args: {
          p_address_line1: string
          p_address_line2: string
          p_mobile_num: string
          p_postcode: string
          p_state: Database["public"]["Enums"]["state"]
          p_suburb: string
          p_user_id: string
          p_website: string
        }
        Returns: undefined
      }
      update_emp_facility: {
        Args: { p_facility_ids: number[]; p_other?: string; p_user_id: string }
        Returns: undefined
      }
      update_emp_job_type: {
        Args: { p_type_ids: number[]; p_user_id: string }
        Returns: undefined
      }
      update_maker_about_business: {
        Args: {
          p_business_tenure: string
          p_employee_count: string
          p_industry_id: number
          p_pay_range: string
          p_tagline: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_maker_basic_details: {
        Args: {
          p_address_line1: string
          p_address_line2: string
          p_mobile_num: string
          p_postcode: string
          p_state: Database["public"]["Enums"]["state"]
          p_suburb: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_maker_license: {
        Args:
          | { p_license_ids: number[]; p_other?: string; p_user_id: string }
          | { p_type_ids: number[]; p_user_id: string }
        Returns: undefined
      }
      update_maker_tagline: {
        Args: { p_tagline: string; p_user_id: string }
        Returns: undefined
      }
      update_maker_visa: {
        Args: { p_expiry_date: string; p_stage_id: number; p_user_id: string }
        Returns: undefined
      }
      view_all_eligible_jobs: {
        Args: { p_maker_id: string }
        Returns: {
          company: string
          emp_id: string
          industry: string
          job_description: string
          job_id: number
          job_type: string
          location: string
          profile_photo: string
          role: string
          salary_range: string
        }[]
      }
      view_all_eligible_makers: {
        Args: { p_emp_id: string; p_job_id?: number }
        Returns: {
          given_name: string
          industry_pref: string[]
          maker_id: string
          profile_photo: string
          state_pref: string[]
          work_experience: Json
        }[]
      }
      view_all_jobs: {
        Args: { p_is_specified_work: boolean; p_maker_id: string }
        Returns: {
          company: string
          industry: string
          is_specified_work: boolean
          job_description: string
          job_id: number
          job_type: string
          location: string
          profile_photo: string
          role: string
          salary_range: string
        }[]
      }
      view_eligible_industries_for_maker: {
        Args: { p_maker_id: string }
        Returns: {
          id: number
          industry: string
        }[]
      }
      view_eligible_locations_for_maker: {
        Args: { p_industry_id?: number; p_maker_id: string }
        Returns: {
          location: string
          state: string
        }[]
      }
      view_emp_job_partial: {
        Args: { p_emp_id: string; p_job_id: number }
        Returns: {
          company_name: string
          emp_id: string
          employment_type: string
          experience_req: string
          facilities: string[]
          industry: string
          job_description: string
          job_id: number
          job_status: string
          job_title: string
          licenses: string[]
          location: string
          pay_range: string
          profile_photo: string
          start_date: string
          tagline: string
        }[]
      }
      view_maker_partial: {
        Args: { p_maker_id: string }
        Returns: {
          given_name: string
          industry_pref: string[]
          licenses: string[]
          maker_id: string
          profile_photo: string
          state_pref: string
          suburb_city_postcode_pref: string[]
          tagline: string
          work_company: string
          work_end_date: string
          work_industry: string
          work_position: string
          work_start_date: string
          work_years_experience: string
        }[]
      }
    }
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
        | "20+"
      employee_count:
        | "1"
        | "2-5"
        | "6-10"
        | "11-20"
        | "21-50"
        | "51-100"
        | "100+"
      job_status: "active" | "inactive" | "draft"
      job_type_enum:
        | "Full-time"
        | "Part-time"
        | "Casual"
        | "Contract"
        | "Seasonal"
      max_rate: "$25" | "$30" | "$35" | "$40" | "$45" | "$50+"
      min_rate: "$25" | "$30" | "$35" | "$40" | "$45" | "$50+"
      nationality:
        | "Belgium"
        | "Canada"
        | "Republic of Cyprus"
        | "Denmark"
        | "Estonia"
        | "France"
        | "Germany"
        | "Hong Kong"
        | "Ireland"
        | "Italy"
        | "Japan"
        | "Republic of Korea"
        | "Malta"
        | "Netherlands"
        | "Norway"
        | "Sweden"
        | "Taiwan"
        | "United Kingdom"
        | "Argentina"
        | "Austria"
        | "Brazil"
        | "Chile"
        | "China"
        | "Czech Republic"
        | "Ecuador"
        | "Greece"
        | "Hungary"
        | "India"
        | "Indonesia"
        | "Israel"
        | "Luxembourg"
        | "Malaysia"
        | "Mongolia"
        | "Papua New Guinea"
        | "Peru"
        | "Poland"
        | "Portugal"
        | "San Marino"
        | "Singapore"
        | "Slovak Republic"
        | "Slovenia"
        | "Spain"
        | "Switzerland"
        | "Thailand"
        | "Türkiye"
        | "Uruguay"
        | "United States of America"
        | "Vietnam"
      notification_type: "job_like" | "maker_like" | "match"
      pay_range:
        | "$25-30/hour"
        | "$30-35/hour"
        | "$35-40/hour"
        | "$40-45/hour"
        | "$45+/hour"
        | "Undisclosed"
      pay_type: "/hour" | "/day" | "/week" | "/piece"
      state:
        | "Australian Capital Territory"
        | "New South Wales"
        | "Northern Territory"
        | "Queensland"
        | "South Australia"
        | "Tasmania"
        | "Victoria"
        | "Western Australia"
      user_type: "employer" | "whv_maker"
      visa_type:
        | "First Work and Holiday Visa (462)"
        | "Second Work and Holiday Visa (462)"
        | "Third Work and Holiday Visa (462)"
        | "First Working Holiday Visa (417)"
        | "Second Working Holiday Visa (417)"
        | "Third Working Holiday Visa (417)"
      years_experience: "None" | "<1" | "1-2" | "3-4" | "5-7" | "8-10" | "10+"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_tenure: [
        "<1",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6-10",
        "11-15",
        "16-20",
        "20+",
      ],
      employee_count: ["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"],
      job_status: ["active", "inactive", "draft"],
      job_type_enum: [
        "Full-time",
        "Part-time",
        "Casual",
        "Contract",
        "Seasonal",
      ],
      max_rate: ["$25", "$30", "$35", "$40", "$45", "$50+"],
      min_rate: ["$25", "$30", "$35", "$40", "$45", "$50+"],
      nationality: [
        "Belgium",
        "Canada",
        "Republic of Cyprus",
        "Denmark",
        "Estonia",
        "France",
        "Germany",
        "Hong Kong",
        "Ireland",
        "Italy",
        "Japan",
        "Republic of Korea",
        "Malta",
        "Netherlands",
        "Norway",
        "Sweden",
        "Taiwan",
        "United Kingdom",
        "Argentina",
        "Austria",
        "Brazil",
        "Chile",
        "China",
        "Czech Republic",
        "Ecuador",
        "Greece",
        "Hungary",
        "India",
        "Indonesia",
        "Israel",
        "Luxembourg",
        "Malaysia",
        "Mongolia",
        "Papua New Guinea",
        "Peru",
        "Poland",
        "Portugal",
        "San Marino",
        "Singapore",
        "Slovak Republic",
        "Slovenia",
        "Spain",
        "Switzerland",
        "Thailand",
        "Türkiye",
        "Uruguay",
        "United States of America",
        "Vietnam",
      ],
      notification_type: ["job_like", "maker_like", "match"],
      pay_range: [
        "$25-30/hour",
        "$30-35/hour",
        "$35-40/hour",
        "$40-45/hour",
        "$45+/hour",
        "Undisclosed",
      ],
      pay_type: ["/hour", "/day", "/week", "/piece"],
      state: [
        "Australian Capital Territory",
        "New South Wales",
        "Northern Territory",
        "Queensland",
        "South Australia",
        "Tasmania",
        "Victoria",
        "Western Australia",
      ],
      user_type: ["employer", "whv_maker"],
      visa_type: [
        "First Work and Holiday Visa (462)",
        "Second Work and Holiday Visa (462)",
        "Third Work and Holiday Visa (462)",
        "First Working Holiday Visa (417)",
        "Second Working Holiday Visa (417)",
        "Third Working Holiday Visa (417)",
      ],
      years_experience: ["None", "<1", "1-2", "3-4", "5-7", "8-10", "10+"],
    },
  },
} as const
