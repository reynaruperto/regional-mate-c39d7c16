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
  // Load data (no filters first)
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      // Industries from materialized view
      const { data: eligibleIndustries, error: industriesError } =
        await supabase
          .from("mvw_eligibility_visa_country_stage_industry")
          .select("industry_id, industry, sub_class, stage, country")
          .limit(20);

      if (industriesError) {
        console.error("Supabase industries error:", industriesError);
      } else {
        console.log("Industries result:", eligibleIndustries);
      }

      if (eligibleIndustries?.length) {
        setIndustries(
          eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: `${i.industry} [${i.sub_class} / Stage ${i.stage} / ${i.country}]`,
          }))
        );
      }

      // Roles from industry_role
      const { data: roleData, error: roleError } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id")
        .limit(20);

      if (roleError) {
        console.error("Supabase roles error:", roleError);
      } else {
        console.log("Roles result:", roleData);
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

      // Regions from regional_rules
      const { data: regionData, error: regionError } = await supabase
        .from("regional_rules")
        .select("id, industry_id, state, suburb_city, postcode")
        .limit(20);

      if (regionError) {
        console.error("Supabase regions error:", regionError);
      } else {
        console.log("Regions result:", regionData);
      }

      if (regionData) {
        setRegions(regionData);
      }
    };

    loadData();
  }, []);

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
          </div>

          {/* Debug Section */}
          <div className="p-4 bg-gray-100 overflow-y-auto">
            <h2 className="font-bold">Debug Data</h2>

            <h3>Industries</h3>
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
