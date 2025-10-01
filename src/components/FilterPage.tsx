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
  onApplyFilters: (filters: any) => void;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    p_filter_state: "",
    p_filter_suburb_city_postcode: "",
    p_filter_work_industry_id: "",
    p_filter_work_years_experience: "",
    p_filter_license_ids: [] as string[], // ✅ now array
  });

  const [states, setStates] = useState<string[]>([]);
  const [suburbPostcodes, setSuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ✅ Fetch states & suburbs
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");

      if (!error && data) {
        setStates([...new Set(data.map((l) => l.state).filter(Boolean))]);
        setSuburbPostcodes(
          [
            ...new Set(
              data
                .map((l) =>
                  l.suburb_city && l.postcode ? `${l.suburb_city} – ${l.postcode}` : null
                )
                .filter(Boolean)
            ),
          ]
        );
      }
    };
    fetchLocations();
  }, []);

  // ✅ Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase.from("industry").select("industry_id, name");
      if (!error && data) {
        setIndustries(data.map((row) => ({ id: row.industry_id, name: row.name })));
      }
    };
    fetchIndustries();
  }, []);

  // ✅ Fetch licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error } = await supabase.from("license").select("license_id, name");
      if (!error && data) {
        setLicenses(data.map((row) => ({ id: row.license_id, name: row.name })));
      }
    };
    fetchLicenses();
  }, []);

  // ✅ Fetch experience levels from DB enum
  useEffect(() => {
    const fetchExperienceLevels = async () => {
      const { data, error } = await (supabase as any).rpc("get_enum_years_experience");
      if (!error && data) {
        setExperienceLevels(data.map((row: any) => row.years_of_experience));
      }
    };
    fetchExperienceLevels();
  }, []);

  // ✅ Handle dropdown changes
  const handleSelectChange = (category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  // ✅ Handle multi-select for licenses
  const toggleLicense = (id: string) => {
    setSelectedFilters((prev) => {
      const current = prev.p_filter_license_ids || [];
      return {
        ...prev,
        p_filter_license_ids: current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      };
    });
  };

  // ✅ Apply filters
  const applyFilters = () => {
    const cleaned = Object.fromEntries(
      Object.entries(selectedFilters).filter(([_, v]) => {
        if (Array.isArray(v)) return v.length > 0; // for licenses
        return v && v.toString().trim() !== "";
      })
    );
    onApplyFilters(cleaned);
    onClose();
  };

  // 🔹 Reusable dropdown
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
        value={selectedFilters[category as keyof typeof selectedFilters] as string}
        onValueChange={(value) => handleSelectChange(category, value)}
      >
        <SelectTrigger className="w-full bg-white border border-gray-300 z-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 shadow-lg z-50 max-h-60 overflow-y-auto">
          {items.length > 0 ? (
            items.map((item) =>
              isObject ? (
                <SelectItem key={item.id} value={String(item.id)} className="hover:bg-gray-100">
                  {item.name}
                </SelectItem>
              ) : (
                <SelectItem key={item} value={item} className="hover:bg-gray-100">
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
              isObject={true}
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

            {/* Multi-select for licenses */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Candidate Licenses</h3>
              <div className="flex flex-wrap gap-2">
                {licenses.map((license) => (
                  <button
                    key={license.id}
                    onClick={() => toggleLicense(String(license.id))}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      selectedFilters.p_filter_license_ids.includes(String(license.id))
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {license.name}
                  </button>
                ))}
              </div>
            </div>

            <DropdownSection
              title="Years of Work Experience"
              items={experienceLevels}
              category="p_filter_work_years_experience"
              placeholder="Any experience level"
            />
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
