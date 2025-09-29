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

interface EligibleIndustry {
  industry_id: number;
  industry: string;
}

interface WorkLocationRule {
  rule_id: number;
  industry_id: number;
  state: string;
  suburb_city: string;
  postcode: string;
}

interface Region {
  id: number;
  industry_id: number;
  state: string;
  suburb_city: string;
  postcode: string;
}

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [dateAvailable, setDateAvailable] = useState("");

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

      // --- Get tagline ---
      const { data: profile } = await supabase
        .from("whv_maker")
        .select("tagline")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.tagline) setTagline(profile.tagline);

      // --- Get availability ---
      const { data: availability } = await (supabase as any)
        .from("maker_pref_availability")
        .select("availability")
        .eq("user_id", user.id)
        .maybeSingle();

      if (availability?.availability) {
        setDateAvailable(availability.availability);
      }

      // --- Get visa ---
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          `
          stage_id,
          visa_stage:visa_stage(stage, sub_class, label),
          country:country(name, country_id)
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!visa) return;

      setVisaLabel(
        `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
      );

      // --- Fetch eligible industries using new schema ---
      const { data: eligibleIndustries, error: indError } = await (supabase as any)
        .from("vw_eligibility_visa_country_stage_industry")
        .select("industry_id, industry")
        .eq("stage_id", visa.stage_id)
        .eq("country_id", visa.country.country_id);

      if (indError) {
        console.error("Industry fetch error:", indError);
        return;
      }

      if (!eligibleIndustries?.length) {
        setShowPopup(true);
        return;
      }

      const uniqueIndustries: Industry[] = eligibleIndustries.map(
        (item: EligibleIndustry) => ({
          id: item.industry_id,
          name: item.industry,
        })
      );

      setIndustries(uniqueIndustries);

      // --- Load saved prefs ---
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
  // Fetch roles when industry selected
  // ==========================
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedIndustries.length) {
        setRoles([]);
        return;
      }

      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id")
        .in("industry_id", selectedIndustries);

      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }
    };

    fetchRoles();
  }, [selectedIndustries]);

  // ==========================
  // Fetch locations with pagination
  // ==========================
  useEffect(() => {
    const fetchRegions = async () => {
      if (!selectedIndustries.length) {
        setRegions([]);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!visa) return;

      let allRegions: Region[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: regionPage, error } = await (supabase as any)
          .from("visa_work_location_rules")
          .select("rule_id, industry_id, state, suburb_city, postcode")
          .eq("stage_id", visa.stage_id)
          .in("industry_id", selectedIndustries)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error("Region fetch error:", error);
          break;
        }

        if (regionPage && regionPage.length > 0) {
          allRegions = [...allRegions, ...regionPage];
          page++;
        } else {
          hasMore = false;
        }
      }

      const mappedRegions: Region[] = allRegions.map((r: any) => ({
        id: r.rule_id,
        industry_id: r.industry_id,
        state: r.state,
        suburb_city: r.suburb_city,
        postcode: r.postcode,
      }));
      
      setRegions(mappedRegions);

      console.log(`✅ Total regions fetched: ${allRegions.length}`);
    };

    fetchRegions();
  }, [selectedIndustries]);

  // ==========================
  // Save before continue
  // ==========================
  const handleContinue = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update tagline
    await supabase
      .from("whv_maker")
      .update({
        tagline: tagline.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Update availability
    await (supabase as any).from("maker_pref_availability").delete().eq("user_id", user.id);
    if (dateAvailable) {
      await (supabase as any).from("maker_pref_availability").insert([
        {
          user_id: user.id,
          availability: dateAvailable,
        },
      ]);
    }

    // Update preferences
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
            state: (preferredStates[0] || "Queensland") as
              | "Australian Capital Territory"
              | "New South Wales"
              | "Northern Territory"
              | "Queensland"
              | "South Australia"
              | "Tasmania"
              | "Victoria"
              | "Western Australia",
            suburb_city,
            postcode,
          };
        })
      );
    }

    navigate("/whv/work-experience");
  };

  // ==========================
  // Helpers
  // ==========================
  const handleIndustrySelect = (industryId: number) => {
    if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries([]);
      setSelectedRoles([]);
    } else {
      setSelectedIndustries([industryId]); // only one industry at a time
      setSelectedRoles([]);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId)
        ? selectedRoles.filter((r) => r !== roleId)
        : [...selectedRoles, roleId]
    );
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas((prev) =>
      prev.includes(locKey) ? prev.filter((a) => a !== locKey) : [...prev, locKey]
    );
  };

  const getAreasForState = (state: string) => {
    const selectedIndustryId = selectedIndustries[0];
    const filtered = regions.filter(
      (r) => r.state === state && r.industry_id === selectedIndustryId
    );
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
            {/* Tagline + Date Available */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setExpandedSections((p) => ({ ...p, tagline: !p.tagline }))
                }
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">
                  1. Profile Tagline & Availability
                </span>
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
                  <div>
                    <Label>
                      Date Available to Start Work{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={dateAvailable}
                      onChange={(e) => setDateAvailable(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Industries & Roles */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setExpandedSections((p) => ({ ...p, industries: !p.industries }))
                }
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
                onClick={() =>
                  setExpandedSections((p) => ({ ...p, states: !p.states }))
                }
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
                  {selectedIndustries.length > 0 &&
                    [...new Set(regions.map((r) => r.state))].map((state) => (
                      <div key={state} className="mb-4">
                        <label className="flex items-center space-x-2 py-1 font-medium">
                          <input
                            type="checkbox"
                            checked={preferredStates.includes(state)}
                            onChange={() =>
                              setPreferredStates((prev) =>
                                prev.includes(state)
                                  ? prev.filter((s) => s !== state)
                                  : [...prev, state]
                              )
                            }
                          />
                          <span>{state}</span>
                        </label>

                        {preferredStates.includes(state) && (
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

            {/* Review */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setExpandedSections((p) => ({ ...p, summary: !p.summary }))
                }
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
                    <strong>Date Available:</strong> {dateAvailable}
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

            {/* Continue */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={
                  !tagline.trim() ||
                  !dateAvailable ||
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

          {/* Popup for ineligible */}
          {showPopup && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
                <h2 className="text-lg font-semibold mb-3">Not Eligible</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your country/visa stage is not eligible for any work industries.
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

