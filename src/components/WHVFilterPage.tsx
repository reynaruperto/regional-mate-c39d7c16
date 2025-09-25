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
    industryRole: "",
    startDate: "",
    payRange: "",
    facility: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [industryRoles, setIndustryRoles] = useState<{ id: number; role: string; industry_id: number }[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);

  // Hardcoded options
  const startDateOptions = ["Within 2 weeks", "Within 4 weeks", "Within 8 weeks", "12+ weeks"];
  const payRangeOptions = ["< $20/hr", "$20–$30/hr", "$30–$40/hr", "$40+/hr"];

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // States (enum)
        const { data: stateData } = await supabase.rpc("get_enum_values", { enum_name: "state" });
        setStates(stateData || []);

        // Industries
        const { data: industryData } = await supabase.from("industry").select("industry_id, name");
        setIndustries(industryData || []);

        // Roles
        const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role, industry_id");
        setIndustryRoles(roleData || []);

        // Facilities
        const { data: facilityData } = await supabase.from("facility").select("name");
        setFacilities(facilityData?.map((f) => f.name) || []);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(selectedFilters);
  };

  const handleClearFilters = () => {
    const cleared = {
      state: "",
      citySuburbPostcode: "",
      industry: "",
      industryRole: "",
      startDate: "",
      payRange: "",
      facility: "",
    };
    setSelectedFilters(cleared);
    onApplyFilters(cleared);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
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

            {/* Filters */}
            <div className="flex-1 px-6 overflow-y-auto space-y-6">
              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <Select value={selectedFilters.state} onValueChange={(value) => handleFilterChange("state", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-gray-300">
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

              {/* City / Suburb / Postcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City / Suburb / Postcode</label>
                <input
                  type="text"
                  value={selectedFilters.citySuburbPostcode}
                  onChange={(e) => handleFilterChange("citySuburbPostcode", e.target.value)}
                  placeholder="Enter city, suburb, or postcode"
                  className="w-full h-12 rounded-xl border border-gray-300 px-3"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <Select value={selectedFilters.industry} onValueChange={(value) => handleFilterChange("industry", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-gray-300">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.name}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role (depends on industry) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <Select
                  value={selectedFilters.industryRole}
                  onValueChange={(value) => handleFilterChange("industryRole", value)}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-gray-300">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryRoles
                      .filter((r) =>
                        selectedFilters.industry
                          ? industries.find((i) => i.name === selectedFilters.industry)?.id === r.industry_id
                          : true
                      )
                      .map((role) => (
                        <SelectItem key={role.id} value={role.role}>
                          {role.role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <Select value={selectedFilters.startDate} onValueChange={(value) => handleFilterChange("startDate", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-gray-300">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    {startDateOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pay Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pay Range</label>
                <Select value={selectedFilters.payRange} onValueChange={(value) => handleFilterChange("payRange", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-gray-300">
                    <SelectValue placeholder="Select pay range" />
                  </SelectTrigger>
                  <SelectContent>
                    {payRangeOptions.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employer Facilities</label>
                <Select value={selectedFilters.facility} onValueChange={(value) => handleFilterChange("facility", value)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-gray-300">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-8 space-y-3">
              <Button onClick={handleApplyFilters} className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">
                Find Jobs
              </Button>
              <Button onClick={handleClearFilters} variant="outline" className="w-full h-12 rounded-xl">
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
