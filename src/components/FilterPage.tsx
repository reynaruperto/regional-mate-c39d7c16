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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

// ✅ Only this one export — remove the duplicate one at the bottom
export interface FilterPageProps {
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    p_filter_state: "",
    p_filter_suburb_city_postcode: "",
    p_filter_work_industry_id: "",
    p_filter_work_years_experience: "",
    p_filter_industry_ids: "",
    p_filter_license_ids: [] as number[], // Changed to array for multiple selection
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

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

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
      if (error) {
        console.error("Error fetching industries:", error);
        return;
      }
      if (data) {
        setIndustries(data.map((row) => ({ id: row.industry_id, name: row.name })));
      }
    };
    fetchIndustries();
  }, []);

  // ---------- load licenses ----------
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error } = await supabase.from("license").select("license_id, name");
      if (error) {
        console.error("Error fetching licenses:", error);
        return;
      }
      if (data) {
        setLicenses(data.map((row) => ({ id: row.license_id, name: row.name })));
      }
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

  const applyFilters = () => {
    const cleaned: any = {};
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) cleaned[key] = value;
      } else if (value && value.toString().trim() !== "") {
        cleaned[key] = value;
      }
    });
    onApplyFilters(cleaned);
    onClose();
  };

  const clearFilters = () =>
    setSelectedFilters({
      p_filter_state: "",
      p_filter_suburb_city_postcode: "",
      p_filter_work_industry_id: "",
      p_filter_work_years_experience: "",
      p_filter_industry_ids: "",
      p_filter_license_ids: [],
    });

  const handleLicenseToggle = (licenseId: number) => {
    setSelectedFilters((prev) => {
      const current = prev.p_filter_license_ids;
      if (current.includes(licenseId)) {
        return { ...prev, p_filter_license_ids: current.filter((id) => id !== licenseId) };
      } else {
        return { ...prev, p_filter_license_ids: [...current, licenseId] };
      }
    });
  };

  // ---------- reusable dropdown ----------
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
  }) => {
    const value = selectedFilters[category as keyof typeof selectedFilters];
    const stringValue = Array.isArray(value) ? "" : value;
    
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
        <Select
          value={stringValue}
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
  };

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
            {/* Multiple License Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Candidate License</h3>
              <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                {licenses.length > 0 ? (
                  licenses.map((license) => (
                    <div key={license.id} className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id={`license-${license.id}`}
                        checked={selectedFilters.p_filter_license_ids.includes(license.id)}
                        onCheckedChange={() => handleLicenseToggle(license.id)}
                      />
                      <label
                        htmlFor={`license-${license.id}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {license.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No licenses available</p>
                )}
              </div>
              {selectedFilters.p_filter_license_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFilters.p_filter_license_ids.map((id) => {
                    const license = licenses.find((l) => l.id === id);
                    return license ? (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs"
                      >
                        {license.name}
                        <button
                          onClick={() => handleLicenseToggle(id)}
                          className="hover:text-slate-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
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
