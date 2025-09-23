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
    preferredState: "",
    preferredCity: "",
    preferredPostcode: "",
    candidateIndustry: "",
    candidateExperience: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [postcodes, setPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ✅ Fetch Preferred Location (state, city, postcode)
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
        setCities([...new Set(data.map((l) => l.suburb_city).filter(Boolean))]);
        setPostcodes([...new Set(data.map((l) => l.postcode).filter(Boolean))]);
      }
    };

    fetchLocations();
  }, []);

  // ✅ Fetch Industries
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
        setIndustries(
          data.map((row) => ({ id: row.industry_id, name: row.name }))
        );
      }
    };

    fetchIndustries();
  }, []);

  // ✅ Fetch & Calculate Work Experience Levels
  useEffect(() => {
    const fetchExperience = async () => {
      // Skip work experience calculation for now due to type issues
      setExperienceLevels(["Less than 1 Year", "1-2 Years", "3-5 Years", "5+ Years"]);
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
          {items.length > 0 ? (
            items.map((item) => (
              <SelectItem key={item} value={item} className="hover:bg-gray-100">
                {item}
              </SelectItem>
            ))
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
              title="Preferred State"
              items={states}
              category="preferredState"
              placeholder="Any state"
            />

            <DropdownSection
              title="Preferred City/Suburb"
              items={cities}
              category="preferredCity"
              placeholder="Any suburb"
            />

            <DropdownSection
              title="Preferred Postcode"
              items={postcodes}
              category="preferredPostcode"
              placeholder="Any postcode"
            />

            <DropdownSection
              title="Preferred Industry"
              items={industries.map((i) => i.name)}
              category="candidateIndustry"
              placeholder="Any industry"
            />

            <DropdownSection
              title="Years of Work Experience"
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
