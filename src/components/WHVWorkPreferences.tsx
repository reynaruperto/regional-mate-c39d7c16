import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/supabase-extensions";

type Industry = Database["public"]["Tables"]["industry"]["Row"] & {
  industry_role: { industry_role_id: number; role: string }[];
};

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

  // ✅ get stageId passed from ProfileSetup
  const { stageId } = (location.state as { stageId: number }) || { stageId: null };

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // ==========================
  // Load industries filtered by eligibility
  // ==========================
  useEffect(() => {
    const loadIndustries = async () => {
      if (!stageId) return;

      const { data, error } = await supabase
        .from("maker_visa_eligibility")
        .select(
          `
          industry:industry_id (
            industry_id,
            name,
            industry_role (industry_role_id, role)
          )
        `
        )
        .eq("stage_id", stageId);

      if (error) {
        console.error("Failed to load industries:", error);
        return;
      }

      if (data) {
        // Flatten into industry objects
        const mapped = data.map((d: any) => ({
          industry_id: d.industry.industry_id,
          name: d.industry.name,
          industry_role: d.industry.industry_role || [],
        }));
        setIndustries(mapped);
      }
    };

    loadIndustries();
  }, [stageId]);

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

    // update tagline
    await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);

    // insert preferences
    for (const industryId of selectedIndustries) {
      const rolesForIndustry = selectedRoles.length ? selectedRoles : [null];
      for (const roleId of rolesForIndustry) {
        for (const state of preferredStates) {
          await supabase.from("maker_preference").insert({
            user_id: user.id,
            state,
            suburb_city: preferredAreas.join(", "),
            industry_id: industryId,
            industry_role_id: roleId,
          } as any);
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
              <h1 className="text-lg font-medium text-gray-900">Work Preferences</h1>
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
                        ind.industry_role.map((r) => (
                          <button
                            type="button"
                            key={r.industry_role_id}
                            onClick={() => toggleRole(r.industry_role_id)}
                            className={`px-3 py-1.5 rounded-full text-xs border ${
                              selectedRoles.includes(r.industry_role_id)
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-white text-gray-700 border-gray-300"
                            }`}
                          >
                            {r.role}
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



