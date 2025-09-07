import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IndustryWithRoles = {
  industry_id: number;
  name: string;
  roles: { id: number; name: string }[];
};

const australianStates = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { subClass, stageId, countryName } =
    (location.state as { subClass: string; stageId: number; countryName: string }) || {
      subClass: "462",
      stageId: 1,
      countryName: "United States of America (USA)",
    };

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<IndustryWithRoles[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // Load industries, roles, and areas
  useEffect(() => {
    const loadData = async () => {
      if (!stageId) return;

      // Use region_rules as fallback since v_visa_stage_industries_roles view has type issues
      const { data, error } = await supabase
        .from("region_rules")
        .select("industry_name, state, area")
        .eq("sub_class", subClass)
        .eq("stage", stageId.toString());

      if (error) {
        console.error("Failed to load industries:", error);
        return;
      }

      if (data) {
        // Create mock industries from region_rules data
        const uniqueIndustries = Array.from(new Set(data.map(r => r.industry_name)));
        const mockIndustries = uniqueIndustries.map((name, index) => ({
          industry_id: index + 1,
          name: name || '',
          roles: [] // No roles from region_rules
        }));

        setIndustries(mockIndustries);

        const uniqueAreas = Array.from(new Set(data.map(r => r.area).filter(Boolean))) as string[];
        setAvailableAreas(uniqueAreas);
      }
    };

    loadData();
  }, [subClass, stageId, countryName]);

  // Toggle helpers
  const toggleIndustry = (industryId: number) => {
    if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(selectedIndustries.filter((id) => id !== industryId));
      setSelectedRoles([]);
    } else if (selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId)
        ? selectedRoles.filter((r) => r !== roleId)
        : [...selectedRoles, roleId]
    );
  };

  const togglePreferredState = (state: string) => {
    setPreferredStates(
      preferredStates.includes(state)
        ? preferredStates.filter((s) => s !== state)
        : preferredStates.length < 3
        ? [...preferredStates, state]
        : preferredStates
    );
  };

  const togglePreferredArea = (area: string) => {
    setPreferredAreas(
      preferredAreas.includes(area)
        ? preferredAreas.filter((a) => a !== area)
        : preferredAreas.length < 3
        ? [...preferredAreas, area]
        : preferredAreas
    );
  };

  // Save preferences
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);

    for (const industryId of selectedIndustries) {
      const rolesForIndustry = selectedRoles.length ? selectedRoles : [null];
      for (const roleId of rolesForIndustry) {
        for (const state of preferredStates) {
          await supabase.from("maker_preference").insert({
            user_id: user.id,
            state,
            area: preferredAreas.join(", "),
            industry_id: industryId,
            industry_role_id: roleId,
          } as any);
        }
      }
    }

    navigate("/whv/work-experience");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-6 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/profile-setup")}
                className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={22} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Work Preferences</h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">4/6</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
              {/* Tagline */}
              <div className="space-y-2">
                <Label>Profile Tagline *</Label>
                <Input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="h-12 bg-gray-100 border-0"
                  maxLength={60}
                />
              </div>

              {/* Industries */}
              <div className="space-y-3">
                <Label>Select up to 3 industries *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {industries.map((ind) => (
                    <label key={ind.industry_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(ind.industry_id)}
                        disabled={
                          selectedIndustries.length >= 3 &&
                          !selectedIndustries.includes(ind.industry_id)
                        }
                        onChange={() => toggleIndustry(ind.industry_id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{ind.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Roles */}
              {selectedIndustries.length > 0 && (
                <div className="space-y-3">
                  <Label>Select roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {industries
                      .filter((i) => selectedIndustries.includes(i.industry_id))
                      .flatMap((ind) =>
                        ind.roles.map((r) => (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => toggleRole(r.id)}
                            className={`px-3 py-1.5 rounded-full text-xs border ${
                              selectedRoles.includes(r.id)
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-white text-gray-700 border-gray-300"
                            }`}
                          >
                            {r.name}
                          </button>
                        ))
                      )}
                  </div>
                </div>
              )}

              {/* States */}
              <div className="space-y-3">
                <Label>Preferred States (up to 3) *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {australianStates.map((state) => (
                    <label key={state} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferredStates.includes(state)}
                        disabled={
                          preferredStates.length >= 3 &&
                          !preferredStates.includes(state)
                        }
                        onChange={() => togglePreferredState(state)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-3">
                <Label>Preferred Areas (up to 3) *</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                  {availableAreas.map((area) => (
                    <label key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferredAreas.includes(area)}
                        disabled={
                          preferredAreas.length >= 3 &&
                          !preferredAreas.includes(area)
                        }
                        onChange={() => togglePreferredArea(area)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Continue */}
              <div className="pt-10">
                <Button
                  type="submit"
                  className="w-full h-16 text-base font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Continue →
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;


