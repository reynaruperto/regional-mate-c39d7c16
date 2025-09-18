// src/components/FilterPage.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface FilterPageProps {
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    candidateLocation: "",
    candidateIndustry: "",
    candidateRole: "",
    candidateLicense: "",
    candidateAvailability: "",
    candidateWorkDuration: "",
  });

  const [locations, setLocations] = useState<{ state: string; suburb_city: string; postcode: string }[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; role: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);

  // Static until we store in schema
  const candidateAvailabilityOptions = [
    "Available Now",
    "Available in 1 Month",
    "Available in 2-3 Months",
    "Available in 4-6 Months",
    "Available Next Year",
    "Flexible Start Date",
  ];

  const candidateWorkDurationOptions = [
    "1-2 weeks",
    "1 month",
    "2-3 months",
    "3-6 months",
    "6+ months",
    "Long-term / Ongoing",
  ];

  // Fetch dropdown options from DB
  useEffect(() => {
    const fetchData = async () => {
      const { data: locData } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");
      setLocations(locData || []);

      const { data: indData } = await supabase.from("industry").select("industry_id, name");
      setIndustries(indData?.map((i) => ({ id: i.industry_id, name: i.name })) || []);

      const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role");
      setRoles(roleData?.map((r) => ({ id: r.industry_role_id, role: r.role })) || []);

      const { data: licenseData } = await supabase.from("license").select("license_id, name");
      setLicenses(licenseData?.map((l) => ({ id: l.license_id, name: l.name })) || []);
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
    labelKey = "name",
    valueKey = "id",
  }: {
    title: string;
    items: any[];
    category: string;
    placeholder: string;
    labelKey?: string;
    valueKey?: string;
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
            <SelectItem key={item[valueKey]} value={item[labelKey]}>
              {item[labelKey]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* iPhone 16 Pro Max Frame */}
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
            {/* Location */}
            <DropdownSection
              title="Candidate Location"
              items={locations}
              category="candidateLocation"
              placeholder="Any location"
              labelKey="suburb_city"
              valueKey="suburb_city"
            />

            {/* Industry */}
            <DropdownSection
              title="Preferred Industry"
              items={industries}
              category="candidateIndustry"
              placeholder="Any industry"
              labelKey="name"
              valueKey="id"
            />

            {/* Role */}
            <DropdownSection
              title="Preferred Role"
              items={roles}
              category="candidateRole"
              placeholder="Any role"
              labelKey="role"
              valueKey="id"
            />

            {/* License */}
            <DropdownSection
              title="Required License"
              items={licenses}
              category="candidateLicense"
              placeholder="Any license"
              labelKey="name"
              valueKey="id"
            />

            {/* Availability */}
            <DropdownSection
              title="Availability"
              items={candidateAvailabilityOptions.map((a) => ({ id: a, name: a }))}
              category="candidateAvailability"
              placeholder="Any availability"
            />

            {/* Work Duration */}
            <DropdownSection
              title="Work Duration"
              items={candidateWorkDurationOptions.map((d) => ({ id: d, name: d }))}
              category="candidateWorkDuration"
              placeholder="Any duration"
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
