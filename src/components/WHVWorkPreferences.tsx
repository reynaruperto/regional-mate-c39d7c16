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

type EligibilityRow = {
  industry_id: number;
  industry: string;
};

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

      // Get nationality and tagline
      const { data: profile } = await supabase
        .from("whv_maker")
        .select("nationality, tagline")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.tagline) setTagline(profile.tagline);

      // Get visa details
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

      // ✅ Fetch eligible industries from materialized view
      const { data: eligibleIndustries, error: eligibilityError } =
        await supabase
          .from("mvw_eligibility_visa_country_stage_industry" as any)
          .select("industry_id, industry")
          .eq("sub_class", visa.visa_stage.sub_class)
          .eq("stage", visa.visa_stage.stage)
          .eq("country", profile.nationality);

      if (eligibilityError) {
        console.error("Eligibility query error:", eligibilityError);
      }

      console.log("Eligible industries", eligibleIndustries);

      if (eligibleIndustries?.length) {
        setIndustries(
          eligibleIndustries.map((i: any) => ({
            id: i.industry_id,
            name: i.industry,
          }))
        );

        const industryIds = eligibleIndustries.map((i: any) => i.industry_id);

        // Roles
        const { data: roleData } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id")
          .in("industry_id", industryIds);

        console.log("Roles", roleData);

        if (roleData) {
          setRoles(
            roleData.map((r) => ({
              id: r.industry_role_id,
              name: r.role,
              industryId: r.industry_id,
            }))
          );
        }

        // Regions - Add explicit limit and cast industry_id to number
        const { data: regionData, error: regionError } = await supabase
          .from("regional_rules")
          .select("id, industry_id, state, suburb_city, postcode")
          .in("industry_id", industryIds.map(Number))
          .range(0, 19999);

        console.log("Regions query with industryIds:", industryIds);
        console.log("Regions query with converted industryIds:", industryIds.map(Number));
        console.log("Region query error:", regionError);
        console.log("Regions total count:", regionData?.length);
        console.log("First 10 regionData results:", regionData?.slice(0, 10));

        if (regionData) {
          setRegions(regionData);
          // Debug: Check how many regions we have per industry
          const regionsByIndustry = regionData.reduce((acc, r) => {
            acc[r.industry_id] = (acc[r.industry_id] || 0) + 1;
            return acc;
          }, {});
          console.log("Regions by industry:", regionsByIndustry);
          
          // Debug: Check for Mining (industry 11) specifically
          const miningRegions = regionData.filter(r => r.industry_id === 11);
          console.log("Mining regions found:", miningRegions.length);
          console.log("Sample Mining regions:", miningRegions.slice(0, 3));
        }
      }

      // ===== Load saved prefs =====
      const { data: savedIndustries } = await supabase
        .from("maker_pref_industry")
        .select("industry_id")
        .eq("user_id", user.id);

      if (savedIndustries) {
        setSelectedIndustries(savedIndustries.map((i) => i.industry_id));
      }

      const { data: savedRoles } = await supabase
        .from("maker_pref_industry_role")
        .select("industry_role_id")
        .eq("user_id", user.id);

      if (savedRoles) {
        setSelectedRoles(savedRoles.map((r) => r.industry_role_id));
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

    await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
    await supabase.from("maker_pref_industry_role").delete().eq("user_id", user.id);
    await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

    if (selectedIndustries.length) {
      await supabase.from("maker_pref_industry").insert(
        selectedIndustries.map((indId) => ({
          user_id: user.id,
          industry_id: indId,
        }))
      );
    }

    if (selectedRoles.length) {
      await supabase.from("maker_pref_industry_role").insert(
        selectedRoles.map((roleId) => ({
          user_id: user.id,
          industry_role_id: roleId,
        }))
      );
    }

    if (preferredAreas.length) {
      await supabase.from("maker_pref_location").insert(
        preferredAreas.map((locKey) => {
          const [suburb_city, postcode] = locKey.split("::");
          return {
            user_id: user.id,
            state: "Queensland" as const,
            suburb_city,
            postcode,
          };
        })
      );
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
    if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries([]);
      setSelectedRoles([]);
    } else {
      setSelectedIndustries([industryId]);
      setSelectedRoles([]);
      console.log("Selected industry:", industryId, "Available areas for Queensland:", getAreasForState("Queensland").length);
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
      : [...preferredStates, state];
    setPreferredStates(newStates);

    const validAreas = regions
      .filter((r) => newStates.includes(r.state))
      .map((r) => `${r.suburb_city}::${r.postcode}`);
    setPreferredAreas(preferredAreas.filter((a) => validAreas.includes(a)));
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas((prev) => {
      if (prev.includes(locKey)) return prev.filter((a) => a !== locKey);
      return [...prev, locKey];
    });
  };

  const getAreasForState = (state: string) => {
    const selectedIndustryId = selectedIndustries[0];
    console.log("=== getAreasForState DEBUG ===");
    console.log("State:", state, "Type:", typeof state);
    console.log("Selected Industry ID:", selectedIndustryId, "Type:", typeof selectedIndustryId);
    console.log("Total regions loaded:", regions.length);
    
    // Debug: Check what industry IDs exist in regions
    const uniqueIndustryIds = [...new Set(regions.map(r => r.industry_id))];
    console.log("Unique industry IDs in regions:", uniqueIndustryIds);
    console.log("Expected industry IDs from eligible industries:", industries.map(i => i.id));
    console.log("Sample regions with industry IDs:", regions.slice(0, 10).map(r => ({ id: r.id, industry_id: r.industry_id, state: r.state })));
    console.log("Types of industry IDs in regions:", regions.slice(0, 3).map(r => ({ id: r.industry_id, type: typeof r.industry_id })));
    
    const filtered = regions.filter((r) => {
      const stateMatch = r.state === state;
      const industryMatch = Number(r.industry_id) === Number(selectedIndustryId);
      
      if (Number(r.industry_id) === Number(selectedIndustryId)) {
        console.log("Found potential match:", { 
          regionId: r.id, 
          regionState: r.state, 
          regionStateType: typeof r.state,
          regionIndustryId: r.industry_id, 
          regionIndustryType: typeof r.industry_id,
          selectedIndustryId,
          selectedIndustryType: typeof selectedIndustryId,
          stateMatch, 
          industryMatch,
          strictEqual: r.industry_id === selectedIndustryId,
          looseEqual: r.industry_id == selectedIndustryId
        });
      }
      
      return stateMatch && industryMatch;
    });
    
    console.log("Filtered regions count:", filtered.length);
    console.log("=== END DEBUG ===");
    return filtered.map((r) => `${r.suburb_city}::${r.postcode}`);
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
                  <Label>Select one industry *</Label>
                  {industries.map((industry) => (
                    <label
                      key={industry.id}
                      className="flex items-center space-x-2 py-1"
                    >
                      <input
                        type="radio"
                        checked={selectedIndustries.includes(industry.id)}
                        onChange={() => handleIndustrySelect(industry.id)}
                        className="h-4 w-4"
                        name="industry"
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
                  <Label>Preferred States</Label>
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
                        state === "Queensland" &&
                        selectedIndustries.length > 0 && (
                          <div className="ml-6 space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                            {getAreasForState(state).length > 0 ? (
                              getAreasForState(state).map((locKey) => {
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
                                    />
                                    <span>
                                      {suburb_city} ({postcode})
                                    </span>
                                  </label>
                                );
                              })
                            ) : (
                              <p className="text-sm text-gray-500 p-2">
                                No locations available for the selected industry in {state}
                              </p>
                            )}
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
                      .map((id) => industries.find((i) => i.id)?.name)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>Roles:</strong>{" "}
                    {selectedRoles
                      .map((id) => roles.find((r) => r.id)?.name)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>States:</strong> {preferredStates.join(", ")}
                  </p>
                  <p>
                    <strong>Suburbs:</strong>{" "}
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

            <div className="pt-4">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={
                  !tagline.trim() ||
                  selectedIndustries.length === 0 ||
                  preferredStates.length === 0 ||
                  preferredAreas.length === 0
                }
                className="w-full h-14 text-lg rounded-xl bg-orange-500 text-white"
              >
                Continue →
              </Button>
            </div>
          </div>

          {/* Popup */}
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
