import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Industry {
  id: number;
  name: string;
}
interface Role {
  id: number;
  name: string;
  industryId: number;
}
interface Region {
  state: string;
  area: string;
}

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [visaLabel, setVisaLabel] = useState<string>("");

  const [expandedSections, setExpandedSections] = useState({
    tagline: true,
    industries: false,
    states: false,
    summary: false,
  });

  // ==========================
  // Load data
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get visa with subclass + stage
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, visa_stage(sub_class, stage, label)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!visa) return;

      setVisaLabel(visa.visa_stage.label);

      // Industries
      const { data: industryData } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (industryData) {
        setIndustries(
          industryData.map((i) => ({ id: i.industry_id, name: i.name }))
        );
      }

      // Roles
      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      // Regions (filtered by subclass + stage)
      const { data: regionData } = await supabase
        .from("region_rules")
        .select("state, area")
        .eq("sub_class", String(visa.visa_stage.sub_class))
        .eq("stage", visa.visa_stage.stage as any);

      if (regionData) {
        setRegions(regionData);
      }
    };

    loadData();
  }, []);

  // ==========================
  // Handlers
  // ==========================
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleIndustrySelect = (industryId: number) => {
    if (
      !selectedIndustries.includes(industryId) &&
      selectedIndustries.length < 3
    ) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(
        selectedIndustries.filter((id) => id !== industryId)
      );
      const industryRoles = roles
        .filter((r) => r.industryId === industryId)
        .map((r) => r.id);
      setSelectedRoles(
        selectedRoles.filter((roleId) => !industryRoles.includes(roleId))
      );
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

    // Remove areas not part of selected states
    const validAreas = regions
      .filter((r) => newStates.includes(r.state))
      .map((r) => r.area);
    setPreferredAreas(preferredAreas.filter((a) => validAreas.includes(a)));
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

  const getAreasForState = (state: string) => {
    return regions.filter((r) => r.state === state).map((r) => r.area);
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
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* 1. Tagline */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection("tagline")}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">1. Profile Tagline</span>
                {expandedSections.tagline ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
              {expandedSections.tagline && (
                <div className="px-4 pb-4 border-t space-y-3">
                  <Input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Backpacker ready for farm work"
                  />
                </div>
              )}
            </div>

            {/* 2. Industries & Roles */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection("industries")}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">2. Industries & Roles</span>
                {expandedSections.industries ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
              {expandedSections.industries && (
                <div className="px-4 pb-4 border-t space-y-4">
                  <Label>Select up to 3 industries *</Label>
                  {industries.map((industry) => (
                    <label
                      key={industry.id}
                      className="flex items-center space-x-2 py-1"
                    >
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
                      <span>{industry.name}</span>
                    </label>
                  ))}

                  {selectedIndustries.map((industryId) => {
                    const industry = industries.find((i) => i.id === industryId);
                    const industryRoles = roles.filter(
                      (r) => r.industryId === industryId
                    );
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

            {/* 3. Preferred Locations */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection("states")}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">3. Preferred Locations</span>
                {expandedSections.states ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
              {expandedSections.states && (
                <div className="px-4 pb-4 border-t space-y-4">
                  <Label>Preferred States (up to 3)</Label>
                  {[...new Set(regions.map((r) => r.state))].map((state) => (
                    <div key={state} className="mb-4">
                      <label className="flex items-center space-x-2 py-1 font-medium">
                        <input
                          type="checkbox"
                          checked={preferredStates.includes(state)}
                          onChange={() => togglePreferredState(state)}
                          disabled={
                            preferredStates.length >= 3 &&
                            !preferredStates.includes(state)
                          }
                        />
                        <span>{state}</span>
                      </label>

                      {/* Areas under state */}
                      {preferredStates.includes(state) && (
                        <div className="ml-6 space-y-1">
                          {[...new Set(getAreasForState(state))].map((area) => (
                            <label
                              key={`${state}-${area}`}
                              className="flex items-center space-x-2 py-1"
                            >
                              <input
                                type="checkbox"
                                checked={preferredAreas.includes(area)}
                                onChange={() => togglePreferredArea(area)}
                                disabled={
                                  preferredAreas.length >= 3 &&
                                  !preferredAreas.includes(area)
                                }
                              />
                              <span>{area}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Review */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection("summary")}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">4. Review</span>
                {expandedSections.summary ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
              {expandedSections.summary && (
                <div className="px-4 pb-4 border-t space-y-4">
                  <p>
                    <strong>Tagline:</strong> {tagline}
                  </p>
                  <p>
                    <strong>Industries:</strong>{" "}
                    {selectedIndustries
                      .map((id) => industries.find((i) => i.id === id)?.name)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>Roles:</strong>{" "}
                    {selectedRoles
                      .map((id) => roles.find((r) => r.id === id)?.name)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>States:</strong> {preferredStates.join(", ")}
                  </p>
                  <p>
                    <strong>Areas:</strong> {preferredAreas.join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Continue */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={() => navigate("/whv/work-experience")}
                disabled={
                  !tagline.trim() ||
                  selectedIndustries.length === 0 ||
                  preferredStates.length === 0
                }
                className="w-full h-14 text-lg rounded-xl bg-orange-500 text-white"
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;



