import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [visaLabel, setVisaLabel] = useState<string>("");

  // ==========================
  // Load industries + states/areas based on visa
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch user's visa info
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("sub_class, stage_id, country_id")
        .eq("user_id", user.id)
        .single();

      if (!visa) return;

      // Get country name
      const { data: country } = await supabase
        .from("country")
        .select("name")
        .eq("country_id", visa.country_id)
        .single();

      // 2. Get industries allowed from temp_eligibility
      const { data: industriesData } = await supabase
        .from("temp_eligibility")
        .select("industry_name")
        .eq("sub_class", visa.sub_class)
        .eq("stage", visa.stage_id)
        .eq("country_name", country?.name);

      if (industriesData) {
        const uniqueIndustries = Array.from(
          new Set(industriesData.map((i) => i.industry_name))
        );
        setIndustries(uniqueIndustries);
      }

      // 3. Get states/areas allowed from maker_visa_eligibility
      const { data: statesData } = await supabase
        .from("maker_visa_eligibility")
        .select("state, area")
        .eq("sub_class", visa.sub_class)
        .eq("stage", visa.stage_id);

      if (statesData) {
        const uniqueStates = Array.from(new Set(statesData.map((s) => s.state)));
        const uniqueAreas = Array.from(new Set(statesData.map((s) => s.area)));
        setStates(uniqueStates);
        setAreas(uniqueAreas);
      }

      setVisaLabel(`${visa.sub_class} (Stage ${visa.stage_id})`);
    };

    loadData();
  }, []);

  // ==========================
  // Load roles when industry is picked
  // ==========================
  const handleIndustrySelect = async (industry: string) => {
    if (!selectedIndustries.includes(industry) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industry]);

      // find industry_id
      const { data: industryRow } = await supabase
        .from("industry")
        .select("industry_id")
        .eq("name", industry)
        .single();

      if (!industryRow) return;

      // fetch roles
      const { data: rolesData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role")
        .eq("industry_id", industryRow.industry_id);

      if (rolesData) {
        setRoles((prev) => [
          ...prev,
          ...rolesData.map((r) => ({ id: r.industry_role_id, name: r.role })),
        ]);
      }
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

    const { error } = await supabase.from("maker_preference").upsert(
      {
        user_id: user.id,
        tagline,
        industries: selectedIndustries,
        roles: selectedRoles,
        states: preferredStates,
        areas: preferredAreas,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Failed to save preferences:", error);
      return;
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
            <p className="text-sm text-gray-500 mt-2">
              Eligible industries based on <strong>{visaLabel}</strong>
            </p>
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
                  placeholder="e.g. Backpacker ready for farm work"
                />
              </div>

              {/* Industries */}
              <div className="space-y-3">
                <Label>Select up to 3 industries *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {industries.map((ind) => (
                    <label
                      key={ind}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(ind)}
                        disabled={
                          selectedIndustries.length >= 3 &&
                          !selectedIndustries.includes(ind)
                        }
                        onChange={() => handleIndustrySelect(ind)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{ind}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Roles */}
              {selectedIndustries.length > 0 && (
                <div className="space-y-3">
                  <Label>Select roles *</Label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
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
                    ))}
                  </div>
                </div>
              )}

              {/* States */}
              <div className="space-y-3">
                <Label>Preferred States (up to 3) *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {states.map((state) => (
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
                  {areas.map((area) => (
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



