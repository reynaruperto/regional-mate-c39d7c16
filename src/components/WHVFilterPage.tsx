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
  onResults: (jobs: any[], filters: any) => void;
  user: {
    id: string;
    subClass: string; 
    countryId: number;
    stage: number;
  };
}

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({ onClose, onResults, user }) => {
  const [selectedFilters, setSelectedFilters] = useState<any>({
    industry: null,
    state: "",
    suburbCityPostcode: "",
    jobType: "",
    salaryRange: "",
    facility: null,
  });

  const [industries, setIndustries] = useState<{ id: number; industry: string }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [allSuburbs, setAllSuburbs] = useState<{ state: string; location: string }[]>([]);
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [salaryRanges, setSalaryRanges] = useState<string[]>([]);

  // ✅ Load industries, facilities, enums
  useEffect(() => {
    const fetchEligibility = async () => {
      const { data: industriesData } = await (supabase as any).rpc(
        "view_eligible_industries_for_maker",
        { p_maker_id: user.id }
      );
      if (industriesData) setIndustries(industriesData);

      const { data: facilityData } = await supabase.from("facility").select("facility_id, name");
      setFacilities(
        facilityData?.map((f: any) => ({ id: f.facility_id, name: f.name })) || []
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
    fetchEligibility();
  }, [user.id]);

  // ✅ Load locations when industry changes
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedFilters.industry) return;

      const { data: locData } = await (supabase as any).rpc("view_eligible_locations_for_maker", {
        p_maker_id: user.id,
        p_industry_id: selectedFilters.industry.id,
      });

      if (locData) {
        setStates([...new Set(locData.map((l: any) => l.state ?? "Unknown"))]);
        setAllSuburbs(locData.map((l: any) => ({ state: l.state, location: l.location })));
      }
    };
    fetchLocations();
  }, [user.id, selectedFilters.industry]);

  // ✅ Suburbs update when state changes
  useEffect(() => {
    if (!selectedFilters.state) {
      setSuburbs([]);
      return;
    }
    const filtered = allSuburbs
      .filter((s) => s.state === selectedFilters.state)
      .map((s) => s.location);
    setSuburbs(filtered);
  }, [selectedFilters.state, allSuburbs]);

  // ✅ Apply filters
  const handleFindJobs = async () => {
    const { data, error } = await (supabase as any).rpc("filter_jobs_for_maker", {
      p_maker_id: user.id,
      p_filter_state: selectedFilters.state || null,
      p_filter_suburb_city_postcode: selectedFilters.suburbCityPostcode || null,
      p_filter_industry_ids: selectedFilters.industry ? [selectedFilters.industry.id] : null,
      p_filter_job_type: selectedFilters.jobType || null,
      p_filter_salary_range: selectedFilters.salaryRange || null,
      p_filter_facility_ids: selectedFilters.facility ? [selectedFilters.facility.id] : null,
    });

    if (error) {
      console.error("Error filtering jobs:", error);
      alert("Could not fetch jobs. Please try again.");
      return;
    }

    // Pass both jobs + clean filters back
    onResults(data || [], {
      ...selectedFilters,
      industryLabel: selectedFilters.industry?.industry || "",
      facilityLabel: facilities.find((f) => f.id === selectedFilters.facility?.id)?.name || "",
    });
    onClose();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button variant="ghost" size="icon" className="mr-4" onClick={onClose}>
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
                  value={selectedFilters.industry?.id?.toString() || ""}
                  onValueChange={(v) => {
                    const selected = industries.find((i) => i.id.toString() === v) || null;
                    setSelectedFilters((prev: any) => ({
                      ...prev,
                      industry: selected,
                      state: "",
                      suburbCityPostcode: "",
                    }));
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>
                        {i.industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              {states.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Select
                    value={selectedFilters.state}
                    onValueChange={(v) => setSelectedFilters((prev: any) => ({ ...prev, state: v }))}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s, idx) => (
                        <SelectItem key={idx} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Suburb */}
              {selectedFilters.state && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suburb / Postcode
                  </label>
                  <Select
                    value={selectedFilters.suburbCityPostcode}
                    onValueChange={(v) =>
                      setSelectedFilters((prev: any) => ({ ...prev, suburbCityPostcode: v }))
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select suburb or postcode" />
                    </SelectTrigger>
                    <SelectContent>
                      {suburbs.map((s, idx) => (
                        <SelectItem key={idx} value={s}>
                          {s}
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
                    setSelectedFilters((prev: any) => ({ ...prev, jobType: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt, idx) => (
                      <SelectItem key={idx} value={jt}>
                        {jt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                <Select
                  value={selectedFilters.salaryRange}
                  onValueChange={(v) =>
                    setSelectedFilters((prev: any) => ({ ...prev, salaryRange: v }))
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Select salary range" />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryRanges.map((sr, idx) => (
                      <SelectItem key={idx} value={sr}>
                        {sr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Facility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer Facility
                </label>
                <Select
                  value={selectedFilters.facility?.id?.toString() || ""}
                  onValueChange={(v) => {
                    const selected = facilities.find((f) => f.id.toString() === v) || null;
                    setSelectedFilters((prev: any) => ({ ...prev, facility: selected }));
                  }}
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

            {/* Find Jobs */}
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
