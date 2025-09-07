import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Props
interface WorkPreferencesProps {
  visaType: "417" | "462";
  visaStage: 1 | 2 | 3;
}

// ✅ Type for Supabase rows
type RegionRule = {
  industry_name: string;
  state: string;
  area: string;
  postcode_range: string;
};

const WorkPreferences: React.FC<WorkPreferencesProps> = ({ visaType, visaStage }) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [postcode, setPostcode] = useState("");
  const [tooltip, setTooltip] = useState("");

  // ✅ Load industries based on visaType & stage
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("region_rules")
        .select("industry_name")
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching industries:", error);
        return;
      }

      const uniqueIndustries = Array.from(
        new Set((data as RegionRule[]).map((row) => row.industry_name))
      ).slice(0, 3); // max 3 for prompt length

      setIndustries(uniqueIndustries);
    };

    fetchIndustries();
  }, [visaType, visaStage]);

  // ✅ Load states based on selected industry
  useEffect(() => {
    if (!selectedIndustry) return;

    const fetchStates = async () => {
      const { data, error } = await supabase
        .from("region_rules")
        .select("state")
        .eq("industry_name", selectedIndustry)
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching states:", error);
        return;
      }

      const uniqueStates = Array.from(
        new Set((data as RegionRule[]).map((row) => row.state))
      ).slice(0, 3);

      setStates(uniqueStates);
    };

    fetchStates();
  }, [selectedIndustry, visaType, visaStage]);

  // ✅ Load areas based on selected state
  useEffect(() => {
    if (!selectedState) return;

    const fetchAreas = async () => {
      const { data, error } = await supabase
        .from("region_rules")
        .select("area")
        .eq("industry_name", selectedIndustry)
        .eq("state", selectedState)
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching areas:", error);
        return;
      }

      const uniqueAreas = Array.from(
        new Set((data as RegionRule[]).map((row) => row.area))
      ).slice(0, 3);

      setAreas(uniqueAreas);
    };

    fetchAreas();
  }, [selectedState, selectedIndustry, visaType, visaStage]);

  // ✅ Tooltip check
  const checkEligibility = async () => {
    if (!selectedIndustry || !selectedState || !selectedArea || !postcode) {
      setTooltip("⚠️ Please select all fields.");
      return;
    }

    const { data, error } = await supabase
      .from("region_rules")
      .select("postcode_range")
      .eq("industry_name", selectedIndustry)
      .eq("state", selectedState)
      .eq("area", selectedArea)
      .eq("sub_class", visaType)
      .eq("stage", visaStage);

    if (error) {
      console.error("Error checking eligibility:", error);
      setTooltip("⚠️ Error checking eligibility.");
      return;
    }

    const ranges = (data as RegionRule[]).map((row) => row.postcode_range);

    const valid = ranges.some((range) => {
      if (range === "All postcodes") return true;
      return range.includes(postcode);
    });

    setTooltip(
      valid
        ? `✅ ${selectedIndustry} counts in ${selectedState} (${selectedArea})`
        : `⚠️ ${selectedIndustry} does not count in ${selectedState} (${selectedArea})`
    );
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-bold">Work Preferences</h2>

      {/* Industry */}
      <div>
        <Label>Industry</Label>
        <Select onValueChange={setSelectedIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State */}
      <div>
        <Label>State</Label>
        <Select onValueChange={setSelectedState}>
          <SelectTrigger>
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
      </div>

      {/* Area */}
      <div>
        <Label>Area</Label>
        <Select onValueChange={setSelectedArea}>
          <SelectTrigger>
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
      </div>

      {/* Postcode */}
      <div>
        <Label>Postcode</Label>
        <Input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="Enter postcode"
        />
      </div>

      {/* Button */}
      <Button onClick={checkEligibility}>Check Eligibility</Button>

      {/* Tooltip */}
      {tooltip && <p className="mt-2 text-sm">{tooltip}</p>}
    </div>
  );
};

export default WorkPreferences;


