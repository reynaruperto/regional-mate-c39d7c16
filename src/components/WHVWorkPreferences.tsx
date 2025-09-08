// src/pages/WHVWorkPreferences.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Info, ChevronDown, ChevronRight } from "lucide-react";
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
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    tagline: true,
    industries: false,
    states: false,
    summary: false,
  });

  // ==========================
  // Load data from Supabase
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get visa info
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, country_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!visa) return;

      // 2. Get visa label
      const { data: visaStage } = await supabase
        .from("visa_stage")
        .select("label")
        .eq("stage_id", visa.stage_id)
        .maybeSingle();
      if (visaStage) setVisaLabel(visaStage.label);

      // 3. Eligible industries, roles, states, areas
      let { data: eligibilityData, error } = await supabase
        .from("v_visa_stage_industries_roles" as any)
        .select(
          "industry_id, industry_name, industry_role_id, role_name, state, area, stage_id, country_id"
        )
        .eq("stage_id", visa.stage_id)
        .eq("country_id", visa.country_id);

      if (error) {
        console.error("Error fetching eligibility data:", error);
      }

      // Fallback → stage only
      if (!eligibilityData || eligibilityData.length === 0) {
        const { data: fallbackData } = await supabase
          .from("v_visa_stage_industries_roles" as any)
          .select(
            "industry_id, industry_name, industry_role_id, role_name, state, area, stage_id, country_id"
          )
          .eq("stage_id", visa.stage_id);

        eligibilityData = fallbackData || [];
      }

      if (eligibilityData) {
        const data = eligibilityData as any[];

        // ✅ Industries
        const uniqueIndustries = Array.from(
          new Map(
            data
              .filter((item) => item.industry_id && item.industry_name)
              .map((item) => [item.industry_id, { id: item.industry_id, name: item.industry_name }])
          ).values()
        );
        setIndustries(uniqueIndustries);

        // ✅ Roles
        const uniqueRoles = Array.from(
          new Map(
            data
              .filter((item) => item.industry_role_id && item.role_name && item.industry_id)
              .map((item) => [
                item.industry_role_id,
                { id: item.industry_role_id, name: item.role_name, industryId: item.industry_id },
              ])
          ).values()
        );
        setRoles(uniqueRoles);

        // ✅ States
        const uniqueStates = Array.from(new Set(data.map((item) => item.state).filter(Boolean)));
        setStates(uniqueStates);

        // ✅ Areas
        const uniqueAreas = Array.from(new Set(data.map((item) => item.area).filter(Boolean)));
        setAreas(uniqueAreas);

        // ✅ Group areas by state
        const areasByState: { [state: string]: string[] } = {};
        data.forEach((item) => {
          if (item.state && item.area) {
            if (!areasByState[item.state]) areasByState[item.state] = [];
            if (!areasByState[item.state].includes(item.area)) {
              areasByState[item.state].push(item.area);
            }
          }
        });
        setAvailableAreas(areasByState);
      }

      // 4. Load tagline if already saved
      const { data: makerData } = await supabase
        .from("whv_maker")
        .select("tagline")
        .eq("user_id", user.id)
        .maybeSingle();
      if (makerData?.tagline) setTagline(makerData.tagline);
    };

    loadData();
  }, []);

  // ==========================
  // Helpers
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

  const handleIndustrySelect = (industryId: number) => {
    if (!selectedIndustries.includes(industryId) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
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
              {/* Tagline */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection("tagline")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <span className="text-lg font-medium">1. Profile Tagline</span>
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
                  </div>
                )}
              </div>

              {/* Industries */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection("industries")}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <span className="text-lg font-medium">2. Industries & Roles</span>
                  {expandedSections.industries ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                {expandedSections.industries && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    <Label>Select up to 3 industries *</Label>
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
                        <span>{industry.name}</span>
                      </label>
                    ))}

                    {selectedIndustries.map((industryId) => {
                      const industry = industries.find((i) => i.id === industryId);
                      const industryRoles = roles.filter((r) => r.industryId === industryId);
                      return (
                        <div key={industryId}>
                          <Label>Roles for {industry?.name}</Label>
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
                >
                  <span className="text-lg font-medium">3. Preferred Locations</span>
                  {expandedSections.states ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                {expandedSections.states && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    <Label>Preferred States (up to 3)</Label>
                    {states.map((state) => (
                      <label key={state} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={preferredStates.includes(state)}
                          onChange={() => togglePreferredState(state)}
                          className="h-4 w-4"
                          disabled={preferredStates.length >= 3 && !preferredStates.includes(state)}
                        />
                        <span>{state}</span>
                      </label>
                    ))}

                    {preferredStates.length > 0 && (
                      <>
                        <Label>Preferred Areas (up to 3)</Label>
                        {getAvailableAreasForSelectedStates().map((area) => (
                          <label key={area} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={preferredAreas.includes(area)}
                              onChange={() => togglePreferredArea(area)}
                              className="h-4 w-4"
                              disabled={preferredAreas.length >= 3 && !preferredAreas.includes(area)}
                            />
                            <span>{area}</span>
                          </label>
                        ))}
                      </>
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
                >
                  <span className="text-lg font-medium">4. Review</span>
                  {expandedSections.summary ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                {expandedSections.summary && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    <div>
                      <p><strong>Tagline:</strong> {tagline}</p>
                      <p>
                        <strong>Industries:</strong>{" "}
                        {selectedIndustries.map((id) => industries.find((i) => i.id === id)?.name).join(", ")}
                      </p>
                      <p>
                        <strong>Roles:</strong>{" "}
                        {selectedRoles.map((id) => roles.find((r) => r.id === id)?.name).join(", ")}
                      </p>
                      <p><strong>States:</strong> {preferredStates.join(", ")}</p>
                      <p><strong>Areas:</strong> {preferredAreas.join(", ")}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  onClick={() => navigate("/whv/work-experience")}
                  disabled={!tagline.trim() || selectedIndustries.length === 0 || preferredStates.length === 0}
                  className="w-full h-14 text-lg rounded-xl bg-orange-500 text-white"
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


