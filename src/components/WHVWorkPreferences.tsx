import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, ChevronRight, Zap } from "lucide-react";
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
  region_rules_id: number;
  industry_id: number;
  state: string;
  suburb_city: string;
  postcode: string;
}

const ALL_STATES = [
  "Queensland",
  "New South Wales",
  "Victoria",
  "Tasmania",
  "Western Australia",
  "South Australia",
  "Northern Territory",
  "Australian Capital Territory",
];

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

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // ==========================
  // Load data
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Visa info
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          `
          stage_id,
          visa_stage:visa_stage(stage, sub_class, label),
          country:country(name)
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!visa) return;

      setVisaLabel(
        `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
      );

      // 2. Eligible industries
      const { data: eligibleIndustries } = await supabase
        .from("temp_eligibility")
        .select("industry_id, industry_name")
        .eq("sub_class", visa.visa_stage.sub_class)
        .eq("stage", visa.visa_stage.stage)
        .eq("country_name", visa.country.name)
        .returns<{ industry_id: number; industry_name: string }[]>();

      if (eligibleIndustries) {
        setIndustries(
          eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry_name,
          }))
        );

        // 3. Roles for eligible industries
        const industryIds = eligibleIndustries.map((i) => i.industry_id);
        const { data: roleData } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id")
          .in("industry_id", industryIds);

        if (roleData) {
          setRoles(
            roleData.map((r) => ({
              id: r.industry_role_id,
              name: r.role,
              industryId: r.industry_id,
            }))
          );
        }

        // 4. Regions (from regional_rules, only QLD for now)
        const { data: regionData } = await supabase
          .from("regional_rules")
          .select(
            "region_rules_id, industry_id, state, suburb_city, postcode"
          )
          .in("industry_id", industryIds)
          .eq("state", "Queensland");

        if (regionData) {
          setRegions(regionData);
        }
      }
    };

    loadData();
  }, []);

  // ==========================
  // Save before continue
  // ==========================
  const handleContinue = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("whv_maker")
      .update({
        tagline: tagline.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    const preferenceRows: Array<{
      user_id: string;
      industry_role_id: number;
      region_rules_id: number;
    }> = [];

    selectedRoles.forEach((roleId) => {
      preferredAreas.forEach((locKey) => {
        const [suburb_city, postcode] = locKey.split("::");
        const region = regions.find(
          (r) => r.suburb_city === suburb_city && r.postcode === postcode
        );
        if (region) {
          preferenceRows.push({
            user_id: user.id,
            industry_role_id: roleId,
            region_rules_id: region.region_rules_id,
          });
        }
      });
    });

    if (preferenceRows.length > 0) {
      try {
        await supabase.from("maker_preference").insert(preferenceRows);
      } catch (error) {
        console.log("Some preferences may already exist, continuing...");
      }
    }

    navigate("/whv/work-experience");
  };

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
    if (state !== "Queensland") {
      setPopupMessage(
        `${state} is not currently eligible. Only Queensland is available.`
      );
      setShowPopup(true);
      return;
    }
    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : [...preferredStates, state];
    setPreferredStates(newStates);
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas(
      preferredAreas.includes(locKey)
        ? preferredAreas.filter((a) => a !== locKey)
        : [...preferredAreas, locKey]
    );
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="px-4 pt-10 pb-4 border-b bg-white flex-shrink-0">
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
            {visaLabel && (
              <p className="mt-2 text-sm text-gray-500">Visa: {visaLabel}</p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Tagline */}
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

            {/* Industries & Roles */}
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

            {/* Preferred Locations */}
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
                  {ALL_STATES.map((state) => (
                    <div key={state} className="mb-4">
                      <label className="flex items-center space-x-2 py-1 font-medium">
                        <input
                          type="checkbox"
                          checked={preferredStates.includes(state)}
                          onChange={() => togglePreferredState(state)}
                        />
                        <span>{state}</span>
                      </label>

                      {preferredStates.includes(state) &&
                        state === "Queensland" && (
                          <div className="ml-6 space-y-1">
                            <Label>Select Preferred Suburbs (multiple allowed)</Label>
                            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-white">
                              {regions
                                .filter((r) =>
                                  selectedIndustries.includes(r.industry_id)
                                )
                                .map((r) => {
                                  const locKey = `${r.suburb_city}::${r.postcode}`;
                                  return (
                                    <label
                                      key={r.region_rules_id}
                                      className="flex items-center space-x-2 py-1"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={preferredAreas.includes(locKey)}
                                        onChange={() => togglePreferredArea(locKey)}
                                        className="h-4 w-4"
                                      />
                                      <span>
                                        {r.suburb_city} ({r.postcode})
                                      </span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review */}
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
                    <strong>Visa:</strong> {visaLabel}
                  </p>
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
                    <strong>Areas:</strong>{" "}
                    {preferredAreas
                      .map((locKey) => {
                        const [suburb_city, postcode] = locKey.split("::");
                        return `${suburb_city} (${postcode})`;
                      })
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Continue */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={
                  !tagline.trim() ||
                  selectedIndustries.length === 0 ||
                  preferredAreas.length === 0
                }
                className="w-full h-14 text-lg rounded-xl bg-orange-500 text-white"
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>

        {/* ⚡ Popup */}
        {showPopup && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-5 w-72 shadow-xl text-center">
              <Zap className="mx-auto mb-3 text-orange-500" size={28} />
              <h3 className="text-base font-semibold mb-2">Not Available</h3>
              <p className="text-sm text-gray-600 mb-4">{popupMessage}</p>
              <Button
                onClick={() => setShowPopup(false)}
                className="w-full bg-[#1E293B] text-white rounded-xl h-10"
              >
                OK
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WHVWorkPreferences;
