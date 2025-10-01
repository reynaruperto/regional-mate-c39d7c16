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
    p_filter_industry_ids: [] as string[],
    p_filter_license_ids: [] as string[],
  });

  const [states, setStates] = useState<string[]>([]);
  const [suburbPostcodes, setSuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      const { data } = await supabase.from("industry").select("industry_id, name");
      if (data) setIndustries(data.map((row) => ({ id: row.industry_id, name: row.name })));
    };
    fetchIndustries();

    const fetchLicenses = async () => {
      const { data } = await supabase.from("license").select("license_id, name");
      if (data) setLicenses(data.map((row) => ({ id: row.license_id, name: row.name })));
    };
    fetchLicenses();

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

  const handleMultiSelectChange = (
    category: "p_filter_industry_ids" | "p_filter_license_ids",
    value: string
  ) => {
    setSelectedFilters((prev) => {
      const current = new Set(prev[category]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [category]: Array.from(current) };
    });
  };

  const applyFilters = () => {
    const cleaned = Object.fromEntries(
      Object.entries(selectedFilters).filter(([_, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v && v.toString().trim() !== "";
      })
    );
    onApplyFilters(cleaned);
    onClose();
  };

  const DropdownSection = ({
    title,
    items,
    category,
    placeholder,
    isObject = false,
    isMulti = false,
  }: {
    title: string;
    items: any[];
    category: string;
    placeholder: string;
    isObject?: boolean;
    isMulti?: boolean;
  }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <Select
        value={
          isMulti
            ? undefined
            : (selectedFilters[category as keyof typeof selectedFilters] as string)
        }
        onValueChange={(value) =>
          isMulti
            ? handleMultiSelectChange(category as any, value)
            : setSelectedFilters((prev) => ({ ...prev, [category]: value }))
        }
      >
        <SelectTrigger className="w-full bg-white border border-gray-300 z-50">
          <SelectValue
            placeholder={
              isMulti
                ? `${
                    (selectedFilters[category as keyof typeof selectedFilters] as string[]).length
                  } selected`
                : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent>
          {items.map((item: any, idx: number) =>
            isObject ? (
              <SelectItem key={item.id ?? idx} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ) : (
              <SelectItem key={idx} value={String(item)}>
                {item}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4"></div>
          <div className="px-4 py-3 border-b bg-white">
            <div className="flex items-center gap-3">
              <button onClick={onClose}>
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Candidate Filters</h1>
            </div>
          </div>
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <DropdownSection title="Industry of Work Experience" items={industries} category="p_filter_work_industry_id" placeholder="Any industry" isObject />
            <DropdownSection title="Candidate State" items={states} category="p_filter_state" placeholder="Any state" />
            <DropdownSection title="Candidate Suburb & Postcode" items={suburbPostcodes} category="p_filter_suburb_city_postcode" placeholder="Any suburb & postcode" />
            <DropdownSection title="Candidate Licenses" items={licenses} category="p_filter_license_ids" placeholder="Any license" isObject isMulti />
            <DropdownSection title="Preferred Industries" items={industries} category="p_filter_industry_ids" placeholder="Any preferred industry" isObject isMulti />
            <DropdownSection title="Years of Experience" items={experienceLevels} category="p_filter_work_years_experience" placeholder="Any experience" />
          </div>
          <div className="bg-white border-t p-4">
            <Button onClick={applyFilters} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
              Find Candidates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPage;
