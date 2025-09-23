// src/utils/getEnumValues.ts
export async function getEnumValues(enumName: string): Promise<string[]> {
  // Hardcoded values due to type issues with get_enum_values RPC
  const enumMap: Record<string, string[]> = {
    state: ["Queensland", "New South Wales", "Victoria", "Western Australia", "South Australia", "Tasmania", "Northern Territory", "Australian Capital Territory"],
    employment_type: ["Full-time", "Part-time", "Casual", "Contract"],
    salary_range: ["$18-$25", "$25-$30", "$30-$35", "$35-$40", "$40+"],
    years_experience: ["None", "<1", "1-2", "3-4", "5-7", "8-10", "10+"],
    business_tenure: ["Less than 1 year", "1-2 years", "3-5 years", "5-10 years", "10+ years"],
    employee_count: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
  };

  return enumMap[enumName] || [];
}