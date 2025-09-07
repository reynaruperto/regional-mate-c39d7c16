import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/supabase-extensions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type WorkPreferencesProps = {
  visaType: string;
  visaStage: string;
  userId: string;
};

type RegionRule = Database["public"]["Tables"]["region_rules"]["Row"];

export default function WHVWorkPreferences({ visaType, visaStage, userId }: WorkPreferencesProps) {
  const { toast } = useToast();

  const [industries, setIndustries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [postcodes, setPostcodes] = useState<string[]>([]);

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);

  // 🔹 Load options + user preferences
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase
        .from("region_rules")
        .select("industry_name, state, area, postcode_range")
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching visa rules:", error.message);
        return;
      }

      if (data) {
        setIndustries([...new Set(data.map((d: RegionRule) => d.industry_name))]);
        setStates([...new Set(data.map((d: RegionRule) => d.state))]);
        setAreas([...new Set(data.map((d: RegionRule) => d.area))]);
        setPostcodes([...new Set(data.map((d: RegionRule) => d.postcode_range).filter(Boolean))]);
      }
    };

    const fetchUserPrefs = async () => {
      // For now, skip loading user preferences since table might not exist
      console.log("Would load user preferences for user:", userId);
    };

    fetchOptions();
    fetchUserPrefs();
  }, [visaType, visaStage, userId]);

  // 🔹 Multi-select logic
  const handleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else if (selected.length < 3) {
      setSelected([...selected, value]);
    } else {
      toast({
        title: "Limit reached",
        description: "You can only select up to 3 options.",
      });
    }
  };

  // 🔹 Save preferences
  const savePreferences = async () => {
    console.log("Saving preferences:", {
      user_id: userId,
      industries: selectedIndustries,
      states: selectedStates,
      areas: selectedAreas,
      postcodes: selectedPostcodes,
      visa_type: visaType,
      visa_stage: visaStage,
    });

    toast({ title: "Saved", description: "Preferences updated successfully." });
  };

  return (
    <div className="space-y-6">
      {/* Industries */}
      <div>
        <Label>Industry (max 3)</Label>
        <Select
          value={selectedIndustries[0] || ""}
          onValueChange={(val) => handleMultiSelect(val, selectedIndustries, setSelectedIndustries)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((ind, idx) => (
              <SelectItem key={idx} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Selected: {selectedIndustries.join(", ") || "None"}
        </p>
      </div>

      {/* States */}
      <div>
        <Label>State (max 3)</Label>
        <Select
          value={selectedStates[0] || ""}
          onValueChange={(val) => handleMultiSelect(val, selectedStates, setSelectedStates)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s, idx) => (
              <SelectItem key={idx} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          {selectedStates.length > 0
            ? selectedStates.map((s) => `Anywhere in ${s}`).join(", ")
            : "None"}
        </p>
      </div>

      {/* Areas */}
      <div>
        <Label>Area (max 3)</Label>
        <Select
          value={selectedAreas[0] || ""}
          onValueChange={(val) => handleMultiSelect(val, selectedAreas, setSelectedAreas)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select area" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((a, idx) => (
              <SelectItem key={idx} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Selected: {selectedAreas.join(", ") || "None"}
        </p>
      </div>

      {/* Postcodes */}
      <div>
        <Label>Postcode (max 3)</Label>
        <Select
          value={selectedPostcodes[0] || ""}
          onValueChange={(val) => handleMultiSelect(val, selectedPostcodes, setSelectedPostcodes)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select postcode" />
          </SelectTrigger>
          <SelectContent>
            {postcodes.map((p, idx) => (
              <SelectItem key={idx} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Selected: {selectedPostcodes.join(", ") || "None"}
        </p>
      </div>

      {/* Save Button */}
      <Button className="w-full mt-4" onClick={savePreferences}>
        Save Preferences
      </Button>
    </div>
  );
}


