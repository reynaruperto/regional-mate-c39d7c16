import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MakerPreferenceInsert =
  Database["public"]["Tables"]["maker_preference"]["Insert"];

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Values passed from nationality/visa page
  const { countryId, visaType, stageId } =
    (location.state as { countryId: number; visaType: string; stageId: number }) || {};

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<any[]>([]);
  const [regionRules, setRegionRules] = useState<any[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // ==========================
  // Load industries + region rules
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      // Get industries allowed for this visa + nationality
      const { data: industriesData, error: indError } = await supabase
        .from("maker_visa_eligibility")
        .select(`
          industry:industry_id (
            industry_id,
            name,
            industry_role(industry_role_id, role)
          )
        `)
        .eq("country_id", countryId)
        .eq("stage_id", stageId);

      if (!indError && industriesData) {
        const mapped = industriesData.map((i: any) => ({
          industry_id: i.industry.industry_id,
          name: i.industry.name,
          roles: i.industry.industry_role.map((r: any) => ({
            id: r.industry_role_id,
            name: r.role,
          })),
        }));
        setIndustries(mapped);
      }

      // Get region rules for this visa + stage
      const { data: regionsData, error: regError } = await supabase
        .from("region_rules")
        .select("industry_name, state, area, postcode_range")
        .eq("sub_class", visaType)
        .eq("stage", stageId);

      if (!regError && regionsData) {
        setRegionRules(regionsData);
      }
    };

    if (countryId && stageId) loadData();
  }, [countryId, stageId, visaType]);

  // ==========================
  // Validation tooltip
  // ==========================
  const getIndustryTooltip = (
    industry: string,
    state: string,
    area: string
  ): string => {
    const rulesForIndustry = regionRules.filter((r) => r.industry_name === industry);

    if (rulesForIndustry.length === 0) {
      return `⚠️ No rules for ${industry}.`;
    }

    const valid = rulesForIndustry.some(
      (r) => r.state === state && r.area === area
    );

    return valid
      ? `✅ ${industry} is eligible in ${state} (${area})`
      : `⚠️ ${industry} not valid in ${state} (${area})`;
  };

  // ==========================
  // Toggle helpers
  // ==========================
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

  // ==========================
  // Save to Supabase
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update tagline
    await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);

    // Insert preferences
    for (const industryId of selectedIndustries) {
      const rolesForIndustry = selectedRoles.length ? selectedRoles : [null];

      for (const roleId of rolesForIndustry) {
        for (const state of preferredStates) {
          for (const area of preferredAreas) {
            const newPref: MakerPreferenceInsert = {
              user_id: user.id,
              state,
              area, // 👈 stored properly in new column
              suburb_city: null, // optional, can use later
              industry_id: industryId,
              industry_role_id: roleId ?? null,
            };

            const { error: insertError } = await supabase
              .from("maker_preference")
              .insert(newPref);

            if (insertError) {
              console.error("Failed to insert preference:", insertError);
            }
          }
        }
      }
    }

    navigate("/whv/work-experience");
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/profile-setup")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">
                Work Preferences
              </h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">4/6</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
              {/* Info banner */}
              <p className="text-sm text-gray-500">
                Showing industries eligible for your visa ({visaType}, stage {stageId})
              </p>

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
                    <label
                      key={ind.industry_id}
                      className="flex items-center space-x-2"
                    >
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
                        ind.roles.map((r: any) => (
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
                  {[...new Set(regionRules.map((r) => r.state))].map((state) => (
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
                  {[...new Set(regionRules.map((r) => r.area))].map((area) => (
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

              {/* Tooltips */}
              {selectedIndustries.length > 0 &&
                preferredStates.length > 0 &&
                preferredAreas.length > 0 && (
                  <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                    {selectedIndustries.map((indId) => {
                      const industry = industries.find(
                        (i) => i.industry_id === indId
                      );
                      return preferredStates.map((state) =>
                        preferredAreas.map((area) => (
                          <p
                            key={`${industry?.name}-${state}-${area}`}
                            className={`${
                              getIndustryTooltip(
                                industry?.name,
                                state,
                                area
                              ).includes("⚠️")
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {getIndustryTooltip(industry?.name, state, area)}
                          </p>
                        ))
                      );
                    })}
                  </div>
                )}

              {/* Continue */}
              <div className="pt-8">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
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


