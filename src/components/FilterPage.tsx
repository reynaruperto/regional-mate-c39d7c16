// src/components/FilterPage.tsx
import React, { useEffect, useState } from "react";
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
    candidateLocation: "",
    candidateIndustry: "",
    candidateWorkExpIndustry: "",
    candidateWorkYears: "",
  });

  const [locations, setLocations] = useState<{ state: string; suburb_city: string; postcode: string }[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [workExpIndustries, setWorkExpIndustries] = useState<{ id: number; name: string }[]>([]);
  const [workYearsOptions, setWorkYearsOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Preferred Locations
      const { data: locData } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");
      setLocations(locData || []);

      // Preferred Industries
      const { data: indData } = await supabase.from("industry").select("industry_id, name");
      setIndustries(indData?.map((i) => ({ id: i.industry_id, name: i.name })) || []);

      // Work Experience
      const { data: workExpData } = await supabase
        .from("maker_work_experience")
        .select("industry_id, industry(name), start_date, end_date");

      if (workExpData) {
        // Distinct industries
        const distinctIndustries = Array.from(
          new Map(
            workExpData.map((w) => [w.industry_id, { id: w.industry_id, name: w.industry?.name }])
          ).values()
        );
        setWorkExpIndustries(distinctIndustries || []);

        // Calculate years of experience
        const years: number[] = [];
        workExpData.forEach((exp) => {
          if (exp.start_date) {
            const start = new Date(exp.start_date);
            const end = exp.end_date ? new Date(exp.end_date) : new Date();
            const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            years.push(diffYears);
          }
        });

        // Bucketize into ranges
        const buckets = new Set<string>();
        if (years.length === 0) {
          buckets.add("No Experience");
        } else {
          years.forEach((y) => {
            if (y < 1) buckets.add("Less than 1 year");
            else if (y < 3) buckets.add("1-2 years");
            else if (y < 6) buckets.add("3-5 years");
            else buckets.add("5+ years");
          });
        }
        setWorkYearsOptions(Array.from(buckets));
      }
    };

    fetchData();
  }, []);

  const handleSelectChange = (category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const applyFilters = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };

  const DropdownSection = ({
    title,
    items,
    category,
    placeholder,
  }: {
    title: string;
    items: string[];
    category: string;
    placeholder: string;
  }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <Select
        value={selectedFilters[category] as string}
        onValueChange={(value) => handleSelectChange(category, value)}
      >
        <SelectTrigger className="w-full bg-white border border-gray-300 z-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 shadow-lg z-50 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* iPhone Frame */}
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

          {/* Scrollable Content */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {/* Preferred Location */}
            <DropdownSection
              title="Preferred Location"
              items={locations.map((l) => `${l.suburb_city}, ${l.state} ${l.postcode}`)}
              category="candidateLocation"
              placeholder="Any location"
            />

            {/* Preferred Industry */}
            <DropdownSection
              title="Preferred Industry"
              items={industries.map((i) => i.name)}
              category="candidateIndustry"
              placeholder="Any industry"
            />

            {/* Work Experience Industry */}
            <DropdownSection
              title="Work Experience Industry"
              items={workExpIndustries.map((i) => i.name)}
              category="candidateWorkExpIndustry"
              placeholder="Any work experience industry"
            />

            {/* Years of Work Experience */}
            <DropdownSection
              title="Years of Work Experience"
              items={workYearsOptions}
              category="candidateWorkYears"
              placeholder="Any experience level"
            />
          </div>

          {/* Bottom Button */}
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
