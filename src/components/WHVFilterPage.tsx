// src/components/WHVFilterPage.tsx
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

interface WHVFilterPageProps {
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    state: "",
    citySuburbPostcode: "",
    industry: "",
    yearsExperience: "",
    license: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [yearsExperienceOptions, setYearsExperienceOptions] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch states
        const { data: stateData } = await supabase.rpc("get_enum_values", { enum_name: "state" });
        setStates(stateData || []);

        // Fetch industries
        const { data: industryData } = await supabase.from("industry").select("name");
        setIndustries(industryData?.map(i => i.name) || []);

        // Fetch years experience options
        const { data: yearsData } = await supabase.rpc("get_years_experience_enum");
        setYearsExperienceOptions(yearsData || []);

        // Fetch licenses
        const { data: licenseData } = await supabase.from("license").select("name");
        setLicenses(licenseData?.map(l => l.name) || []);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(selectedFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      state: "",
      citySuburbPostcode: "",
      industry: "",
      yearsExperience: "",
      license: "",
    };
    setSelectedFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                  onClick={onClose}
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">Filter Jobs</h1>
              </div>
            </div>

            {/* Filter Content */}
            <div className="flex-1 px-6 overflow-y-auto space-y-6">
              {/* State Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <Select value={selectedFilters.state} onValueChange={(value) => handleFilterChange("state", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <Select value={selectedFilters.industry} onValueChange={(value) => handleFilterChange("industry", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Years Experience Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <Select value={selectedFilters.yearsExperience} onValueChange={(value) => handleFilterChange("yearsExperience", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsExperienceOptions.map((years) => (
                      <SelectItem key={years} value={years}>
                        {years}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* License Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License</label>
                <Select value={selectedFilters.license} onValueChange={(value) => handleFilterChange("license", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select license" />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map((license) => (
                      <SelectItem key={license} value={license}>
                        {license}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-8 space-y-3">
              <Button
                onClick={handleApplyFilters}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Apply Filters
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVFilterPage;