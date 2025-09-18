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
    candidateLocation: "",
    candidateIndustry: "",
    candidateExperience: "",
  });

  const [locations, setLocations] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ✅ Fetch preferred locations
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city");

      if (!error && data) {
        const locs = data.map(
          (l) => `${l.suburb_city || ""}, ${l.state || ""}`.trim()
        );
        setLocations([...new Set(locs.filter(Boolean))]); // unique & non-empty
      }
    };
    fetchLocations();
  }, []);

  // ✅ Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("industry")
        .select("industry_id, name");

      if (!error && data) {
        setIndustries(
          data.map((row) => ({ id: row.industry_id, name: row.name }))
        );
      }
    };
    fetchIndustries();
  }, []);

  // ✅ Fetch & calculate work experience levels
  useEffect(() => {
    const fetchExperience = async () => {
      const { data, error } = await supabase
        .from("maker_work_experience")
        .select("start_date, end_date");

      if (!error && data) {
        const levels = data.map((exp) => {
          const start = new Date(exp.start_date);
          const end = exp.end_date ? new Date(exp.end_date) : new Date();
          const years =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

          if (years >= 5) return "5+ Years";
          if (years >= 3) return "3-5 Years";
          if (years >= 1) return "1-2 Years";
          return "Less than 1 Year";
        });

        setExperienceLevels([...new Set(levels)]);
      }
    };
    fetchExperience();
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
            <SelectItem key={item} value={item} className="hover:bg-gray-100">
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
              <h1 className="text-lg font-medium text-gray-900">
                Candidate Filters
              </h1>
            </div>
          </div>

          {/* Scrollable Filters */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <DropdownSection
              title="Preferred Location"
              items={locations}
              category="candidateLocation"
              placeholder="Any location"
            />

            <DropdownSection
              title="Preferred Industry"
              items={industries.map((i) => i.name)}
              category="candidateIndustry"
              placeholder="Any industry"
            />

            <DropdownSection
              title="Work Experience"
              items={experienceLevels}
              category="candidateExperience"
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
