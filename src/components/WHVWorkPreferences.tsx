import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

// Replace with props or context if you already store user selections
const selectedSubclass = "462"; // example: "417" or "462"
const selectedStage = 2; // example: 1, 2, or 3

interface IndustryRoleData {
  industry_id: number;
  industry_name: string;
  industry_role_id: number;
  role_name: string;
  state: string;
  area: string;
}

const WorkPreferences: React.FC = () => {
  const navigate = useNavigate();
  const [profileTagline, setProfileTagline] = useState("");
  const [industries, setIndustries] = useState<IndustryRoleData[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("v_visa_stage_industries_roles")
        .select("industry_id, industry_name, industry_role_id, role_name, state, area")
        .eq("sub_class", selectedSubclass)
        .eq("stage", selectedStage);

      if (error) {
        console.error("Error fetching industries:", error);
      } else {
        setIndustries(data || []);
      }
    };

    fetchIndustries();
  }, []);

  const handleContinue = () => {
    console.log("Profile Tagline:", profileTagline);
    console.log("Selected Industries:", selectedIndustries);
    console.log("Selected States:", selectedStates);
    console.log("Selected Areas:", selectedAreas);

    navigate("/next-step"); // adjust route
  };

  // Deduplicate industries for dropdown
  const uniqueIndustries = Array.from(
    new Map(industries.map((item) => [item.industry_id, item])).values()
  );

  // Deduplicate states
  const uniqueStates = Array.from(new Set(industries.map((i) => i.state))).filter(Boolean);

  // Deduplicate areas
  const uniqueAreas = Array.from(new Set(industries.map((i) => i.area))).filter(Boolean);

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2">
        <ArrowLeft size={20} /> <span>Back</span>
      </button>

      <h1 className="text-xl font-bold text-center">Work Preferences</h1>
      <p className="text-sm text-gray-500 text-center">
        Showing industries eligible for your visa ({selectedSubclass}, stage {selectedStage})
      </p>

      <div className="space-y-4">
        <div>
          <Label>Profile Tagline *</Label>
          <Input
            placeholder="Add a short tagline..."
            value={profileTagline}
            onChange={(e) => setProfileTagline(e.target.value)}
          />
        </div>

        <div>
          <Label>Select up to 3 industries *</Label>
          <Select
            onValueChange={(value) =>
              setSelectedIndustries((prev) =>
                prev.includes(Number(value)) ? prev : [...prev, Number(value)].slice(0, 3)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose industries" />
            </SelectTrigger>
            <SelectContent>
              {uniqueIndustries.map((ind) => (
                <SelectItem key={ind.industry_id} value={String(ind.industry_id)}>
                  {ind.industry_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Preferred States (up to 3) *</Label>
          <div className="grid grid-cols-2 gap-2">
            {uniqueStates.map((state) => (
              <label key={state} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedStates.includes(state)}
                  onCheckedChange={(checked) =>
                    setSelectedStates((prev) =>
                      checked
                        ? [...prev, state].slice(0, 3)
                        : prev.filter((s) => s !== state)
                    )
                  }
                />
                <span>{state}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Preferred Areas (up to 3) *</Label>
          <div className="grid grid-cols-2 gap-2">
            {uniqueAreas.map((area) => (
              <label key={area} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedAreas.includes(area)}
                  onCheckedChange={(checked) =>
                    setSelectedAreas((prev) =>
                      checked
                        ? [...prev, area].slice(0, 3)
                        : prev.filter((a) => a !== area)
                    )
                  }
                />
                <span>{area}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button className="w-full mt-6" onClick={handleContinue}>
        Continue →
      </Button>
    </div>
  );
};

export default WorkPreferences;


