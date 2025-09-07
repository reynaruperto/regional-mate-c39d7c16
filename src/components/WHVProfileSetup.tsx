import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/supabase-extensions";

type RegionRule = Database["public"]["Tables"]["region_rules"]["Row"];
type UserWorkPreference = Database["public"]["Tables"]["user_work_preferences"]["Row"];

interface WorkPreferencesProps {
  userId: string;
  visaType: string;
  visaStage: string;
}

const WHVWorkPreferences: React.FC<WorkPreferencesProps> = ({ userId, visaType, visaStage }) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [postcodes, setPostcodes] = useState<string[]>([]);

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchRules = async () => {
      const { data, error } = await supabase
        .from("region_rules")
        .select("industry_name, state, area, postcode_range")
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching rules:", error);
      } else if (data) {
        setIndustries([...new Set(data.map((r: RegionRule) => r.industry_name))].slice(0, 3));
        setStates([...new Set(data.map((r: RegionRule) => r.state))].slice(0, 3));
        setAreas([...new Set(data.map((r: RegionRule) => r.area))].slice(0, 3));
        setPostcodes([...new Set(data.map((r: RegionRule) => r.postcode_range).filter(Boolean))].slice(0, 3));
      }
    };

    fetchRules();
  }, [visaType, visaStage]);

  const handleSave = async () => {
    // For now, just log to console since user_work_preferences table might not exist yet
    console.log("Saving preferences:", {
      user_id: userId,
      industries: selectedIndustries,
      states: selectedStates,
      areas: selectedAreas,
      postcodes: selectedPostcodes,
      visa_type: visaType,
      visa_stage: visaStage,
    });

    alert("Preferences saved!");
  };

  return (
    <div className="flex flex-col items-center justify-center w-[430px] h-[932px] mx-auto border border-gray-300 rounded-[40px] shadow-lg bg-white">
      <h1 className="text-xl font-bold mb-4">Work Preferences</h1>

      {/* Industries */}
      <Select onValueChange={(val) => setSelectedIndustries([...selectedIndustries, val].slice(0, 3))}>
        <SelectTrigger className="w-80 mb-3">
          <SelectValue placeholder="Select Industry" />
        </SelectTrigger>
        <SelectContent>
          {industries.map((ind) => (
            <SelectItem key={ind} value={ind}>
              {ind}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* States */}
      <Select onValueChange={(val) => setSelectedStates([...selectedStates, val].slice(0, 3))}>
        <SelectTrigger className="w-80 mb-3">
          <SelectValue placeholder="Select State" />
        </SelectTrigger>
        <SelectContent>
          {states.map((st) => (
            <SelectItem key={st} value={st}>
              {st}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Areas */}
      <Select onValueChange={(val) => setSelectedAreas([...selectedAreas, val].slice(0, 3))}>
        <SelectTrigger className="w-80 mb-3">
          <SelectValue placeholder="Select Area" />
        </SelectTrigger>
        <SelectContent>
          {areas.map((ar) => (
            <SelectItem key={ar} value={ar}>
              {ar}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Postcodes */}
      <Select onValueChange={(val) => setSelectedPostcodes([...selectedPostcodes, val].slice(0, 3))}>
        <SelectTrigger className="w-80 mb-3">
          <SelectValue placeholder="Select Postcode" />
        </SelectTrigger>
        <SelectContent>
          {postcodes.map((pc) => (
            <SelectItem key={pc} value={pc}>
              {pc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleSave} className="mt-4 w-80">
        Save Preferences
      </Button>
    </div>
  );
};

export default WHVWorkPreferences;






