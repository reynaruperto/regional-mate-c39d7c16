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
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
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
  // Load data (visa → industries → roles → regional_rules)
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Visa info from maker_visa
      const { data: visa, error: visaError } = await supabase
        .from("maker_visa")
        .select(`
          stage_id,
          visa_stage:visa_stage(stage, sub_class, label),
          country:country(name)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (visaError) {
        console.error("Visa error:", visaError);
        return;
      }
      if (!visa) return;

      setVisaLabel(
        `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
      );

      // 2. Eligible industries
      const { data: eligibleIndustries, error: industriesError } = await supabase
        .from("temp_eligibility")
        .select("industry_id, industry_name")
        .eq("sub_class", visa.visa_stage.sub_class)
        .eq("stage", visa.visa_stage.stage)
        .eq("country_name", visa.country.name);

      console.log("Eligible industries:", eligibleIndustries, industriesError);

      if (!eligibleIndustries || eligibleIndustries.length === 0) return;

      setIndustries(
        eligibleIndustries.map((i) => ({
          id: i.industry_id,
          name: i.industry_name,
        }))
      );

      const industryIds = eligibleIndustries.map((i) => i.industry_id);

      // 3. Roles for eligible industries
      const { data: roleData, error: rolesError } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id")
        .in("industry_id", industryIds);

      console.log("Roles:", roleData, rolesError);

      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      // 4. Regional rules (QLD only, for eligible industries)
      const { data: regionData, error: regionError } = await supabase
        .from("regional_rules")
        .select("region_rules_id, industry_id, state, suburb_city, postcode")
        .in("industry_id", industryIds)
        .eq("state", "Queensland");

      console.log("Regional rules:", regionData, regionError);

      if (regionData) {
        setRegions(regionData);
      }
    };

    loadData();
  }, []);

  // ==========================
  // Handlers
  // ==========================
  const togglePreferredState = (state: string) => {
    if (state !== "Queensland") {
      setPopupMessage(
        `${state} is not currently eligible. Only Queensland is available at this stage.`
      );
      setShowPopup(true);
      return;
    }

    setPreferredStates(
      preferredStates.includes(state)
        ? preferredStates.filter((s) => s !== state)
        : [...preferredStates, state]
    );
  };

  const togglePreferredLocation = (loc: string) => {
    setPreferredLocations(
      preferredLocations.includes(loc)
        ? preferredLocations.filter((a) => a !== loc)
        : [...preferredLocations, loc]
    );
  };

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
      preferredLocations.forEach((loc) => {
        const [suburb_city, postcode] = loc.split("::");
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
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
            {/* Industries & Roles */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    industries: !prev.industries,
                  }))
                }
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">1. Industries & Roles</span>
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
                        onChange={() => {
                          if (!selectedIndustries.includes(industry.id)) {
                            setSelectedIndustries([...selectedIndustries, industry.id]);
                          } else {
                            setSelectedIndustries(
                              selectedIndustries.filter((id) => id !== industry.id)
                            );
                            setSelectedRoles(
                              selectedRoles.filter(
                                (roleId) =>
                                  !roles
                                    .filter((r) => r.industryId === industry.id)
                                    .map((r) => r.id)
                                    .includes(roleId)
                              )
                            );
                          }
                        }}
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
                              onClick={() =>
                                setSelectedRoles(
                                  selectedRoles.includes(role.id)
                                    ? selectedRoles.filter((r) => r !== role.id)
                                    : [...selectedRoles, role.id]
                                )
                              }
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
                  setExpandedSections((prev) => ({
                    ...prev,
                    states: !prev.states,
                  }))
                }
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">2. Preferred Locations</span>
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
                                      checked={preferredLocations.includes(locKey)}
                                      onChange={() => togglePreferredLocation(locKey)}
                                    />
                                    <span>
                                      {r.suburb_city} ({r.postcode})
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

            {/* Continue */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={
                  !tagline.trim() ||
                  selectedIndustries.length === 0 ||
                  preferredLocations.length === 0
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
