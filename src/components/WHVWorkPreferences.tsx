import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
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

  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  const [visaLabel, setVisaLabel] = useState<string>("");

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    tagline: true,
    industries: false,
    states: false,
    summary: false,
  });

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

      // 2. Load eligible regions from region_rules
      console.log("sub_class filter:", String(visa.visa_stage.sub_class));
      console.log("stage filter (raw):", visa.visa_stage.stage, typeof visa.visa_stage.stage);

      // First try with stage as number
      let { data: regionData, error: regionError } = await supabase
        .from("region_rules")
        .select("sub_class, stage, state, area, postcode_range, industry_id")
        .eq("sub_class", String(visa.visa_stage.sub_class))
        .eq("stage", visa.visa_stage.stage);

      if (regionError) {
        console.error("Error fetching regions (number filter):", regionError);
      }

      if (!regionData || regionData.length === 0) {
        console.log("No results with number filter, retrying with string…");

        // Retry with stage as string
        const { data: regionDataStr, error: regionErrorStr } = await supabase
          .from("region_rules")
          .select("sub_class, stage, state, area, postcode_range, industry_id")
          .eq("sub_class", String(visa.visa_stage.sub_class))
          .eq("stage", visa.visa_stage.stage.toString());

        if (regionErrorStr) {
          console.error("Error fetching regions (string filter):", regionErrorStr);
        }

        regionData = regionDataStr || [];
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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleIndustrySelect = (industryId: number) => {
    if (!selectedIndustries.includes(industryId) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(selectedIndustries.filter((id) => id !== industryId));
      const industryRoles = roles.filter((r) => r.industryId === industryId).map((r) => r.id);
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
    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;

    setPreferredStates(newStates);

    const availableAreasForStates = newStates.flatMap((s) => availableAreas[s] || []);
    setPreferredAreas(preferredAreas.filter((a) => availableAreasForStates.includes(a)));
  };

  const togglePreferredArea = (area: string) => {
    setPreferredAreas(
      preferredAreas.includes(area)
        ? preferredAreas.filter((a) => a !== area)
        : preferredAreas.length < 3
        ? [...preferredAreas, area]
        : preferredAreas
    );
  };

  const getAvailableAreasForSelectedStates = () => {
    return preferredStates.flatMap((s) => availableAreas[s] || []);
  };

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
            <pre className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
              {JSON.stringify(regions, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;




