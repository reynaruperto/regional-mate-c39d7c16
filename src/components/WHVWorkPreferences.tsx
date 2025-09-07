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
type WHVMakerUpdate =
  Database["public"]["Tables"]["whv_maker"]["Update"];

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { countryId, visaType, stageId } =
    (location.state as { countryId: number; visaType: string; stageId: number }) || {
      countryId: 0,
      visaType: "417",
      stageId: 1,
    };

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<any[]>([]);
  const [regionRules, setRegionRules] = useState<any[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // ==========================
  // Load industries & region rules
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading with:", { countryId, visaType, stageId });

      // Load industries with roles directly
      const { data: industriesData, error: indError } = await supabase
        .from("industry")
        .select(`
          industry_id,
          name,
          industry_role(industry_role_id, role)
        `);

      if (indError) {
        console.error("Industry error:", indError);
      } else if (industriesData) {
        console.log("Industries loaded:", industriesData);
        const mapped = industriesData.map((i: any) => ({
          industry_id: i.industry_id,
          name: i.name,
          roles: (i.industry_role || []).map((r: any) => r.role),
        }));
        setIndustries(mapped);
      }

      // Use hardcoded region data since region_rules table may not be accessible
      const mockRegionData = [
        { state: "New South Wales", area: "Sydney" },
        { state: "New South Wales", area: "Newcastle" },
        { state: "New South Wales", area: "Central Coast" },
        { state: "Victoria", area: "Melbourne" },
        { state: "Victoria", area: "Geelong" },
        { state: "Victoria", area: "Ballarat" },
        { state: "Queensland", area: "Brisbane" },
        { state: "Queensland", area: "Gold Coast" },
        { state: "Queensland", area: "Sunshine Coast" },
        { state: "Western Australia", area: "Perth" },
        { state: "Western Australia", area: "Fremantle" },
        { state: "South Australia", area: "Adelaide" },
        { state: "Tasmania", area: "Hobart" },
        { state: "Tasmania", area: "Launceston" },
        { state: "Northern Territory", area: "Darwin" },
        { state: "Australian Capital Territory", area: "Canberra" }
      ];
      console.log("Region data:", mockRegionData);
      setRegionRules(mockRegionData);
    };

    loadData();
  }, [countryId, stageId, visaType]);

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

  const toggleRole = (role: string) => {
    setSelectedRoles(
      selectedRoles.includes(role)
        ? selectedRoles.filter((r) => r !== role)
        : [...selectedRoles, role]
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

    console.log("Submitting preferences:", {
      tagline,
      selectedIndustries,
      selectedRoles,
      preferredStates,
      preferredAreas
    });

    // Update tagline
    const taglineUpdate: WHVMakerUpdate = { tagline };
    const { error: taglineError } = await supabase
      .from("whv_maker")
      .update(taglineUpdate)
      .eq("user_id", user.id);

    if (taglineError) {
      console.error("Failed to update tagline:", taglineError);
      return;
    }

    // Clear existing preferences first
    await supabase
      .from("maker_preference")
      .delete()
      .eq("user_id", user.id);

    // Insert new preferences
    for (const industryId of selectedIndustries) {
      for (const state of preferredStates.length > 0 ? preferredStates : [null]) {
        for (const area of preferredAreas.length > 0 ? preferredAreas : [null]) {
          const newPref: MakerPreferenceInsert = {
            user_id: user.id,
            state: state as MakerPreferenceInsert["state"],
            suburb_city: area, // Store area in suburb_city since area column was just added
            industry_id: industryId,
            industry_role_id: null, // Will need to map roles to IDs later
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
              <div className="text-center flex-1">
                <h1 className="text-lg font-semibold text-gray-900">Work Preferences</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visa {visaType} · Stage {stageId}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">4/6</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-8 pb-24">
              {/* Tagline */}
              <div className="space-y-2">
                <Label className="font-medium">Profile Tagline *</Label>
                <Input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="h-12 bg-gray-100 border-0 rounded-lg text-sm"
                  placeholder="e.g. Hardworking traveler ready to contribute"
                  maxLength={60}
                />
                <p className="text-xs text-gray-400">Max 60 characters</p>
              </div>

              {/* Industries */}
              <div className="space-y-3">
                <Label className="font-medium">Select up to 3 industries *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {industries.length === 0 ? (
                    <p className="text-sm text-gray-500">No industries available</p>
                  ) : (
                    industries.map((ind) => (
                      <label
                        key={ind.industry_id}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIndustries.includes(ind.industry_id)}
                          disabled={
                            selectedIndustries.length >= 3 &&
                            !selectedIndustries.includes(ind.industry_id)
                          }
                          onChange={() => toggleIndustry(ind.industry_id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{ind.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Roles */}
              {selectedIndustries.length > 0 && (
                <div className="space-y-3">
                  <Label className="font-medium">Select roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {industries
                      .filter((i) => selectedIndustries.includes(i.industry_id))
                      .flatMap((ind) =>
                        ind.roles.map((r: string) => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => toggleRole(r)}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                              selectedRoles.includes(r)
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {r}
                          </button>
                        ))
                      )}
                  </div>
                </div>
              )}

              {/* States + Areas */}
              <div className="space-y-3">
                <Label className="font-medium">Preferred States & Areas (up to 3 each)</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-3">
                  {[...new Set(regionRules.map((r) => r.state))].map((state) => {
                    const areasForState = regionRules
                      .filter((r) => r.state === state)
                      .map((r) => r.area);

                    return (
                      <div key={state}>
                        <p className="font-medium text-sm text-gray-700">{state}</p>
                        {areasForState.map((area) => (
                          <label
                            key={`${state}-${area}`}
                            className="flex items-center space-x-3 cursor-pointer ml-3"
                          >
                            <input
                              type="checkbox"
                              checked={preferredAreas.includes(area)}
                              disabled={
                                preferredAreas.length >= 3 &&
                                !preferredAreas.includes(area)
                              }
                              onChange={() => togglePreferredArea(area)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{area}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* Continue */}
          <div className="p-4 border-t bg-white">
            <Button
              type="submit"
              className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
              onClick={handleSubmit}
            >
              Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;


