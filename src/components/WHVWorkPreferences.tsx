import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string; industryId: number }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<{ [state: string]: string[] }>({});
  const [regions, setRegions] = useState<any[]>([]);

  const [visaLabel, setVisaLabel] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("User ID:", user.id);

      // 1. Get visa + join visa_stage to fetch subclass + label
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, country_id, visa_stage(sub_class, stage, label)")
        .eq("user_id", user.id)
        .single();

      console.log("maker_visa + visa_stage:", visa);

      if (!visa) return;

      setVisaLabel(visa.visa_stage.label);

      // 2. Load eligible regions from region_rules (everything cast to string)
      const { data: regionData, error: regionError } = await supabase
        .from("region_rules")
        .select("sub_class, stage, state, area, postcode_range, industry_id")
        .eq("sub_class", String(visa.visa_stage.sub_class))
        .eq("stage", String(visa.visa_stage.stage));

      if (regionError) {
        console.error("Error fetching region rules:", regionError);
        return;
      }

      console.log("region_rules results:", regionData);
      setRegions(regionData || []);

      // 3. Load industries
      const { data: industryData } = await supabase.from("industry").select("industry_id, name");
      if (industryData) {
        setIndustries(industryData.map((i) => ({ id: i.industry_id, name: i.name })));
      }

      // 4. Load roles
      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, industry_id, role");
      if (roleData) {
        setRoles(roleData.map((r) => ({ id: r.industry_role_id, name: r.role, industryId: r.industry_id })));
      }

      // 5. Load tagline if exists
      const { data: makerData } = await supabase
        .from("whv_maker")
        .select("tagline")
        .eq("user_id", user.id)
        .maybeSingle();

      if (makerData?.tagline) setTagline(makerData.tagline);
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/profile-setup")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Work Preferences</h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">4/6</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Eligible industries based on <strong>{visaLabel}</strong>
            </p>
          </div>

          {/* Debug results */}
          <div className="p-4">
            <h2 className="font-semibold">Debug Regions</h2>
            <pre className="text-xs bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
              {JSON.stringify(regions, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;




