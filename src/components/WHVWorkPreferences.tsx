
// src/pages/WHVWorkPreferences.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Info, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string; industryId: number }[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<{ [state: string]: string[] }>({});
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [visaLabel, setVisaLabel] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    tagline: true,
    industries: false,
    states: false,
    summary: false,
  });

  // ==========================
  // Load data based on user's visa
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get user's visa stage + country
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, country_id")
        .eq("user_id", user.id)
        .single();
      if (!visa) return;

      // 2. Visa label
      const { data: visaStage } = await supabase
        .from("visa_stage")
        .select("label")
        .eq("stage_id", visa.stage_id)
        .single();
      if (visaStage) setVisaLabel(visaStage.label);

      // 3. Eligible industries/roles/states/areas
      const { data: eligibilityData, error } = await supabase
        .from("v_visa_stage_industries_roles")
        .select("industry_id, industry_name, industry_role_id, role_name, state, area, stage_id, country_id")
        .eq("stage_id", visa.stage_id)
        .eq("country_id", visa.country_id);

      if (error) {
        console.error("Error fetching eligibility data:", error);
        return;
      }

      if (eligibilityData && Array.isArray(eligibilityData)) {
        // ✅ Industries
        const uniqueIndustries = Array.from(
          new Map(
            eligibilityData
              .filter((item) => item.industry_id && item.industry_name)
              .map((item) => [item.industry_id, { id: item.industry_id, name: item.industry_name }])
          ).values()
        );
        setIndustries(uniqueIndustries);

        // ✅ Roles
        const uniqueRoles = Array.from(
          new Map(
            eligibilityData
              .filter((item) => item.industry_role_id && item.role_name && item.industry_id)
              .map((item) => [
                item.industry_role_id,
                { id: item.industry_role_id, name: item.role_name, industryId: item.industry_id },
              ])
          ).values()
        );
        setRoles(uniqueRoles);

        // ✅ States
        const uniqueStates = Array.from(new Set(eligibilityData.map((item) => item.state).filter(Boolean)));
        setStates(uniqueStates);

        // ✅ Areas
        const uniqueAreas = Array.from(new Set(eligibilityData.map((item) => item.area).filter(Boolean)));
        setAreas(uniqueAreas);

        // ✅ Group areas by state
        const areasByState: { [state: string]: string[] } = {};
        eligibilityData.forEach((item) => {
          if (item.state && item.area) {
            if (!areasByState[item.state]) areasByState[item.state] = [];
            if (!areasByState[item.state].includes(item.area)) {
              areasByState[item.state].push(item.area);
            }
          }
        });
        setAvailableAreas(areasByState);
      }

      // 4. Load tagline (if already set)
      const { data: makerData } = await supabase
        .from("whv_maker")
        .select("tagline")
        .eq("user_id", user.id)
        .single();
      if (makerData?.tagline) setTagline(makerData.tagline);
    };

    loadData();
  }, []);

  // ==========================
  // Section toggles
  // ==========================
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTaglineChange = (value: string) => {
    setTagline(value);
    if (value.trim() && !expandedSections.industries) {
      setExpandedSections((prev) => ({ ...prev, industries: true }));
    }
  };

  // ==========================
  // Selection helpers
  // ==========================
  const handleIndustrySelect = (industryId: number) => {
    if (!selectedIndustries.includes(industryId) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
      if (!expandedSections.states) {
        setExpandedSections((prev) => ({ ...prev, states: true }));
      }
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(selectedIndustries.filter((id) => id !== industryId));
      const industryRoles = roles.filter((r) => r.industryId === industryId).map((r) => r.id);
      setSelectedRoles(selectedRoles.filter((roleId) => !industryRoles.includes(roleId)));
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
    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;
    setPreferredStates(newStates);

    const availableAreasForStates = newStates.flatMap((s) => availableAreas[s] || []);
    setPreferredAreas(preferredAreas.filter((area) => availableAreasForStates.includes(area)));

    if (newStates.length > 0 && !expandedSections.summary) {
      setExpandedSections((prev) => ({ ...prev, summary: true }));
    }
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

  const getAvailableAreasForSelectedStates = () => {
    return preferredStates.flatMap((state) => availableAreas[state] || []);
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
            <p className="text-sm text-gray-500 mt-2">
              Eligible industries based on <strong>{visaLabel}</strong>
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <form className="space-y-6 pb-20">
              {/* Tagline Section */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection("tagline")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">1. Profile Tagline</span>
                    {tagline && <span className="text-green-600 text-sm">✓</span>}
                  </div>
                  {expandedSections.tagline ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {expandedSections.tagline && (
                  <div className="px-4 pb-4 border-t space-y-3">
                    <Label>Profile Tagline *</Label>
                    <Input
                      type="text"
                      value={tagline}
                      onChange={(e) => handleTaglineChange(e.target.value)}
                      className="h-12 bg-gray-100 border-0"
                      maxLength={60}
                      placeholder="e.g. Backpacker ready for farm work"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Info size={12} />
                      <span>This appears at the top of your profile card</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Industries Section */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection("industries")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  disabled={!tagline.trim()}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-medium ${!tagline.trim() ? "text-gray-400" : ""}`}>
                      2. Industries & Roles
                    </span>
                    {selectedIndustries.length > 0 && <span className="text-green-600 text-sm">✓</span>}
                  </div>
                  {expandedSections.industries ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {expandedSections.industries && tagline.trim() && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    {/* Industries */}
                    <Label>Select up to 3 industries *</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                      {industries.map((industry) => (
                        <label key={industry.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(industry.id)}
                            disabled={
                              selectedIndustries.length >= 3 && !selectedIndustries.includes(industry.id)
                            }
                            onChange={() => handleIndustrySelect(industry.id)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-700">{industry.name}</span>
                        </label>
                      ))}
                    </div>

                    {/* Roles grouped by industry */}
                    {selectedIndustries.map((industryId) => {
                      const industry = industries.find((i) => i.id === industryId);
                      const industryRoles = roles.filter((r) => r.industryId === industryId);
                      if (!industry || industryRoles.length === 0) return null;

                      return (
                        <div key={industryId} className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Roles for {industry.name}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {industryRoles.map((role) => (
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* States & Areas */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection("states")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  disabled={selectedIndustries.length === 0}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-medium ${selectedIndustries.length === 0 ? "text-gray-400" : ""}`}
                    >
                      3. Preferred Locations
                    </span>
                    {preferredStates.length > 0 && <span className="text-green-600 text-sm">✓</span>}
                  </div>
                  {expandedSections.states ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {expandedSections.states && selectedIndustries.length > 0 && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    {/* States */}
                    <Label>Preferred States (up to 3)</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                      {states.map((state) => (
                        <label key={state} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={preferredStates.includes(state)}
                            disabled={
                              preferredStates.length >= 3 && !preferredStates.includes(state)
                            }
                            onChange={() => togglePreferredState(state)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-700">{state}</span>
                        </label>
                      ))}
                    </div>

                    {/* Areas */}
                    {preferredStates.length > 0 && (
                      <div className="space-y-3">
                        <Label>Preferred Areas (up to 3)</Label>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                          {getAvailableAreasForSelectedStates().map((area) => (
                            <label key={area} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={preferredAreas.includes(area)}
                                disabled={
                                  preferredAreas.length >= 3 && !preferredAreas.includes(area)
                                }
                                onChange={() => togglePreferredArea(area)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-gray-700">{area}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection("summary")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  disabled={preferredStates.length === 0}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-medium ${preferredStates.length === 0 ? "text-gray-400" : ""}`}
                    >
                      4. Review Your Selections
                    </span>
                  </div>
                  {expandedSections.summary ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {expandedSections.summary && preferredStates.length > 0 && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="font-medium text-sm text-gray-700">Tagline:</span>
                        <p className="text-sm text-gray-900">{tagline}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-700">Industries:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedIndustries.map((id) => {
                            const industry = industries.find((i) => i.id === id);
                            return (
                              <span key={id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {industry?.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {selectedRoles.length > 0 && (
                        <div>
                          <span className="font-medium text-sm text-gray-700">Roles:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRoles.map((id) => {
                              const role = roles.find((r) => r.id === id);
                              return (
                                <span key={id} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                                  {role?.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-sm text-gray-700">States:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {preferredStates.map((state) => (
                            <span key={state} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              {state}
                            </span>
                          ))}
                        </div>
                      </div>
                      {preferredAreas.length > 0 && (
                        <div>
                          <span className="font-medium text-sm text-gray-700">Areas:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {preferredAreas.map((area) => (
                              <span key={area} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Continue */}
              <div className="pt-4">
                <Button
                  type="button"
                  onClick={() => navigate("/whv/work-experience")}
                  disabled={!tagline.trim() || selectedIndustries.length === 0 || preferredStates.length === 0}
                  className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:bg-gray-300"
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
