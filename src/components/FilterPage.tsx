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
    state: "",
    citySuburbPostcode: "",
    industry: "",
    yearsExperience: "",
    license: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [citySuburbPostcodes, setCitySuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);

  // ✅ Fetch States + Locations from regional_rules
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("regional_rules")
        .select("state, suburb_city, postcode");

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      if (data) {
        setStates([...new Set(data.map((l) => l.state).filter(Boolean))]);
        setCitySuburbPostcodes([
          ...new Set(
            data
              .filter((l) => l.suburb_city && l.postcode)
              .map((l) => `${l.suburb_city} (${l.postcode})`)
          ),
        ]);
      }
    };

    fetchLocations();
  }, []);

  // ✅ Fetch Industries from makers’ work experience
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("maker_work_experience")
        .select("industry(name)");

      if (error) {
        console.error("Error fetching industries:", error);
        return;
      }

      if (data) {
        const industryNames = [
          ...new Set(data.map((row) => row.industry?.name).filter(Boolean)),
        ];
        setIndustries(industryNames);
      }
    };

    fetchIndustries();
  }, []);

  // ✅ Experience levels (predefined buckets)
  useEffect(() => {
    setExperienceLevels([
      "Less than 1 Year",
      "1–2 Years",
      "3–4 Years",
      "5–7 Years",
      "8–10 Years",
      "10+ Years",
    ]);
  }, []);

  // ✅ Fetch Licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error } = await supabase.from("license").select("name");

      if (error) {
        console.error("Error fetching licenses:", error);
        return;
      }

      if (data) {
        setLicenses(data.map((l) => l.name));
      }
    };

    fetchLicenses();
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
        value={selectedFilters[category as keyof typeof selectedFilters] as string}
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
              title="State"
              items={states}
              category="state"
              placeholder="Any state"
            />

            <DropdownSection
              title="City/Suburb + Postcode"
              items={citySuburbPostcodes}
              category="citySuburbPostcode"
              placeholder="Any location"
            />

            <DropdownSection
              title="Industry (Work Experience)"
              items={industries}
              category="industry"
              placeholder="Any industry"
            />

            <DropdownSection
              title="Years of Experience"
              items={experienceLevels}
              category="yearsExperience"
              placeholder="Any experience level"
            />

            <DropdownSection
              title="Licenses"
              items={licenses}
              category="license"
              placeholder="Any license"
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
