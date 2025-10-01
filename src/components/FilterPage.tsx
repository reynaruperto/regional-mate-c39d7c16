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
    p_filter_industry_ids: "",
    p_filter_license_ids: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [suburbPostcodes, setSuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ✅ Load locations
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

  // ✅ Load industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("industry")
        .select("industry_id, name");

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

  // ✅ Load licenses
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

  const handleSelectChange = (category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const applyFilters = () => {
    const cleaned = Object.fromEntries(
      Object.entries(selectedFilters).filter(([_, v]) => v && v.toString().trim() !== "")
    );
    onApplyFilters(cleaned);
    onClose();
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
              <h1 className="text-lg font-medium text-gray-900">
                Candidate Filters
              </h1>
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
            <DropdownSection
              title="Candidate License"
              items={licenses}
              category="p_filter_license_ids"
              placeholder="Any license"
              isObject={true}
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
