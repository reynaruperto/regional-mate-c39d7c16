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
  onResults: (filteredCandidates: any[], appliedFilters: any) => void;
  employerId: string;
  jobId: number;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onResults, employerId, jobId }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    p_filter_state: "",
    p_filter_suburb_city_postcode: "",
    p_filter_work_industry_id: "",
    p_filter_work_years_experience: "",
    p_filter_industry_ids: "",
    p_filter_license_ids: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [suburbPostcodes, setSuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ---------- load locations ----------
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");
      if (error) return console.error("Error fetching locations:", error);

      if (data) {
        setStates([...new Set(data.map((l) => l.state).filter(Boolean))]);
        setSuburbPostcodes([
          ...new Set(
            data
              .map((l) =>
                l.suburb_city && l.postcode ? `${l.suburb_city} – ${l.postcode}` : null
              )
              .filter(Boolean)
          ),
        ]);
      }
    };
    fetchLocations();
  }, []);

  // ---------- load industries ----------
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase.from("industry").select("industry_id, name");
      if (error) return console.error("Error fetching industries:", error);
      if (data) setIndustries(data.map((r) => ({ id: r.industry_id, name: r.name })));
    };
    fetchIndustries();
  }, []);

  // ---------- load licenses ----------
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error } = await supabase.from("license").select("license_id, name");
      if (error) return console.error("Error fetching licenses:", error);
      if (data) setLicenses(data.map((r) => ({ id: r.license_id, name: r.name })));
    };
    fetchLicenses();
  }, []);

  // ---------- experience levels ----------
  useEffect(() => {
    setExperienceLevels(["None", "<1", "1-2", "3-4", "5-7", "8-10", "10+"]);
  }, []);

  const handleSelectChange = (category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  // ✅ Apply filters and return results + labels
  const applyFilters = async () => {
    try {
      // 🟢 First, fetch all eligible candidates
      const { data: allCandidates, error } = await (supabase as any).rpc("view_all_eligible_makers", {
        p_emp_id: employerId,
        p_job_id: jobId,
      });
      
      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }

      // 🟢 Apply filters client-side
      let filtered = allCandidates || [];

      // Filter by work industry
      if (selectedFilters.p_filter_work_industry_id) {
        const industryName = industries.find(
          (i) => i.id === Number(selectedFilters.p_filter_work_industry_id)
        )?.name;
        filtered = filtered.filter((c: any) =>
          c.work_experience?.some((we: any) => we.industry === industryName)
        );
      }

      // Filter by preferred industry
      if (selectedFilters.p_filter_industry_ids) {
        const industryName = industries.find(
          (i) => i.id === Number(selectedFilters.p_filter_industry_ids)
        )?.name;
        filtered = filtered.filter((c: any) =>
          c.industry_pref?.includes(industryName)
        );
      }

      // Filter by state
      if (selectedFilters.p_filter_state) {
        filtered = filtered.filter((c: any) =>
          c.state_pref?.includes(selectedFilters.p_filter_state)
        );
      }

      // Filter by suburb/postcode
      if (selectedFilters.p_filter_suburb_city_postcode) {
        filtered = filtered.filter((c: any) =>
          c.suburb_city_postcode?.includes(selectedFilters.p_filter_suburb_city_postcode)
        );
      }

      // Filter by license
      if (selectedFilters.p_filter_license_ids) {
        const licenseName = licenses.find(
          (l) => l.id === Number(selectedFilters.p_filter_license_ids)
        )?.name;
        filtered = filtered.filter((c: any) =>
          c.licenses?.some((l: any) => l.name === licenseName)
        );
      }

      // Filter by years of experience
      if (selectedFilters.p_filter_work_years_experience) {
        filtered = filtered.filter((c: any) =>
          c.work_experience?.some((we: any) => we.years === selectedFilters.p_filter_work_years_experience)
        );
      }

      // 🟢 Build human-readable labels
      const appliedFilters = {
        industryLabel:
          industries.find((i) => i.id === Number(selectedFilters.p_filter_industry_ids))
            ?.name || "",
        workIndustryLabel:
          industries.find((i) => i.id === Number(selectedFilters.p_filter_work_industry_id))
            ?.name || "",
        licenseLabel:
          licenses.find((l) => l.id === Number(selectedFilters.p_filter_license_ids))?.name || "",
        state: selectedFilters.p_filter_state || "",
        suburbCityPostcode: selectedFilters.p_filter_suburb_city_postcode || "",
        yearsExperience: selectedFilters.p_filter_work_years_experience || "",
      };

      // 🟢 Send both candidates + filters to parent
      onResults(filtered, appliedFilters);
      onClose();
    } catch (err) {
      console.error("Unexpected filter error:", err);
    }
  };

  const clearFilters = () => {
    setSelectedFilters({
      p_filter_state: "",
      p_filter_suburb_city_postcode: "",
      p_filter_work_industry_id: "",
      p_filter_work_years_experience: "",
      p_filter_industry_ids: "",
      p_filter_license_ids: "",
    });
  };

  // ---------- dropdown section ----------
  const DropdownSection = ({
    title,
    items,
    category,
    placeholder,
    isObject = false,
  }: {
    title: string;
    items: any[];
    category: string;
    placeholder: string;
    isObject?: boolean;
  }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <Select
        value={selectedFilters[category as keyof typeof selectedFilters]}
        onValueChange={(value) => handleSelectChange(category, value)}
      >
        <SelectTrigger className="w-full bg-white border border-gray-300 z-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-full max-h-40 overflow-y-auto rounded-xl border bg-white shadow-lg text-sm">
          {items.length > 0 ? (
            items.map((item) =>
              isObject ? (
                <SelectItem
                  key={item.id}
                  value={String(item.id)}
                  className="py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                >
                  {item.name}
                </SelectItem>
              ) : (
                <SelectItem
                  key={item}
                  value={item}
                  className="py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                >
                  {item}
                </SelectItem>
              )
            )
          ) : (
            <SelectItem value="none" disabled>
              No options available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={onClose}>
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Candidate Filters</h1>
            </div>
          </div>

          {/* Scrollable Filters */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <DropdownSection
              title="Industry of Work Experience"
              items={industries}
              category="p_filter_work_industry_id"
              placeholder="Any industry"
              isObject
            />
            <DropdownSection
              title="Preferred Industry"
              items={industries}
              category="p_filter_industry_ids"
              placeholder="Any preferred industry"
              isObject
            />
            <DropdownSection
              title="Candidate State"
              items={states}
              category="p_filter_state"
              placeholder="Any state"
            />
            <DropdownSection
              title="Candidate Suburb & Postcode"
              items={suburbPostcodes}
              category="p_filter_suburb_city_postcode"
              placeholder="Any suburb & postcode"
            />
            <DropdownSection
              title="Candidate License"
              items={licenses}
              category="p_filter_license_ids"
              placeholder="Any license"
              isObject
            />
            <DropdownSection
              title="Years of Work Experience"
              items={experienceLevels}
              category="p_filter_work_years_experience"
              placeholder="Any experience level"
            />
          </div>

          {/* Buttons */}
          <div className="bg-white border-t p-4 flex flex-col gap-3 flex-shrink-0 rounded-b-[48px]">
            <Button
              onClick={clearFilters}
              className="w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
            >
              Clear Filters
            </Button>
            <Button
              onClick={applyFilters}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white"
            >
              Find Candidates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPage;
