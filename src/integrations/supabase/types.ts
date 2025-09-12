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
          stage_id: number
        }
        Insert: {
          country_id: number
          created_at?: string | null
          eligibility_id?: string
          stage_id: number
        }
        Update: {
          country_id?: number
          created_at?: string | null
          eligibility_id?: string
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
            foreignKeyName: "country_eligibility_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      employer: {
        Row: {
          abn: string
          address_line1: string | null
          address_line2: string | null
          business_tenure: Database["public"]["Enums"]["business_tenure"] | null
          company_name: string | null
          created_at: string | null
          employee_count: Database["public"]["Enums"]["employee_count"] | null
          family_name: string | null
          given_name: string
          industry_id: number | null
          middle_name: string | null
          mobile_num: string | null
          pay_range: Database["public"]["Enums"]["pay_range"] | null
          postcode: string | null
          profile_photo: string | null
          state: Database["public"]["Enums"]["state"] | null
          suburb_city: string | null
          tagline: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          abn: string
          address_line1?: string | null
          address_line2?: string | null
          business_tenure?:
            | Database["public"]["Enums"]["business_tenure"]
            | null
          company_name?: string | null
          created_at?: string | null
          employee_count?: Database["public"]["Enums"]["employee_count"] | null
          family_name?: string | null
          given_name: string
          industry_id?: number | null
          middle_name?: string | null
          mobile_num?: string | null
          pay_range?: Database["public"]["Enums"]["pay_range"] | null
          postcode?: string | null
          profile_photo?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          suburb_city?: string | null
          tagline?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          abn?: string
          address_line1?: string | null
          address_line2?: string | null
          business_tenure?:
            | Database["public"]["Enums"]["business_tenure"]
            | null
          company_name?: string | null
          created_at?: string | null
          employee_count?: Database["public"]["Enums"]["employee_count"] | null
          family_name?: string | null
          given_name?: string
          industry_id?: number | null
          middle_name?: string | null
          mobile_num?: string | null
          pay_range?: Database["public"]["Enums"]["pay_range"] | null
          postcode?: string | null
          profile_photo?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          suburb_city?: string | null
          tagline?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
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
      employer_job_type: {
        Row: {
          type_id: number
          user_id: string
        }
        Insert: {
          type_id: number
          user_id: string
        }
        Update: {
          type_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_job_type_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "job_type"
            referencedColumns: ["type_id"]
          },
          {
            foreignKeyName: "employer_job_type_user_id_fkey"
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
            referencedRelation: "v_visa_stage_industries_roles"
            referencedColumns: ["industry_id"]
          },
        ]
      }
      job: {
        Row: {
          created_at: string | null
          description: string
          job_id: number
          job_status: Database["public"]["Enums"]["job_status"]
          job_type: Database["public"]["Enums"]["job_type_enum"]
          max_rate: Database["public"]["Enums"]["max_rate"]
          min_rate: Database["public"]["Enums"]["min_rate"]
          pay_type: Database["public"]["Enums"]["pay_type"]
          postcode: string | null
          requires_experience: boolean | null
          role: string
          state: Database["public"]["Enums"]["state"] | null
          suburb_city: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          job_id?: number
          job_status?: Database["public"]["Enums"]["job_status"]
          job_type: Database["public"]["Enums"]["job_type_enum"]
          max_rate: Database["public"]["Enums"]["max_rate"]
          min_rate: Database["public"]["Enums"]["min_rate"]
          pay_type: Database["public"]["Enums"]["pay_type"]
          postcode?: string | null
          requires_experience?: boolean | null
          role: string
          state?: Database["public"]["Enums"]["state"] | null
          suburb_city?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          job_id?: number
          job_status?: Database["public"]["Enums"]["job_status"]
          job_type?: Database["public"]["Enums"]["job_type_enum"]
          max_rate?: Database["public"]["Enums"]["max_rate"]
          min_rate?: Database["public"]["Enums"]["min_rate"]
          pay_type?: Database["public"]["Enums"]["pay_type"]
          postcode?: string | null
          requires_experience?: boolean | null
          role?: string
          state?: Database["public"]["Enums"]["state"] | null
          suburb_city?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "job_license_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "license"
            referencedColumns: ["license_id"]
          },
        ]
      }
      job_type: {
        Row: {
          type: string
          type_id: number
        }
        Insert: {
          type: string
          type_id?: number
        }
        Update: {
          type?: string
          type_id?: number
        }
        Relationships: []
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
            referencedRelation: "profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maker_preference: {
        Row: {
          created_at: string
          industry_role_id: number
          preference_id: number
          region_rules_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          industry_role_id: number
          preference_id?: number
          region_rules_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          industry_role_id?: number
          preference_id?: number
          region_rules_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_preference_industry_role_id_fkey"
            columns: ["industry_role_id"]
            isOneToOne: false
            referencedRelation: "industry_role"
            referencedColumns: ["industry_role_id"]
          },
          {
            foreignKeyName: "maker_preference_region_rules_id_fkey"
            columns: ["region_rules_id"]
            isOneToOne: false
            referencedRelation: "region_rules"
            referencedColumns: ["region_rules_id"]
          },
          {
            foreignKeyName: "maker_preference_user_id_fkey"
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
            foreignKeyName: "maker_visa_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      maker_visa_eligibility: {
        Row: {
          country_id: number | null
          id: string
          industry_id: number | null
          stage_id: number | null
        }
        Insert: {
          country_id?: number | null
          id?: string
          industry_id?: number | null
          stage_id?: number | null
        }
        Update: {
          country_id?: number | null
          id?: string
          industry_id?: number | null
          stage_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maker_visa_eligibility_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["country_id"]
          },
          {
            foreignKeyName: "maker_visa_eligibility_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_visa_eligibility_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "v_visa_stage_industries_roles"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "maker_visa_eligibility_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "visa_stage"
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
            referencedRelation: "v_visa_stage_industries_roles"
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
      region_rules: {
        Row: {
          area: string
          created_at: string | null
          id: string
          industry_id: number | null
          postcode_range: string | null
          region_rules_id: number
          stage: number
          state: string
          sub_class: string
        }
        Insert: {
          area: string
          created_at?: string | null
          id?: string
          industry_id?: number | null
          postcode_range?: string | null
          region_rules_id?: number
          stage: number
          state: string
          sub_class: string
        }
        Update: {
          area?: string
          created_at?: string | null
          id?: string
          industry_id?: number | null
          postcode_range?: string | null
          region_rules_id?: number
          stage?: number
          state?: string
          sub_class?: string
        }
        Relationships: []
      }
      temp_eligibility: {
        Row: {
          country_name: string
          industry_id: number | null
          industry_name: string
          stage: number
          sub_class: string
        }
        Insert: {
          country_name: string
          industry_id?: number | null
          industry_name: string
          stage: number
          sub_class: string
        }
        Update: {
          country_name?: string
          industry_id?: number | null
          industry_name?: string
          stage?: number
          sub_class?: string
        }
        Relationships: []
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
      v_visa_stage_industries_roles: {
        Row: {
          area: string | null
          country_name: string | null
          industry_id: number | null
          industry_name: string | null
          role_name: string | null
          stage: number | null
          state: string | null
          sub_class: string | null
          visa_stage_label: string | null
        }
        Relationships: []
      }
      vw_emp_full_profile: {
        Row: {
          business_tenure: Database["public"]["Enums"]["business_tenure"] | null
          company_name: string | null
          employee_count: Database["public"]["Enums"]["employee_count"] | null
          industry: string | null
          location: string | null
          pay_range: Database["public"]["Enums"]["pay_range"] | null
          tagline: string | null
          website: string | null
        }
        Relationships: []
      }
      vw_emp_private_active_jobs: {
        Row: {
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          role: string | null
          status: Database["public"]["Enums"]["job_status"] | null
        }
        Relationships: []
      }
      vw_emp_private_all_jobs: {
        Row: {
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          role: string | null
          status: Database["public"]["Enums"]["job_status"] | null
        }
        Relationships: []
      }
      vw_emp_public_profile: {
        Row: {
          business_tenure: Database["public"]["Enums"]["business_tenure"] | null
          company_name: string | null
          employee_count: Database["public"]["Enums"]["employee_count"] | null
          industry: string | null
          location: string | null
          pay_range: Database["public"]["Enums"]["pay_range"] | null
          tagline: string | null
          website: string | null
        }
        Relationships: []
      }
      vw_maker_private_profile: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          family_name: string | null
          given_name: string | null
          middle_name: string | null
          mobile_num: string | null
          postcode: string | null
          state: Database["public"]["Enums"]["state"] | null
          suburb: string | null
          tagline: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          family_name?: string | null
          given_name?: string | null
          middle_name?: string | null
          mobile_num?: string | null
          postcode?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          suburb?: string | null
          tagline?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          family_name?: string | null
          given_name?: string | null
          middle_name?: string | null
          mobile_num?: string | null
          postcode?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          suburb?: string | null
          tagline?: string | null
        }
        Relationships: []
      }
      vw_maker_work_history: {
        Row: {
          company: string | null
          location: string | null
          position: string | null
          years_of_experience: unknown | null
        }
        Insert: {
          company?: string | null
          location?: string | null
          position?: string | null
          years_of_experience?: never
        }
        Update: {
          company?: string | null
          location?: string | null
          position?: string | null
          years_of_experience?: never
        }
        Relationships: []
      }
      vw_maker_work_preference: {
        Row: {
          area: string | null
          industry: string | null
          role: string | null
          state: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_profile_photo_url: {
        Args: { path: string }
        Returns: string
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
      update_maker_visa: {
        Args: { p_expiry_date: string; p_stage_id: number; p_user_id: string }
        Returns: undefined
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
        | "Casual / Seasonal"
        | "Contract"
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
      pay_range:
        | "$25-30/hour"
        | "$30-35/hour"
        | "$35-40/hour"
        | "$40-45/hour"
        | "$45+/hour"
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
        "Casual / Seasonal",
        "Contract",
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
      pay_range: [
        "$25-30/hour",
        "$30-35/hour",
        "$35-40/hour",
        "$40-45/hour",
        "$45+/hour",
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
    },
  },
} as const
