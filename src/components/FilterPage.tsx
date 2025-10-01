// src/components/FilterPage.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface FilterPageProps {
  onClose: () => void;
  onResults: (candidates: any[]) => void;
  user: {
    id: string;
    jobId?: number;
  };
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onResults, user }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    workIndustry: "",
    state: "",
    suburbCityPostcode: "",
    workYearsExperience: "",
    preferredIndustries: [] as string[],
    licenses: [] as string[],
  });

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);

  // ✅ Load dropdown options
  useEffect(() => {
    const fetchFilters = async () => {
      // Industries
      const { data: industryData } = await supabase.from("industry").select("industry_id, name");
      if (industryData) {
        setIndustries(industryData.map((i) => ({ id: i.industry_id, name: i.name })));
      }

      // Licenses
      const { data: licenseData } = await supabase.from("license").select("license_id, name");
      if (licenseData) {
        setLicenses(licenseData.map((l) => ({ id: l.license_id, name: l.name })));
      }

      // States - fetch from maker_pref_location
      const { data: stateData } = await supabase
        .from("maker_pref_location")
        .select("state");
      if (stateData) {
        const uniqueStates = Array.from(new Set(stateData.map((l) => l.state as string)));
        setStates(uniqueStates);
      }
    };

    fetchFilters();
  }, []);

  // ✅ Apply filters
  const handleFindCandidates = async () => {
    const { data, error } = await (supabase as any).rpc("filter_makers_for_employer", {
      p_emp_id: user.id,
      p_job_id: user.jobId || null,
      p_filter_state: selectedFilters.state || null,
      p_filter_suburb_city_postcode: selectedFilters.suburbCityPostcode || null,
      p_filter_work_industry_id: selectedFilters.workIndustry
        ? parseInt(selectedFilters.workIndustry)
        : null,
      p_filter_work_years_experience: selectedFilters.workYearsExperience || null,
      p_filter_industry_ids:
        selectedFilters.preferredIndustries.length > 0 
          ? selectedFilters.preferredIndustries.map(id => parseInt(id)) 
          : null,
      p_filter_license_ids: 
        selectedFilters.licenses.length > 0 
          ? selectedFilters.licenses.map(id => parseInt(id)) 
          : null,
    });

    if (error) {
      console.error("Error filtering candidates:", error);
      return;
    }

    // ✅ Map results to same structure as BrowseCandidates
    const mapped = (data || []).map((c: any) => ({
      id: c.maker_id,
      name: c.given_name,
      profilePhoto: c.profile_photo || "/placeholder.png",
      workExperience: c.work_experience || [],
      preferredLocations: c.state_pref || [],
      preferredIndustries: c.industry_pref || [],
    }));

    onResults(mapped);
    onClose();
  };

  // ✅ Reset filters
  const handleClearFilters = () => {
    setSelectedFilters({
      workIndustry: "",
      state: "",
      suburbCityPostcode: "",
      workYearsExperience: "",
      preferredIndustries: [] as string[],
      licenses: [] as string[],
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={onClose}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Candidate Filters</h1>
            </div>

            {/* Filters */}
            <div className="flex-1 px-6 overflow-y-auto space-y-6">
              {/* Industry of Work Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry of Work Experience
                </label>
                <Select
                  value={selectedFilters.workIndustry}
                  onValueChange={(v) => setSelectedFilters((prev) => ({ ...prev, workIndustry: v }))}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Any industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate State</label>
                <Select
                  value={selectedFilters.state}
                  onValueChange={(v) => setSelectedFilters((prev) => ({ ...prev, state: v }))}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Any state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s, idx) => (
                      <SelectItem key={idx} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Suburb/Postcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Suburb & Postcode
                </label>
                <input
                  type="text"
                  value={selectedFilters.suburbCityPostcode}
                  onChange={(e) =>
                    setSelectedFilters((prev) => ({
                      ...prev,
                      suburbCityPostcode: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-3 border rounded-xl"
                  placeholder="Any suburb & postcode"
                />
              </div>

              {/* Licenses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Licenses (multi-select)
                </label>
                <Select
                  value={selectedFilters.licenses.length > 0 ? selectedFilters.licenses[0] : ""}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({
                      ...prev,
                      licenses: v ? [v] : [],
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Any license" />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Industries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Industries (multi-select)
                </label>
                <Select
                  value={selectedFilters.preferredIndustries.length > 0 ? selectedFilters.preferredIndustries[0] : ""}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({
                      ...prev,
                      preferredIndustries: v ? [v] : [],
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Any industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Years */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Work Experience
                </label>
                <Select
                  value={selectedFilters.workYearsExperience}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({ ...prev, workYearsExperience: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Any experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1–2 years</SelectItem>
                    <SelectItem value="3-4">3–4 years</SelectItem>
                    <SelectItem value="5-7">5–7 years</SelectItem>
                    <SelectItem value="8-10">8–10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Buttons */}
            <div className="px-6 pb-8 space-y-4">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full h-12 border-gray-300 text-gray-700 rounded-xl"
              >
                Clear Filters
              </Button>
              <Button
                onClick={handleFindCandidates}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Find Candidates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPage;
