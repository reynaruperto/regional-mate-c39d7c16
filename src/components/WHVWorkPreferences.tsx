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

      // Profile
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
        .eq("country_name", visa.country.name);

      if (eligibleIndustries?.length) {
        const uniqueIndustries = Array.from(
          new Map(
            eligibleIndustries
              .filter((i) => i.industry_id !== null)
              .map((i) => [i.industry_id, i])
          ).values()
        );

        setIndustries(
          uniqueIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry_name,
          }))
        );

        const industryIds = uniqueIndustries.map((i) => i.industry_id);

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
      }

      // ✅ Always load ALL regional rules
      const { data: regionData } = await supabase
        .from("regional_rules")
        .select("id, industry_id, state, suburb_city, postcode");

      if (regionData) {
        console.log("Loaded regional rules:", regionData.length, "rows");
        console.log("Unique states from regions:", [
          ...new Set(regionData.map((r) => r.state)),
        ]);
        setRegions(regionData.filter((r) => r.industry_id !== null));
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

    navigate("/whv/work-experience");
  };

  // ==========================
  // Handlers
  // ==========================
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleIndustrySelect = (industryId: number) => {
    const newSelected = selectedIndustries.includes(industryId)
      ? selectedIndustries.filter((id) => id !== industryId)
      : [...selectedIndustries, industryId].slice(0, 3);

    console.log("Selected industries:", newSelected);
    setSelectedIndustries(newSelected);
  };

  // 🔎 TEMP: ignore state filter so we can debug industry suburbs
  const getAreasForState = (state: string) => {
    const result = regions
      .filter((r) => selectedIndustries.includes(Number(r.industry_id)))
      .map((r) => `${r.suburb_city}::${r.postcode}`);

    console.log(`DEBUG - Areas (ignoring state) for ${state}:`, result.slice(0, 20));
    return result;
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between">
            <button
              onClick={() => navigate("/whv/profile-setup")}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Work Preferences
            </h1>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">4/6</span>
            </div>
          </div>

          {/* Visa Label */}
          {visaLabel && (
            <p className="px-6 mt-2 text-sm text-gray-500">Visa: {visaLabel}</p>
          )}

          {/* Debug Info */}
          <div className="px-6 mt-4">
            <p className="text-xs text-gray-500">
              Open the console to check loaded states + areas debug logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;
