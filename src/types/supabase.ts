export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          eligibility_id: string
          stage_id: number
          created_at: string | null
          id: number
          country_id: number
        }
        Insert: {
          eligibility_id?: string
          stage_id: number
          created_at?: string | null
          id?: number
          country_id: number
        }
        Update: {
          eligibility_id?: string
          stage_id?: number
          created_at?: string | null
          id?: number
          country_id?: number
        }
        Relationships: []
      }
      employer: {
        Row: {
          user_id: string
          given_name: string
          middle_name: string | null
          family_name: string
          abn: string
          company_name: string
          tagline: string | null
          business_tenure: Database["public"]["Enums"]["business_tenure"]
          employee_count: Database["public"]["Enums"]["employee_count"]
          mobile_num: string
          website: string | null
          profile_photo: string | null
          address_line1: string
          address_line2: string | null
          suburb_city: string
          state: Database["public"]["Enums"]["state"]
          postcode: string | null
          industry_id: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          given_name: string
          middle_name?: string | null
          family_name: string
          abn: string
          company_name: string
          tagline?: string | null
          business_tenure: Database["public"]["Enums"]["business_tenure"]
          employee_count: Database["public"]["Enums"]["employee_count"]
          mobile_num: string
          website?: string | null
          profile_photo?: string | null
          address_line1: string
          address_line2?: string | null
          suburb_city: string
          state: Database["public"]["Enums"]["state"]
          postcode?: string | null
          industry_id: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          given_name?: string
          middle_name?: string | null
          family_name?: string
          abn?: string
          company_name?: string
          tagline?: string | null
          business_tenure?: Database["public"]["Enums"]["business_tenure"]
          employee_count?: Database["public"]["Enums"]["employee_count"]
          mobile_num?: string
          website?: string | null
          profile_photo?: string | null
          address_line1?: string
          address_line2?: string | null
          suburb_city?: string
          state?: Database["public"]["Enums"]["state"]
          postcode?: string | null
          industry_id?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employer_facility: {
        Row: {
          user_id: string
          facility_id: number
          other: string | null
        }
        Insert: {
          user_id: string
          facility_id: number
          other?: string | null
        }
        Update: {
          user_id?: string
          facility_id?: number
          other?: string | null
        }
        Relationships: []
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
          industry_role_id: number
          industry_id: number | null
          role: string
        }
        Insert: {
          industry_role_id?: number
          industry_id?: number | null
          role: string
        }
        Update: {
          industry_role_id?: number
          industry_id?: number | null
          role?: string
        }
        Relationships: []
      }
      job: {
        Row: {
          job_id: number
          description: string
          job_status: Database["public"]["Enums"]["job_status"]
          user_id: string
          created_at: string | null
          updated_at: string | null
          industry_role_id: number | null
          salary_range: string | null
          req_experience: string
          postcode: string | null
          start_date: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
        }
        Insert: {
          job_id?: number
          description: string
          job_status?: Database["public"]["Enums"]["job_status"]
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          industry_role_id?: number | null
          salary_range?: string | null
          req_experience: string
          postcode?: string | null
          start_date: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
        }
        Update: {
          job_id?: number
          description?: string
          job_status?: Database["public"]["Enums"]["job_status"]
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          industry_role_id?: number | null
          salary_range?: string | null
          req_experience?: string
          postcode?: string | null
          start_date?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          state?: Database["public"]["Enums"]["state"]
          suburb_city?: string
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
          user_id: string
          license_id: number
          other: string | null
        }
        Insert: {
          user_id: string
          license_id: number
          other?: string | null
        }
        Update: {
          user_id?: string
          license_id?: number
          other?: string | null
        }
        Relationships: []
      }
      maker_preference: {
        Row: {
          preference_id: number
          user_id: string
          industry_role_id: number
          region_rules_id: number
          created_at: string
        }
        Insert: {
          preference_id?: number
          user_id: string
          industry_role_id: number
          region_rules_id: number
          created_at?: string
        }
        Update: {
          preference_id?: number
          user_id?: string
          industry_role_id?: number
          region_rules_id?: number
          created_at?: string
        }
        Relationships: []
      }
      maker_pref_location: {
        Row: {
          id: string
          user_id: string
          suburb_city: string
          state: Database["public"]["Enums"]["state"]
          postcode: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          suburb_city: string
          state: Database["public"]["Enums"]["state"]
          postcode?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          suburb_city?: string
          state?: Database["public"]["Enums"]["state"]
          postcode?: string | null
          created_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      maker_work_experience: {
        Row: {
          work_experience_id: number
          user_id: string
          company: string
          position: string
          start_date: string
          end_date: string
          location: string | null
          industry_id: number
          job_description: string | null
        }
        Insert: {
          work_experience_id?: number
          user_id: string
          company: string
          position: string
          start_date: string
          end_date: string
          location?: string | null
          industry_id: number
          job_description?: string | null
        }
        Update: {
          work_experience_id?: number
          user_id?: string
          company?: string
          position?: string
          start_date?: string
          end_date?: string
          location?: string | null
          industry_id?: number
          job_description?: string | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          id: string
          user_id: string
          email: string
          created_at: string | null
          updated_at: string | null
          user_type: string | null
          encrypt_email: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          created_at?: string | null
          updated_at?: string | null
          user_type?: string | null
          encrypt_email?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          created_at?: string | null
          updated_at?: string | null
          user_type?: string | null
          encrypt_email?: string | null
        }
        Relationships: []
      }
      whv_maker: {
        Row: {
          user_id: string
          given_name: string
          middle_name: string | null
          family_name: string
          birth_date: string
          nationality: Database["public"]["Enums"]["nationality"]
          tagline: string | null
          mobile_num: string
          address_line1: string
          address_line2: string | null
          suburb: string
          state: Database["public"]["Enums"]["state"]
          postcode: string
          is_profile_visible: boolean | null
          profile_photo: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          given_name: string
          middle_name?: string | null
          family_name: string
          birth_date: string
          nationality: Database["public"]["Enums"]["nationality"]
          tagline?: string | null
          mobile_num: string
          address_line1: string
          address_line2?: string | null
          suburb: string
          state: Database["public"]["Enums"]["state"]
          postcode: string
          is_profile_visible?: boolean | null
          profile_photo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          given_name?: string
          middle_name?: string | null
          family_name?: string
          birth_date?: string
          nationality?: Database["public"]["Enums"]["nationality"]
          tagline?: string | null
          mobile_num?: string
          address_line1?: string
          address_line2?: string | null
          suburb?: string
          state?: Database["public"]["Enums"]["state"]
          postcode?: string
          is_profile_visible?: boolean | null
          profile_photo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mvw_emp_location_roles: {
        Row: {
          industry: string
          industry_role: string
          state: Database["public"]["Enums"]["state"]
          suburb_city: string
          postcode: string
          industry_id: number
          industry_role_id: number
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_status: "draft" | "active" | "closed"
      employment_type: "full_time" | "part_time" | "casual" | "contract"
      state: "Queensland" | "New South Wales" | "Victoria" | "South Australia" | "Western Australia" | "Tasmania" | "Northern Territory" | "Australian Capital Territory"
      nationality: "Philippines" | "Singapore" | "United Kingdom" | "Germany" | "France" | "United States" | "Canada" | "Japan" | "South Korea" | "India"
      business_tenure: "Less than 1 year" | "1-2 years" | "3-5 years" | "5-10 years" | "10+ years"
      employee_count: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}