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
  industry_id: number;
  state: string;
  suburb_city: string;
  postcode: string;
  area: string;
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
        .from("mvw_eligibility_visa_country_stage_industry")
        .select("industry_id, industry")
        .eq("sub_class", visa.visa_stage.sub_class)
        .eq("stage", visa.visa_stage.stage)
        .ilike("country", `%${profile.nationality}%`); // FIX HERE

      if (eligibleIndustries?.length) {
        const industryIds = eligibleIndustries.map((i) => i.industry_id);

        // Roles
        const { data: roleData } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id")
          .in("industry_id", industryIds);

        // Regions
        const { data: regionData } = await supabase
          .from("regional_rules")
          .select("industry_id, state, suburb_city, postcode, area")
          .in("industry_id", industryIds);

        // Industries
        setIndustries(
          eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry,
          }))
        );

        // Roles
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
        if (regionData) {
          setRegions(regionData);
        }
      }

      // Load saved prefs
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

  // Debug log
  useEffect(() => {
    console.log("Industries:", industries);
    console.log("Roles:", roles);
    console.log("Regions:", regions);
  }, [industries, roles, regions]);

  // ==========================
  // Save before continue
  // ==========================
  const handleContinue = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // save logic...
    navigate("/whv/work-experience");
  };

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
      .filter(
        (r) =>
          r.state === state &&
          (selectedIndustries.length === 0 ||
            selectedIndustries.includes(r.industry_id))
      )
      .map((r) => `${r.suburb_city}::${r.postcode}`);
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">

          {/* Debug output */}
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-bold">Debug Data</h2>
            <h3>Industries</h3>
            <ul>
              {industries.map((i) => (
                <li key={i.id}>{i.id} - {i.name}</li>
              ))}
            </ul>
            <h3>Roles</h3>
            <ul>
              {roles.map((r) => (
                <li key={r.id}>{r.id} - {r.name} (Industry {r.industryId})</li>
              ))}
            </ul>
            <h3>Regions</h3>
            <ul>
              {regions.map((r, idx) => (
                <li key={idx}>
                  {r.state} - {r.suburb_city} ({r.postcode}) [Industry {r.industry_id}]
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;
