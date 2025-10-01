// src/components/FilterPage.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";
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
  onApplyFilters: (filters: any) => void;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState<any>({
    p_filter_state: "",
    p_filter_suburb_city_postcode: "",
    p_filter_work_industry_id: "",
    p_filter_work_years_experience: "",
    p_filter_industry_ids: [] as string[],
    p_filter_license_ids: [] as string[],
  });

  const [states, setStates] = useState<string[]>([]);
  const [suburbPostcodes, setSuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ✅ Fetch distinct states & suburb+postcode
  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");
      if (data) {
        setStates([...new Set(data.map((l) => l.state).filter(Boolean))]);
        setSuburbPostcodes([
          ...new Set(
            data
              .map((l) =>
                l.suburb_city && l.postcode
                  ? `${l.suburb_city} – ${l.postcode}`
                  : null
              )
              .filter(Boolean)
          ),
        ]);
      }
    };
    fetchLocations();
  }, []);

  // ✅ Fetch industries (with IDs)
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data } = await supabase.from("industry").select("industry_id, name");
      if (data) {
        setIndustries(data.map((row) => ({ id: row.industry_id, name: row.name })));
      }
    };
    fetchIndustries();
  }, []);

  // ✅ Fetch licenses (with IDs)
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data } = await supabase.from("license").select("license_id, name");
      if (data) {
        setLicenses(data.map((row) => ({ id: row.license_id, name: row.name })));
      }
    };
    fetchLicenses();
  }, []);

  // ✅ Experience Levels
  useEffect(() => {
    setExperienceLevels([
      "None",
      "<1",
      "1-2",
      "3-4",
      "5-7",
      "8-10",
      "10+",
    ]);
  }, []);

  // ✅ Handle multi-select toggle
  const toggleMultiSelect = (category: string, value: string) => {
    setSelectedFilters((prev: any) => {
      const exists = prev[category]?.includes(value);
      return {
        ...prev,
        [category]: exists
          ? prev[category].filter((v: string) => v !== value)
          : [...prev[category], value],
      };
    });
  };

  // ✅ Clear all
  const clearAll = () => {
    setSelectedFilters({
      p_filter_state: "",
      p_filter_suburb_city_postcode: "",
      p_filter_work_industry_id: "",
      p_filter_work_years_experience: "",
      p_filter_industry_ids: [],
      p_filter_license_ids: [],
    });
  };

  const applyFilters = () => {
    const cleaned = Object.fromEntries(
      Object.entries(selectedFilters).filter(([_, v]) =>
        Array.isArray(v) ? v.length > 0 : v && v.toString().trim() !== ""
      )
    );
    onApplyFilters(cleaned);
    onClose();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b bg-white flex-shrink-0 flex items-center gap-3">
            <button onClick={onClose}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">Candidate Filters</h1>
          </div>

          {/* Active Filter Chips */}
          {Object.entries(selectedFilters).some(
            ([_, val]) => (Array.isArray(val) && val.length) || (val && !Array.isArray(val))
          ) && (
            <div className="px-4 py-2 flex flex-wrap gap-2 border-b bg-gray-50">
              {Object.entries(selectedFilters).map(([key, val]) => {
                if (Array.isArray(val)) {
                  return val.map((v, idx) => (
                    <span
                      key={`${key}-${idx}`}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                    >
                      {key === "p_filter_industry_ids"
                        ? industries.find((i) => i.id === Number(v))?.name || v
                        : key === "p_filter_license_ids"
                        ? licenses.find((l) => l.id === Number(v))?.name || v
                        : v}
                      <X
                        size={12}
                        onClick={() => toggleMultiSelect(key, v)}
                        className="cursor-pointer"
                      />
                    </span>
                  ));
                }
                if (val && typeof val === "string") {
                  return (
                    <span
                      key={key}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                    >
                      {val}
                      <X
                        size={12}
                        onClick={() => setSelectedFilters((prev: any) => ({ ...prev, [key]: "" }))}
                        className="cursor-pointer"
                      />
                    </span>
                  );
                }
                return null;
              })}
              <button
                onClick={clearAll}
                className="text-xs text-blue-600 underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Scrollable Filters */}
          <div className="flex-1 px-4 py-4 overflow-y-auto space-y-6">
            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate State
              </label>
              <Select
                value={selectedFilters.p_filter_state}
                onValueChange={(v) =>
                  setSelectedFilters((prev: any) => ({ ...prev, p_filter_state: v }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
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

            {/* Suburb & Postcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suburb & Postcode
              </label>
              <Select
                value={selectedFilters.p_filter_suburb_city_postcode}
                onValueChange={(v) =>
                  setSelectedFilters((prev: any) => ({ ...prev, p_filter_suburb_city_postcode: v }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any suburb & postcode" />
                </SelectTrigger>
                <SelectContent>
                  {suburbPostcodes.map((sp, idx) => (
                    <SelectItem key={idx} value={sp}>
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Experience Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Experience Industry
              </label>
              <Select
                value={selectedFilters.p_filter_work_industry_id}
                onValueChange={(v) =>
                  setSelectedFilters((prev: any) => ({ ...prev, p_filter_work_industry_id: v }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Industries (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Preferred Industries
              </label>
              <div className="flex flex-wrap gap-2">
                {industries.map((i) => (
                  <Button
                    key={i.id}
                    type="button"
                    variant={
                      selectedFilters.p_filter_industry_ids.includes(String(i.id))
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleMultiSelect("p_filter_industry_ids", String(i.id))}
                    className="text-xs"
                  >
                    {i.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Candidate Licenses (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Licenses
              </label>
              <div className="flex flex-wrap gap-2">
                {licenses.map((l) => (
                  <Button
                    key={l.id}
                    type="button"
                    variant={
                      selectedFilters.p_filter_license_ids.includes(String(l.id))
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleMultiSelect("p_filter_license_ids", String(l.id))}
                    className="text-xs"
                  >
                    {l.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Years of Work Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Work Experience
              </label>
              <Select
                value={selectedFilters.p_filter_work_years_experience}
                onValueChange={(v) =>
                  setSelectedFilters((prev: any) => ({
                    ...prev,
                    p_filter_work_years_experience: v,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any experience" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((exp, idx) => (
                    <SelectItem key={idx} value={exp}>
                      {exp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply Button */}
          <div className="bg-white border-t p-4 flex-shrink-0 rounded-b-[48px]">
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
