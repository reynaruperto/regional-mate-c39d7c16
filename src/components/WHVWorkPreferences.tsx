import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHVWorkPreferences: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { visaType, visaStage } =
    (location.state as { visaType: string; visaStage: string }) || {
      visaType: "417",
      visaStage: "1",
    };

  const [tagline, setTagline] = useState("");
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [regionRules, setRegionRules] = useState<any[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // ==========================
  // Load data from region_rules filtered by visa type and stage
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      // Load region rules filtered by visa type and stage
      const { data: regionData, error: regionError } = await supabase
        .from("region_rules")
        .select("*")
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (!regionError && regionData) {
        setRegionRules(regionData);
        
        // Extract unique industries
        const industries = [...new Set(regionData.map((rule: any) => rule.industry_name))];
        setAvailableIndustries(industries);
        
        // Extract unique states
        const states = [...new Set(regionData.map((rule: any) => rule.state))];
        setAvailableStates(states);
        
        // Extract all areas (will be filtered by state selection)
        const areas = [...new Set(regionData.map((rule: any) => rule.area))];
        setAvailableAreas(areas);
      }
    };

    loadData();
  }, [visaType, visaStage]);

  // Filter areas based on selected states
  const getFilteredAreas = () => {
    if (preferredStates.length === 0) return availableAreas;
    
    const areasForSelectedStates = regionRules
      .filter((rule: any) => preferredStates.includes(rule.state))
      .map((rule: any) => rule.area);
    
    return [...new Set(areasForSelectedStates)];
  };

  // ==========================
  // Tooltip validation - checks eligibility based on region_rules
  // ==========================
  const getIndustryTooltip = (
    industry: string,
    state: string,
    area: string
  ): string => {
    // Check if this combination exists in region_rules
    const matchingRule = regionRules.find((rule: any) => 
      rule.industry_name === industry && 
      rule.state === state && 
      rule.area === area
    );

    if (matchingRule) {
      return `✅ Eligible for visa extension`;
    } else {
      return `⚠️ Not eligible for visa extension`;
    }
  };

  // ==========================
  // Toggle helpers
  // ==========================
  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== industry));
    } else if (selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const togglePreferredState = (state: string) => {
    setPreferredStates(
      preferredStates.includes(state)
        ? preferredStates.filter((s) => s !== state)
        : preferredStates.length < 3
        ? [...preferredStates, state]
        : preferredStates
    );
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

  // ==========================
  // Save to Supabase
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update tagline in whv_maker table
    const { error: updateError } = await (supabase as any)
      .from("whv_maker")
      .update({ tagline })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update tagline:", updateError);
      return;
    }

    // Save preferences - create entries for each combination
    for (const industry of selectedIndustries) {
      for (const state of preferredStates) {
        // Find the industry_id from the original industry table
        const { data: industryData } = await (supabase as any)
          .from("industry")
          .select("industry_id")
          .eq("name", industry)
          .single();

        if (industryData) {
          const { error: insertError } = await (supabase as any)
            .from("maker_preference")
            .insert({
              user_id: user.id,
              state,
              suburb_city: preferredAreas.join(", "),
              industry_id: industryData.industry_id,
            });

          if (insertError) {
            console.error("Failed to insert preference:", insertError);
          }
        }
      }
    }

    navigate("/whv/work-experience");
  };

  // ==========================
  // Render
  // ==========================
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
              <h1 className="text-lg font-medium text-gray-900">
                Work Preferences
              </h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">4/6</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
              {/* Tagline */}
              <div className="space-y-2">
                <Label>Profile Tagline *</Label>
                <Input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="h-12 bg-gray-100 border-0"
                  maxLength={60}
                />
              </div>

              {/* Industries */}
              <div className="space-y-3">
                <Label>Select up to 3 industries *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {availableIndustries.map((industry) => (
                    <label
                      key={industry}
                      className="flex items-center space-x-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry)}
                        disabled={
                          selectedIndustries.length >= 3 &&
                          !selectedIndustries.includes(industry)
                        }
                        onChange={() => toggleIndustry(industry)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* States */}
              <div className="space-y-3">
                <Label>Preferred States (up to 3) *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {availableStates.map((state) => (
                    <label key={state} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={preferredStates.includes(state)}
                        disabled={
                          preferredStates.length >= 3 &&
                          !preferredStates.includes(state)
                        }
                        onChange={() => togglePreferredState(state)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-3">
                <Label>Preferred Areas (up to 3) *</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                  {getFilteredAreas().map((area) => (
                    <label key={area} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={preferredAreas.includes(area)}
                        disabled={
                          preferredAreas.length >= 3 &&
                          !preferredAreas.includes(area)
                        }
                        onChange={() => togglePreferredArea(area)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Eligibility Tooltips */}
              {selectedIndustries.length > 0 &&
                preferredStates.length > 0 &&
                preferredAreas.length > 0 && (
                  <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Eligibility Status:</h4>
                    {selectedIndustries.map((industry) =>
                      preferredStates.map((state) =>
                        preferredAreas.map((area) => (
                          <p
                            key={`${industry}-${state}-${area}`}
                            className={`${
                              getIndustryTooltip(industry, state, area).includes("⚠️")
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            <span className="font-medium">{industry}</span> in {state} ({area}): {getIndustryTooltip(industry, state, area)}
                          </p>
                        ))
                      )
                    )}
                  </div>
                )}

              {/* Continue */}
              <div className="pt-8">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  disabled={selectedIndustries.length === 0 || preferredStates.length === 0 || preferredAreas.length === 0}
                >
                  Continue →
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;