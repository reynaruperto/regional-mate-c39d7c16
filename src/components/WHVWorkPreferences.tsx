import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

enum AreaRestriction {
  All = "All",
  Regional = "Regional",
  Northern = "Northern",
  Remote = "Remote",
  VeryRemote = "Very Remote",
}

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

  const { visaType, visaStage } =
    (location.state as { visaType: string; visaStage: string }) || {
      visaType: "417",
      visaStage: "1st",
    };

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<any[]>([]);
  const [regionRules, setRegionRules] = useState<any[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // ==========================
  // Load industries + roles + region rules
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      // Industries + roles
      const { data: industriesData, error: indError } = await supabase
        .from("industry")
        .select("industry_id, name, industry_role(industry_role_id, role)");

      if (!indError && industriesData) {
        const mapped = industriesData.map((i: any) => ({
          industry_id: i.industry_id,
          name: i.name,
          roles: i.industry_role.map((r: any) => ({
            id: r.industry_role_id,
            name: r.role,
          })),
        }));
        setIndustries(mapped);
      }

      // Region rules - commenting out since table doesn't exist
      // const { data: regionsData, error: regError } = await supabase
      //   .from("region_postcode")
      //   .select("state, area, postcode_range");

      // if (!regError && regionsData) {
      //   setRegionRules(regionsData);
      // }
    };

    loadData();
  }, []);

  // ==========================
  // Tooltip validation
  // ==========================
  const getIndustryTooltip = (
    industry: string,
    state: string,
    area: string,
    postcode: string
  ): string => {
    const rulesForState = regionRules.filter((r) => r.state === state);

    if (rulesForState.length === 0) {
      return `⚠️ No regional rules found for ${state}.`;
    }

    const areaAllowed = rulesForState.some(
      (r) => r.area === area || r.area === "All"
    );
    if (!areaAllowed) {
      return `⚠️ ${industry} may not count in ${area}, ${state}. Allowed areas: ${rulesForState
        .map((r) => r.area)
        .join(", ")}`;
    }

    // Postcode validation (demo only, here we assume employer postcode "4709")
    const pc = parseInt(postcode, 10);
    const postcodeAllowed = rulesForState.some((r) => {
      if (r.postcode_range === "All") return true;
      if (r.postcode_range.includes("–")) {
        const [start, end] = r.postcode_range.split("–").map(Number);
        return pc >= start && pc <= end;
      }
      return r.postcode_range === postcode;
    });

    if (!postcodeAllowed) {
      return `⚠️ ${industry} not valid in postcode ${postcode}.`;
    }

    return `✅ ${industry} can be done in ${state} (${area})`;
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

    const { error: updateError } = await (supabase as any)
      .from("whv_maker")
      .update({ tagline })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update tagline:", updateError);
      return;
    }

    for (const industryId of selectedIndustries) {
      const rolesForIndustry = selectedRoles.length ? selectedRoles : [null];
      for (const roleId of rolesForIndustry) {
        for (const state of preferredStates) {
          const { error: insertError } = await (supabase as any)
            .from("maker_preference")
            .insert({
              user_id: user.id,
              state,
              suburb_city: preferredAreas.join(", "),
              industry_id: industryId,
              industry_role_id: roleId,
            });

          if (insertError) {
            console.error("Failed to insert preference:", insertError);
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
                  {Object.values(AreaRestriction).map((area) => (
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
                                area,
                                "4709" // Example postcode
                              ).includes("⚠️")
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {getIndustryTooltip(
                              industry?.name,
                              state,
                              area,
                              "4709"
                            )}
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

export default WHVWorkPreferences.tsx;


