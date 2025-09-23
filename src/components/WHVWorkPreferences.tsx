import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [visaLabel, setVisaLabel] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Profile
      const { data: profile } = await supabase
        .from("whv_maker")
        .select("nationality")
        .eq("user_id", user.id)
        .maybeSingle();

      // Visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, visa_stage:visa_stage(stage, sub_class, label), country:country(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile || !visa) return;

      setVisaLabel(
        `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
      );

      // Debug log: what we’re filtering with
      console.log("Filtering with:", {
        sub_class: visa.visa_stage.sub_class,
        stage: visa.visa_stage.stage,
        nationality: profile.nationality,
      });

      // ==========================
      // 1. Industries (filtered, case-insensitive country)
      // ==========================
      const { data: filteredIndustries, error: industriesError } =
        await supabase
          .from("mvw_eligibility_visa_country_stage_industry")
          .select("industry_id, industry, sub_class, stage, country")
          .eq("sub_class", String(visa.visa_stage.sub_class)) // match text
          .eq("stage", Number(visa.visa_stage.stage)) // match int
          .ilike("country", profile.nationality); // case-insensitive match

      if (industriesError) {
        console.error("Industries error:", industriesError);
      }

      if (filteredIndustries?.length) {
        setIndustries(
          filteredIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry,
          }))
        );

        const industryIds = filteredIndustries.map((i) => i.industry_id);

        // ==========================
        // 2. Roles (by industry)
        // ==========================
        const { data: roleData, error: roleError } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id")
          .in("industry_id", industryIds);

        if (roleError) {
          console.error("Roles error:", roleError);
        }

        if (roleData) {
          setRoles(
            roleData.map((r) => ({
              id: r.industry_role_id,
              name: r.role,
              industryId: r.industry_id,
            }))
          );
        }

        // ==========================
        // 3. Regions (by industry)
        // ==========================
        const { data: regionData, error: regionError } = await supabase
          .from("regional_rules")
          .select("id, industry_id, state, suburb_city, postcode")
          .in("industry_id", industryIds);

        if (regionError) {
          console.error("Regions error:", regionError);
        }

        if (regionData) {
          setRegions(regionData);
        }
      }
    };

    loadData();
  }, []);

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

          {/* Debug Section */}
          <div className="p-4 bg-gray-100 overflow-y-auto">
            <h2 className="font-bold">Debug Data</h2>

            <h3>Industries (filtered)</h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(industries, null, 2)}
            </pre>

            <h3>Roles</h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(roles, null, 2)}
            </pre>

            <h3>Regions</h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(regions, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;
