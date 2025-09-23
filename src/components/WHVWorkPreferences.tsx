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

      console.log("DEBUG filters →");
      console.log("sub_class:", visa.visa_stage.sub_class);
      console.log("stage:", visa.visa_stage.stage);
      console.log("nationality:", profile.nationality);

      // ==========================
      // Eligible industries (forgiving filters)
      // ==========================
      const { data: eligibleIndustries, error } = await supabase
        .from("mvw_eligibility_visa_country_stage_industry")
        .select("industry_id, industry, sub_class, stage, country")
        .ilike("sub_class", `%${String(visa.visa_stage.sub_class).trim()}%`)
        .filter("stage::text", "ilike", `%${String(visa.visa_stage.stage).trim()}%`)
        .ilike("country", `%${profile.nationality?.trim()}%`);

      if (error) {
        console.error("Supabase error (eligibility):", error);
      }
      console.log("Eligible industries result:", eligibleIndustries);

      if (eligibleIndustries?.length) {
        setIndustries(
          eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry,
          }))
        );

        const industryIds = eligibleIndustries.map((i) => i.industry_id);

        // Roles
        const { data: roleData, error: roleError } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id")
          .in("industry_id", industryIds);

        if (roleError) console.error("Supabase error (roles):", roleError);
        console.log("Roles result:", roleData);

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
        const { data: regionData, error: regionError } = await supabase
          .from("regional_rules")
          .select("id, industry_id, state, suburb_city, postcode")
          .in("industry_id", industryIds);

        if (regionError) console.error("Supabase error (regions):", regionError);
        console.log("Regions result:", regionData);

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
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
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
