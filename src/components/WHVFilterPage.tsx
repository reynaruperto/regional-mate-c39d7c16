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
    subClass: string;
    countryId: number;
    stage: number;
  };
}

interface LocationRow {
  state: string;
  location: string;
}

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({ onClose, onResults, user }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    industry: "",
    state: "",
    suburbCityPostcode: "",
    jobType: "",
    salaryRange: "",
    facility: "",
  });

  const [industries, setIndustries] = useState<{ id?: number; name: string }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [allSuburbs, setAllSuburbs] = useState<LocationRow[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [salaryRanges, setSalaryRanges] = useState<string[]>([]);

  // ✅ Industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data } = await (supabase as any).rpc("view_eligible_industries_for_maker", {
        p_maker_id: user.id,
      });
      if (data) {
        setIndustries(
          (data as any[]).map((d, idx) => ({
            id: d.industry_id ?? idx,
            name: d.industry || "Unnamed Industry",
          }))
        );
      }
    };
    fetchIndustries();
  }, [user.id]);

  // ✅ States + Suburbs
  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await (supabase as any).rpc("view_eligible_locations_for_maker", {
        p_maker_id: user.id,
        p_industry_id: selectedFilters.industry ? parseInt(selectedFilters.industry) : null,
      });
      if (data) {
        setStates([...new Set((data as any[]).map((l) => l.state as string))] as string[]);
        setAllSuburbs(data as LocationRow[]);
      }
    };
    fetchLocations();
  }, [user.id, selectedFilters.industry]);

  // ✅ Facilities + Enums
  useEffect(() => {
    const fetchOtherFilters = async () => {
      const { data: facilityData } = await supabase.from("facility").select("facility_id, name");
      setFacilities(
        facilityData?.map((f) => ({ id: f.facility_id, name: f.name })) || []
      );

      const { data: jobTypesData } = await (supabase as any).rpc("get_enum_values", {
        enum_name: "job_type_enum",
      });
      setJobTypes((jobTypesData as string[]) || []);

      const { data: salaryRangesData } = await (supabase as any).rpc("get_enum_values", {
        enum_name: "pay_range",
      });
      setSalaryRanges((salaryRangesData as string[]) || []);
    };
    fetchOtherFilters();
  }, []);

  // ✅ Filter suburbs by state
  const suburbs = selectedFilters.state
    ? allSuburbs.filter((s) => s.state === selectedFilters.state).map((s) => s.location)
    : allSuburbs.map((s) => s.location);

  // ✅ Apply filters
  const handleFindJobs = async () => {
    const { data, error } = await (supabase as any).rpc("filter_jobs_for_maker", {
      p_maker_id: user.id,
      p_filter_state: selectedFilters.state || null,
      p_filter_suburb_city_postcode: selectedFilters.suburbCityPostcode || null,
      p_filter_industry_ids: selectedFilters.industry
        ? [parseInt(selectedFilters.industry)]
        : null,
      p_filter_job_type: selectedFilters.jobType || null,
      p_filter_salary_range: selectedFilters.salaryRange || null,
      p_filter_facility_ids: selectedFilters.facility
        ? [parseInt(selectedFilters.facility)]
        : null,
    });

    if (error) {
      console.error("Error filtering jobs:", error);
      alert("Could not fetch jobs. Please try again.");
      return;
    }

    onResults(data || []);
    onClose();
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
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({
                      ...prev,
                      industry: v,
                      state: "",
                      suburbCityPostcode: "",
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i, idx) => {
                      const val = i?.id ? i.id.toString() : `industry-${idx}`;
                      return (
                        <SelectItem key={val} value={val}>
                          {i?.name || "Unnamed Industry"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              {states.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Select
                    value={selectedFilters.state}
                    onValueChange={(v) =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        state: v,
                        suburbCityPostcode: "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s, idx) => {
                        const val = s && s.trim() !== "" ? s : `state-${idx}`;
                        return (
                          <SelectItem key={val} value={val}>
                            {s || "Unknown State"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Suburb */}
              {suburbs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suburb / Postcode
                  </label>
                  <Select
                    value={selectedFilters.suburbCityPostcode}
                    onValueChange={(v) =>
                      setSelectedFilters((prev) => ({ ...prev, suburbCityPostcode: v }))
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select suburb" />
                    </SelectTrigger>
                    <SelectContent>
                      {suburbs.map((s, idx) => {
                        const val = s && s.trim() !== "" ? s : `suburb-${idx}`;
                        return (
                          <SelectItem key={val} value={val}>
                            {s || "Unknown Suburb"}
                          </SelectItem>
                        );
                      })}
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
                    {jobTypes.map((jt, idx) => {
                      const val = jt && jt.trim() !== "" ? jt : `jobtype-${idx}`;
                      return (
                        <SelectItem key={val} value={val}>
                          {jt || "Unknown Job Type"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                <Select
                  value={selectedFilters.salaryRange}
                  onValueChange={(v) =>
                    setSelectedFilters((prev) => ({ ...prev, salaryRange: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select salary" />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryRanges.map((sr, idx) => {
                      const val = sr && sr.trim() !== "" ? sr : `salary-${idx}`;
                      return (
                        <SelectItem key={val} value={val}>
                          {sr || "Unknown Salary"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Facility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facility</label>
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
                    {facilities.map((f, idx) => {
                      const val = f?.id ? f.id.toString() : `facility-${idx}`;
                      return (
                        <SelectItem key={val} value={val}>
                          {f?.name || "Unknown Facility"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit */}
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
