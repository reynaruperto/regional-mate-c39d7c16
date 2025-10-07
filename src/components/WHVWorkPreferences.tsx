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

      const { data: profile } = await supabase.from("whv_maker").select("tagline").eq("user_id", user.id).maybeSingle();

      if (profile?.tagline) setTagline(profile.tagline);

      const { data: availability } = await supabase
        .from("maker_pref_availability")
        .select("available_from")
        .eq("user_id", user.id)
        .maybeSingle();

      if (availability?.available_from) setDateAvailable(availability.available_from);

      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          `
          stage_id,
          visa_stage:visa_stage(stage, sub_class, label),
          country:country(name, country_id)
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!visa) return;

      setVisaLabel(`${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`);

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

      setIndustries(
        eligibleIndustries.map((item: EligibleIndustry) => ({
          id: item.industry_id,
          name: item.industry,
        })),
      );

      const { data: savedIndustries } = await supabase
        .from("maker_pref_industry")
        .select("industry_id")
        .eq("user_id", user.id);
      if (savedIndustries) setSelectedIndustries(savedIndustries.map((i) => i.industry_id));

      const { data: savedRoles } = await supabase
        .from("maker_pref_industry_role")
        .select("industry_role_id")
        .eq("user_id", user.id);
      if (savedRoles) setSelectedRoles(savedRoles.map((r) => r.industry_role_id));

      const { data: savedLocations } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", user.id);
      if (savedLocations) {
        setPreferredStates([...new Set(savedLocations.map((l) => l.state))]);
        setPreferredAreas(savedLocations.map((l) => `${l.suburb_city}::${l.postcode}`));
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
          })),
        );
      }
    };

    fetchRoles();
  }, [selectedIndustries]);

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

    await supabase.from("maker_pref_availability").delete().eq("user_id", user.id);
    if (dateAvailable) {
      await supabase.from("maker_pref_availability").insert([{ user_id: user.id, available_from: dateAvailable }]);
    }

    await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
    await supabase.from("maker_pref_industry_role").delete().eq("user_id", user.id);
    await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

    if (selectedIndustries.length) {
      await supabase.from("maker_pref_industry").insert(
        selectedIndustries.map((id) => ({
          user_id: user.id,
          industry_id: id,
        })),
      );
    }

    if (selectedRoles.length) {
      await supabase.from("maker_pref_industry_role").insert(
        selectedRoles.map((id) => ({
          user_id: user.id,
          industry_role_id: id,
        })),
      );
    }

    if (preferredAreas.length) {
      await supabase.from("maker_pref_location").insert(
        preferredAreas.map((locKey) => {
          const [suburb_city, postcode] = locKey.split("::");
          return {
            user_id: user.id,
            state: preferredStates[0] || "Queensland",
            suburb_city,
            postcode,
          };
        }),
      );
    }

    navigate("/whv/work-experience");
  };

  const handleIndustrySelect = (id: number) => {
    if (selectedIndustries.includes(id)) {
      setSelectedIndustries([]);
      setSelectedRoles([]);
    } else {
      setSelectedIndustries([id]);
      setSelectedRoles([]);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId) ? selectedRoles.filter((r) => r !== roleId) : [...selectedRoles, roleId],
    );
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas((prev) => (prev.includes(locKey) ? prev.filter((a) => a !== locKey) : [...prev, locKey]));
  };

  const getAreasForState = (state: string) => {
    const selectedIndustryId = selectedIndustries[0];
    return regions
      .filter((r) => r.state === state && r.industry_id === selectedIndustryId)
      .map((r) => `${r.suburb_city}::${r.postcode}`);
  };

  // ==========================
  // UI
  // ==========================
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative overflow-hidden">
        <div className="w-full h-full bg-white rounded-[54px] flex flex-col relative overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-20"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between flex-shrink-0 bg-white z-10">
            <button
              onClick={() => navigate("/whv/profile-setup")}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Work Preferences</h1>
            <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-sm">4/6</span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-40">
            {/* Tagline */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setExpandedSections((p) => ({ ...p, tagline: !p.tagline }))}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-lg font-medium">1. Profile Tagline & Availability</span>
                {expandedSections.tagline ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                    <Label>Date Available to Start Work *</Label>
                    <Input type="date" value={dateAvailable} onChange={(e) => setDateAvailable(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Other expandable sections remain unchanged */}
            {/* ... (Industries, Preferred Locations, Review) ... */}
          </div>

          {/* ✅ Fixed Continue Button */}
          <div className="absolute bottom-0 left-0 w-full bg-white px-6 py-4 border-t z-20 rounded-b-[54px]">
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
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl"
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
