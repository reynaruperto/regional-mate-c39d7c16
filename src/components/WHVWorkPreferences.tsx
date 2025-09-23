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
  // Load data
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Profile + tagline
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

      if (!visa || !visa.visa_stage || !visa.country) return;

      setVisaLabel(
        `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
      );

      // Eligible industries (use new MV)
      const { data: eligibleIndustries } = await supabase
        .from("mvw_eligibility_visa_country_stage_industry")
        .select("industry_id, industry")
        .eq("sub_class", visa.visa_stage.sub_class)
        .eq("stage", visa.visa_stage.stage)
        .eq("country", visa.country.name);

      if (eligibleIndustries?.length) {
        setIndustries(
          eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry,
          }))
        );

        const industryIds = eligibleIndustries.map((i) => i.industry_id);

        // Roles
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

        // Regions
        const { data: regionData } = await supabase
          .from("regional_rules")
          .select("id, industry_id, state, suburb_city, postcode")
          .in("industry_id", industryIds);

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

    // Update tagline
    await supabase
      .from("whv_maker")
      .update({
        tagline: tagline.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Clear old prefs
    await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
    await supabase
      .from("maker_pref_industry_role")
      .delete()
      .eq("user_id", user.id);
    await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

    // Insert industries
    if (selectedIndustries.length) {
      await supabase.from("maker_pref_industry").insert(
        selectedIndustries.map((indId) => ({
          user_id: user.id,
          industry_id: indId,
        }))
      );
    }

    // Insert roles
    if (selectedRoles.length) {
      await supabase.from("maker_pref_industry_role").insert(
        selectedRoles.map((roleId) => ({
          user_id: user.id,
          industry_role_id: roleId,
        }))
      );
    }

    // Insert locations
    if (preferredAreas.length) {
      await supabase.from("maker_pref_location").insert(
        preferredAreas.map((locKey) => {
          const [suburb_city, postcode] = locKey.split("::");
          return {
            user_id: user.id,
            state: "Queensland",
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
      if (prev.includes(locKey)) {
        return prev.filter((a) => a !== locKey);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, locKey];
    });
  };

  const getAreasForState = (state: string) => {
    return regions
      .filter((r) => r.state === state && selectedIndustries.includes(r.industry_id))
      .map((r) => `${r.suburb_city}::${r.postcode}`);
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
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

          {/* Debug */}
          <div className="px-4 py-2 text-xs text-gray-500">
            <p><strong>Debug Data</strong></p>
            <p>Industries: {JSON.stringify(industries)}</p>
            <p>Roles: {JSON.stringify(roles)}</p>
            <p>Regions: {JSON.stringify(regions)}</p>
          </div>

          {/* Continue */}
          <div className="p-4 mt-auto">
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
      </div>
    </div>
  );
};

export default WHVWorkPreferences;
