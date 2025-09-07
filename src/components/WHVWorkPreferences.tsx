import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

interface IndustryRoleData {
  industry_id: number;
  industry_name: string;
  industry_role_id: number;
  role_name: string;
  state: string;
  area: string;
}

interface LocationState {
  countryId: number;
  stageId: number;
  subClass: string;
}

const WorkPreferences: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { countryId, stageId, subClass } = (location.state as LocationState) || {};

  const [profileTagline, setProfileTagline] = useState("");
  const [industries, setIndustries] = useState<IndustryRoleData[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      if (!countryId || !stageId || !subClass) return;

      const { data, error } = await (supabase as any)
        .from("v_visa_stage_industries_roles")
        .select("industry_id, industry_name, industry_role_id, role_name, state, area")
        .eq("sub_class", subClass)
        .eq("stage", stageId)
        .eq("country_id", countryId);

      if (error) {
        console.error("Error fetching industries:", error);
      } else {
        setIndustries((data || []) as IndustryRoleData[]);
      }
    };

    fetchIndustries();
  }, [countryId, stageId, subClass]);

  // Deduplicate for dropdowns
  const uniqueIndustries = Array.from(
    new Map(industries.map((item) => [item.industry_id, item])).values()
  );
  const uniqueStates = Array.from(new Set(industries.map((i) => i.state))).filter(Boolean);
  const uniqueAreas = Array.from(new Set(industries.map((i) => i.area))).filter(Boolean);

  const rolesByIndustry = uniqueIndustries.map((ind) => ({
    ...ind,
    roles: industries.filter((r) => r.industry_id === ind.industry_id),
  }));

  const toggleIndustry = (id: number) => {
    setSelectedIndustries((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const toggleRole = (id: number) => {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates((prev) =>
      prev.includes(state)
        ? prev.filter((s) => s !== state)
        : prev.length < 3
        ? [...prev, state]
        : prev
    );
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : prev.length < 3
        ? [...prev, area]
        : prev
    );
  };

  const handleContinue = () => {
    console.log("Profile Tagline:", profileTagline);
    console.log("Selected Industries:", selectedIndustries);
    console.log("Selected Roles:", selectedRoles);
    console.log("Selected States:", selectedStates);
    console.log("Selected Areas:", selectedAreas);

    navigate("/next-step");
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2">
        <ArrowLeft size={20} /> <span>Back</span>
      </button>

      <h1 className="text-xl font-bold text-center">Work Preferences</h1>
      <p className="text-sm text-gray-500 text-center">
        Eligible industries for {subClass} visa (stage {stageId})
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

        {/* Industries & Roles */}
        <div>
          <Label>Select up to 3 industries & their roles *</Label>
          <div className="space-y-4">
            {rolesByIndustry.map((ind) => (
              <div key={ind.industry_id} className="border rounded-md p-3">
                <label className="flex items-center space-x-2 font-medium">
                  <Checkbox
                    checked={selectedIndustries.includes(ind.industry_id)}
                    onCheckedChange={() => toggleIndustry(ind.industry_id)}
                  />
                  <span>{ind.industry_name}</span>
                </label>

                {selectedIndustries.includes(ind.industry_id) && (
                  <div className="ml-6 mt-2 space-y-1">
                    {ind.roles.map((role) => (
                      <label
                        key={role.industry_role_id}
                        className="flex items-center space-x-2 text-sm"
                        title={`Eligible in ${role.state} (${role.area})`}
                      >
                        <Checkbox
                          checked={selectedRoles.includes(role.industry_role_id)}
                          onCheckedChange={() => toggleRole(role.industry_role_id)}
                        />
                        <span>{role.role_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* States */}
        <div>
          <Label>Preferred States (up to 3) *</Label>
          <div className="grid grid-cols-2 gap-2">
            {uniqueStates.map((state) => (
              <label key={state} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedStates.includes(state)}
                  onCheckedChange={() => toggleState(state)}
                />
                <span>{state}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Areas */}
        <div>
          <Label>Preferred Areas (up to 3) *</Label>
          <div className="grid grid-cols-2 gap-2">
            {uniqueAreas.map((area) => (
              <label key={area} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedAreas.includes(area)}
                  onCheckedChange={() => toggleArea(area)}
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



