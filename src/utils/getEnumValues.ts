// src/utils/getEnumValues.ts
import { supabase } from "@/integrations/supabase/client";

export async function getEnumValues(enumName: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_enum_values", {
    enum_name: enumName,
  });

  if (error) {
    console.error(`Error fetching ${enumName}:`, error);
    return [];
  }

  return data || [];
}