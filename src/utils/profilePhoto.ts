import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a profile photo value to a public URL
 * Handles three cases:
 * 1. Full URL (starts with http) - return as is
 * 2. UUID folder name - list files and get first one
 * 3. Null/empty - return default avatar
 */
export const resolveProfilePhoto = async (
  photoValue?: string | null
): Promise<string> => {
  // Case 1: No photo
  if (!photoValue || photoValue.trim() === "") {
    return "/default-avatar.png";
  }

  // Case 2: Already a full URL
  if (photoValue.startsWith("http")) {
    return photoValue;
  }

  // Case 3: UUID folder name - need to list files inside
  try {
    const { data: fileList } = await supabase.storage
      .from("profile_photo")
      .list(photoValue, { limit: 1 });

    if (fileList && fileList.length > 0) {
      const fileName = fileList[0].name;
      const { data } = supabase.storage
        .from("profile_photo")
        .getPublicUrl(`${photoValue}/${fileName}`);
      return data?.publicUrl || "/default-avatar.png";
    }
  } catch (error) {
    console.error("Error resolving photo from folder:", photoValue, error);
  }

  // Fallback: try as direct path (legacy support)
  const { data } = supabase.storage
    .from("profile_photo")
    .getPublicUrl(photoValue);
  return data?.publicUrl || "/default-avatar.png";
};
