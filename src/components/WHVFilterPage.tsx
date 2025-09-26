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
  onResults: (jobs: any[]) => void;
  user: {
    id: string;
    subClass: string; // 417 or 462
    countryId: number;
    stage: number; // visa stage 1/2/3
  };
}

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({ onClose, onResults, user }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    industry: "",
    role: "",
    state: "",
    suburbCityPostcode: "",
    jobType: "",
    payRange: "",
    facility: "",
  });

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; role: string }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [suburbs, setSuburbs] = useState<{ suburb_city: string; postcode: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);

  // Load industries (filtered by eligibility)
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("mvw_eligibility_visa_country_stage_industry")
        .select("industry_id, industry")
        .eq("sub_class", user.subClass)
        .eq("country_id", user.countryId)
        .eq("stage", user.stage);

      if (!error && data) {
        setIndustries(
          data.map((d) => ({
            id: d.industry_id,
            name: d.industry,
          }))
        );
      }
    };

    const fetchFacilitiesAndEnums = async () => {
      const { data: facilityData } = await supabase.from("facility").select("id, name");
      setFacilities(facilityData || []);

      const { data: jobTypesData } = await supabase.rpc("get_enum_values", {
        enum_name: "job_type_enum",
      });
      setJobTypes(jobTypesData || []);

      const { data: payRangesData } = await supabase.rpc("get_enum_values", {
        enum_name: "pay_range",
      });
      setPayRanges(payRangesData || []);
    };

    fetchIndustries();
    fetchFacilitiesAndEnums();
  }, [user]);

  // Load roles when industry changes
  const handleIndustryChange = async (industryId: string) => {
    setSelectedFilters({
      ...selectedFilters,
      industry: industryId,
      role: "",
      state: "",
      suburbCityPostcode: "",
    });

    const { data, error } = await supabase
      .from("industry_role")
      .select("id, role")
      .eq("industry_id", parseInt(industryId));

    if (!error && data) {
      setRoles(data);
    }

    setStates([]);
    setSuburbs([]);
  };

  // Load states when role is chosen
  const handleRoleChange = async (roleId: string) => {
    setSelectedFilters({
      ...selectedFilters,
      role: roleId,
      state: "",
      suburbCityPostcode: "",
    });

    const { data, error } = await supabase
      .from("regional_rules")
      .select("state")
      .eq("industry_id", parseInt(selectedFilters.industry));

    if (!error && data) {
      const uniqueStates = [...new Set(data.map((d) => d.state))];
      setStates(uniqueStates);
    }

    setSuburbs([]);
  };

  // Load suburbs/postcodes when state is chosen
  const handleStateChange = async (state: string) => {
    setSelectedFilters({
      ...selectedFilters,
      state,
      suburbCityPostcode: "",
    });

    const { data, error } = await supabase
      .from("regional_rules")
      .select("suburb_city, postcode")
      .eq("industry_id", parseInt(selectedFilters.industry))
      .eq("state", state);

    if (!error && data) {
      setSuburbs(data);
    }
  };

  // Apply filters
  const handleFindJobs = async () => {
    const { data, error } = await supabase.rpc("filter_employer_for_maker", {
      p_filter_state: selectedFilters.state || null,
      p_filter_suburb_city_postcode: selectedFilters.suburbCityPostcode || null,
      p_filter_industry_ids: selectedFilters.industry
        ? [parseInt(selectedFilters.industry)]
        : null,
      p_filter_job_type: selectedFilters.jobType || null,
      p_filter_pay_range: selectedFilters.payRange || null,
      p_filter_facility_ids: selectedFilters.facility
        ? [parseInt(selectedFilters.facility)]
        : null,
      p_filter_start_date_range: null,
    });

    if (error) {
      console.error("Error filtering jobs:", error);
      return;
    }

    onResults(data || []);
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
              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <Select
                  value={selectedFilters.industry}
                  onValueChange={handleIndustryChange}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              {roles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <Select
                    value={selectedFilters.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* State */}
              {states.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Select
                    value={selectedFilters.state}
                    onValueChange={handleStateChange}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Suburb/Postcode */}
              {suburbs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Suburb / Postcode</label>
                  <Select
                    value={selectedFilters.suburbCityPostcode}
                    onValueChange={(v) =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        suburbCityPostcode: v,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select suburb or postcode" />
                    </SelectTrigger>
                    <SelectContent>
                      {suburbs.map((s) => (
                        <SelectItem key={s.postcode} value={s.postcode}>
                          {s.suburb_city} ({s.postcode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <Select
                  value={selectedFilters.jobType}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({ ...prev, jobType: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt) => (
                      <SelectItem key={jt} value={jt}>
                        {jt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pay Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pay Range</label>
                <Select
                  value={selectedFilters.payRange}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({ ...prev, payRange: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select pay range" />
                  </SelectTrigger>
                  <SelectContent>
                    {payRanges.map((pr) => (
                      <SelectItem key={pr} value={pr}>
                        {pr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Facility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employer Facility</label>
                <Select
                  value={selectedFilters.facility}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({ ...prev, facility: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Find Jobs Button */}
            <div className="px-6 pb-8">
              <Button
                onClick={handleFindJobs}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Find Jobs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVFilterPage;
