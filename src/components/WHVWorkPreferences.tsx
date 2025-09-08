import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [visaLabel, setVisaLabel] = useState<string>("");
  const [stageId, setStageId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ==========================
  // Load data based on user's visa
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get user's visa stage and country
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, country_id")
        .eq("user_id", user.id)
        .single();

      if (!visa) return;

      setStageId(visa.stage_id);
      setCountryId(visa.country_id);

      // 2. Get visa label from visa_stage
      const { data: visaStage } = await supabase
        .from("visa_stage")
        .select("label")
        .eq("stage_id", visa.stage_id)
        .single();

      if (visaStage) {
        setVisaLabel(visaStage.label);
      }

      // 3. Get eligible industries and roles from the view
      const { data: eligibilityData } = await supabase
        .from("v_visa_stage_industries_roles")
        .select("industry_id, industry_name, industry_role_id, role_name, state, area")
        .eq("stage", visa.stage_id);

      if (eligibilityData) {
        // Extract unique industries
        const uniqueIndustries = Array.from(
          new Map(eligibilityData.map(item => [item.industry_id, { id: item.industry_id, name: item.industry_name }])).values()
        );
        setIndustries(uniqueIndustries);

        // Extract unique roles
        const uniqueRoles = Array.from(
          new Map(eligibilityData.filter(item => item.industry_role_id && item.role_name).map(item => [item.industry_role_id, { id: item.industry_role_id, name: item.role_name }])).values()
        );
        setRoles(uniqueRoles);

        // Extract unique states and areas
        const uniqueStates = Array.from(new Set(eligibilityData.map(item => item.state).filter(Boolean)));
        const uniqueAreas = Array.from(new Set(eligibilityData.map(item => item.area).filter(Boolean)));
        setStates(uniqueStates);
        setAreas(uniqueAreas);
      }
    };

    loadData();
  }, []);

  // ==========================
  // Industry selection handler
  // ==========================
  const handleIndustrySelect = (industryId: number) => {
    if (!selectedIndustries.includes(industryId) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(selectedIndustries.filter((id) => id !== industryId));
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
  // Validation
  // ==========================
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!tagline.trim()) {
      newErrors.tagline = "Profile tagline is required";
    }

    if (selectedIndustries.length === 0) {
      newErrors.industries = "Please select at least one industry";
    }

    const hasRolesForSelectedIndustries = roles.some(role => 
      selectedIndustries.some(industryId => 
        industries.find(ind => ind.id === industryId)
      )
    );

    if (hasRolesForSelectedIndustries && selectedRoles.length === 0) {
      newErrors.roles = "Please select at least one role for your chosen industries";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================
  // Save to Supabase
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

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
                  className={`h-12 bg-gray-100 border-0 ${errors.tagline ? 'ring-2 ring-red-500' : ''}`}
                  maxLength={60}
                  placeholder="e.g. Backpacker ready for farm work"
                />
                {errors.tagline && <p className="text-sm text-red-500">{errors.tagline}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info size={12} />
                  <span>This appears at the top of your profile card</span>
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-3">
                <Label>Select up to 3 industries *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {industries.map((industry) => (
                    <label key={industry.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry.id)}
                        disabled={
                          selectedIndustries.length >= 3 &&
                          !selectedIndustries.includes(industry.id)
                        }
                        onChange={() => handleIndustrySelect(industry.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{industry.name}</span>
                    </label>
                  ))}
                </div>
                {errors.industries && <p className="text-sm text-red-500">{errors.industries}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info size={12} />
                  <span>Industries must be eligible for your visa type and stage</span>
                </div>
              </div>

              {/* Roles */}
              {selectedIndustries.length > 0 && (
                <div className="space-y-3">
                  <Label>Select roles *</Label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${
                          selectedRoles.includes(role.id)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                  {errors.roles && <p className="text-sm text-red-500">{errors.roles}</p>}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info size={12} />
                    <span>Select specific roles within your chosen industries</span>
                  </div>
                </div>
              )}

              {/* States */}
              <div className="space-y-3">
                <Label>Preferred States (up to 3) *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {states.map((state) => (
                    <label key={state} className="flex items-center space-x-2 py-1">
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
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info size={12} />
                  <span>Some visa restrictions may apply to certain states</span>
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-3">
                <Label>Preferred Areas (up to 3) *</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                  {areas.map((area) => (
                    <label key={area} className="flex items-center space-x-2 py-1">
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
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info size={12} />
                  <span>Regional and remote areas may have different visa requirements</span>
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