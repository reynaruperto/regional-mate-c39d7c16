import { createClient } from '@supabase/supabase-js';
import type { Database } from "./types";

const SUPABASE_URL = "https://xiymsnmlwffikkhwatcp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeW1zbm1sd2ZmaWtraHdhdGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTEzNTIsImV4cCI6MjA3MTQyNzM1Mn0.nKJHOzcMMOY7sSOjGVyLUGkOZW_hgaS8zvhTg4Z_7lc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});