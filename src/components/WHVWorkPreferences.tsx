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
  id: number;
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

  // ==========================
  // Load data + existing prefs
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Profile nationality
      const { data: profile } = await supabase
        .from("whv_maker")
        .select("nationality, tagline")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.tagline) setTagline(profile.tagline);

      // Visa
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

      if (!profile || !visa) return;

      setVisaLabel(
        `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
      );

      // Eligible industries
      const { data: eligibleIndustries } = await supabase
        .from("temp_eligibility")
        .select("industry_id, industry_name")
        .eq("sub_class", visa.visa_stage.sub_class)
        .eq("stage", visa.visa_stage.stage)
        .eq("country_name", profile.nationality);

      if (eligibleIndustries?.length) {
        // ✅ Force IDs to numbers
        const uniqueIndustries = Array.from(
          new Map(
            eligibleIndustries.map((i) => [Number(i.industry_id), i])
          ).values()
        );

        setIndustries(
          uniqueIndustries.map((i) => ({
            id: Number(i.industry_id),
            name: i.industry_name,
          }))
        );

        const industryIds = uniqueIndustries.map((i) => Number(i.industry_id));

        // Roles
        const { data: roleData } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id")
          .in("industry_id", industryIds);

        if (roleData) {
          setRoles(
            roleData.map((r) => ({
              id: Number(r.industry_role_id),
              name: r.role,
              industryId: Number(r.industry_id),
            }))
          );
        }

        // Regions
        const { data: regionData } = await supabase
          .from("regional_rules")
          .select("id, industry_id, state, suburb_city, postcode")
          .in("industry_id", industryIds);

        if (regionData) {
          console.log("Loaded regional rules:", regionData.length, "rows");
          console.log("Unique states from regions:", [
            ...new Set(regionData.map((r) => r.state)),
          ]);
          setRegions(
            regionData.map((r) => ({
              ...r,
              industry_id: Number(r.industry_id),
            }))
          );
        }
      }

      // ===== Load saved prefs =====
      const { data: savedIndustries } = await supabase
        .from("maker_pref_industry")
        .select("industry_id")
        .eq("user_id", user.id);

      if (savedIndustries) {
        setSelectedIndustries(savedIndustries.map((i) => Number(i.industry_id)));
      }

      const { data: savedRoles } = await supabase
        .from("maker_pref_industry_role")
        .select("industry_role_id")
        .eq("user_id", user.id);

      if (savedRoles) {
        setSelectedRoles(savedRoles.map((r) => Number(r.industry_role_id)));
      }

      const { data: savedLocations } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", user.id);

      if (savedLocations) {
        setPreferredStates([...new Set(savedLocations.map((l) => l.state))]);
        setPreferredAreas(
          savedLocations.map((l) => `${l.suburb_city}::${l.postcode}`)
        );
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
    const id = Number(industryId); // ✅ normalize
    console.log("Toggling industry:", id);

    if (!selectedIndustries.includes(id) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, id]);
    } else if (selectedIndustries.includes(id)) {
      setSelectedIndustries(selectedIndustries.filter((x) => x !== id));
      const industryRoles = roles.filter((r) => r.industryId === id).map((r) => r.id);
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
    if (state !== "Queensland") {
      setShowPopup(true);
      return;
    }

    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;
    setPreferredStates(newStates);

    const validAreas = regions
      .filter((r) => newStates.includes(r.state))
      .map((r) => `${r.suburb_city}::${r.postcode}`);
    setPreferredAreas(preferredAreas.filter((a) => validAreas.includes(a)));
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas((prev) => {
      if (prev.includes(locKey)) return prev.filter((a) => a !== locKey);
      if (prev.length >= 3) return prev;
      return [...prev, locKey];
    });
  };

  const getAreasForState = (state: string) => {
    console.log("Selected industries right now:", selectedIndustries);

    const result = regions
      .filter(
        (r) =>
          r.state === state &&
          selectedIndustries.includes(Number(r.industry_id))
      )
      .map((r) => `${r.suburb_city}::${r.postcode}`);

    console.log(`Areas for ${state}:`, result.slice(0, 20));
    return result;
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
            {visaLabel && (
              <p className="mt-2 text-sm text-gray-500">Visa: {visaLabel}</p>
            )}
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
                  {ALL_STATES.map((state) => (
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

                      {preferredStates.includes(state) &&
                        state === "Queensland" && (
                          <div className="ml-6 space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                            {getAreasForState(state).map((locKey) => {
                              const [suburb_city, postcode] = locKey.split("::");
                              return (
                                <label
                                  key={locKey}
                                  className="flex items-center space-x-2 py-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={preferredAreas.includes(locKey)}
                                    onChange={() => togglePreferredArea(locKey)}
                                    disabled={
                                      preferredAreas.length >= 3 &&
                                      !preferredAreas.includes(locKey)
                                    }
                                  />
                                  <span>
                                    {suburb_city} ({postcode})
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popup for invalid states */}
          {showPopup && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
                <h2 className="text-lg font-semibold mb-3">Not Eligible</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Only Queensland is eligible at this time.
                </p>
                <Button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-slate-800 text-white rounded-lg"
                >
                  OK
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;
