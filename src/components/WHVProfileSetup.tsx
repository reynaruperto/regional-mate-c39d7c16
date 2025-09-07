import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/supabase-extensions";

// ✅ Types
type VisaRule = Database["public"]["Tables"]["visa_rules"]["Row"];
type UserWorkPreference = Database["public"]["Tables"]["user_work_preferences"]["Row"];

interface WorkPreferencesProps {
  visaType: string;
  visaStage: string;
}

const WHVWorkPreferences: React.FC<WorkPreferencesProps> = ({ visaType, visaStage }) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [postcodes, setPostcodes] = useState<string[]>([]);

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [postcode, setPostcode] = useState("");

  // 🔹 Fetch options from Supabase
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase
        .from("visa_rules")
        .select("industry_name, state, area, postcode_range")
        .eq("visa_type", visaType)
        .eq("visa_stage", visaStage);

      if (!error && data) {
        setIndustries([...new Set(data.map((r: VisaRule) => r.industry_name))]);
        setStates([...new Set(data.map((r: VisaRule) => r.state))]);
        setAreas([...new Set(data.map((r: VisaRule) => r.area))]);
        setPostcodes([...new Set(data.map((r: VisaRule) => r.postcode_range))]);
      }
    };

    fetchOptions();
  }, [visaType, visaStage]);

  // 🔹 Multi-select (max 3)
  const handleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else if (selected.length < 3) {
      setSelected([...selected, value]);
    }
  };

  // 🔹 Save preferences
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not logged in");
      return;
    }

    const { error } = await supabase.from("user_work_preferences").upsert(
      [
        {
          user_id: user.id,
          industries: selectedIndustries,
          states: selectedStates,
          areas: selectedAreas,
          postcodes: selectedPostcodes,
          visa_type: visaType,
          visa_stage: visaStage,
        } as UserWorkPreference,
      ],
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving preferences:", error);
      alert("Error saving preferences");
    } else {
      alert("Preferences saved successfully!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] shadow-2xl flex items-center justify-center">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-white">
            <h1 className="text-lg font-bold">Work Preferences</h1>
            <p className="text-sm text-gray-500">
              Select your industry, state, area, and postcode to check eligibility.
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Industry */}
            <div>
              <Label>Industry (max 3)</Label>
              <Select onValueChange={(val) => handleMultiSelect(val, selectedIndustries, setSelectedIndustries)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selected: {selectedIndustries.join(", ") || "None"}</p>
            </div>

            {/* State */}
            <div>
              <Label>State (max 3)</Label>
              <Select onValueChange={(val) => handleMultiSelect(val, selectedStates, setSelectedStates)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selected: {selectedStates.join(", ") || "None"}</p>
            </div>

            {/* Area */}
            <div>
              <Label>Area (max 3)</Label>
              <Select onValueChange={(val) => handleMultiSelect(val, selectedAreas, setSelectedAreas)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((ar) => (
                    <SelectItem key={ar} value={ar}>
                      {ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selected: {selectedAreas.join(", ") || "None"}</p>
            </div>

            {/* Postcode */}
            <div>
              <Label>Postcode</Label>
              <Input
                className="mt-1"
                placeholder="Enter postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <Button className="w-full h-12 text-lg" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;





