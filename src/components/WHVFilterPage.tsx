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
    state: "",
    suburbCityPostcode: "",
    jobType: "",
    salaryRange: "",
    facility: "",
  });

  const [industries, setIndustries] = useState<{ id: number | null; name: string }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [allSuburbs, setAllSuburbs] = useState<{ state: string; location: string }[]>([]);
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<{ id: number | null; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [salaryRanges, setSalaryRanges] = useState<string[]>([]);

  // ✅ Load industries, facilities, job types, salary ranges
  useEffect(() => {
    const fetchEligibility = async () => {
      // Industries
      const { data: industriesData } = await (supabase as any).rpc(
        "view_eligible_industries_for_maker",
        { p_maker_id: user.id }
      );
      if (industriesData) {
        setIndustries(
          industriesData.map((d: any, idx: number) => ({
            id: d.industry_id ?? null,
            name: d.industry ?? `Industry ${idx + 1}`,
          }))
        );
      }

      // Facilities
      const { data: facilityData } = await supabase.from("facility").select("facility_id, name");
      setFacilities(
        facilityData?.map((f, idx) => ({
          id: f.facility_id ?? null,
          name: f.name ?? `Facility ${idx + 1}`,
        })) || []
      );

      // Job Types
      const { data: jobTypesData } = await (supabase as any).rpc("get_enum_values", {
        enum_name: "job_type_enum",
      });
      setJobTypes((jobTypesData as string[]) || []);

      // Salary Ranges
      const { data: salaryRangesData } = await (supabase as any).rpc("get_enum_values", {
        enum_name: "pay_range",
      });
      setSalaryRanges((salaryRangesData as string[]) || []);
    };

    fetchEligibility();
  }, [user.id]);

  // ✅ Load locations whenever industry changes
  useEffect(() => {
    const fetchLocations = async () => {
      const industryId =
        selectedFilters.industry && !isNaN(parseInt(selectedFilters.industry))
          ? parseInt(selectedFilters.industry)
          : null;

      const { data: locData } = await (supabase as any).rpc("view_eligible_locations_for_maker", {
        p_maker_id: user.id,
        p_industry_id: industryId,
      });

      if (locData) {
        setStates([...new Set(locData.map((l: any) => l.state ?? "Unknown"))]);
        setAllSuburbs(
          locData.map((l: any, idx: number) => ({
            state: l.state ?? "Unknown",
            location: l.location ?? `Location ${idx + 1}`,
          }))
        );
      } else {
        setStates([]);
        setAllSuburbs([]);
      }
      setSuburbs([]); // reset suburbs when industry changes
    };

    fetchLocations();
  }, [user.id, selectedFilters.industry]);

  // ✅ Update suburbs when state changes
  useEffect(() => {
    if (!selectedFilters.state) {
      setSuburbs([]);
      return;
    }

    const filtered = allSuburbs
      .filter((s) => s.state === selectedFilters.state)
      .map((s) => s.location);

    setSuburbs(filtered.length > 0 ? filtered : []);
  }, [selectedFilters.state, allSuburbs]);

  // ✅ Apply filters
  const handleFindJobs = async () => {
    const { data, error } = await (supabase as any).rpc("filter_jobs_for_maker", {
      p_maker_id: user.id,
      p_filter_state: selectedFilters.state || null,
      p_filter_suburb_city_postcode: selectedFilters.suburbCityPostcode || null,

      p_filter_industry_ids:
        selectedFilters.industry && !isNaN(parseInt(selectedFilters.industry))
          ? [parseInt(selectedFilters.industry)]
          : null,

      p_filter_job_type: selectedFilters.jobType || null,
      p_filter_salary_range: selectedFilters.salaryRange || null,

      p_filter_facility_ids:
        selectedFilters.facility && !isNaN(parseInt(selectedFilters.facility))
          ? [parseInt(selectedFilters.facility)]
          : null,
    });

    if (error) {
      console.error("Error filtering jobs:", error);
      alert("Could not fetch jobs. Please try again.");
      return;
    }

    console.log("Filter results:", data);
    onResults(data || []);
    onClose(); // ✅ close filter modal after applying
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
                    {industries.map((i, idx) => (
                      <SelectItem key={i.id ?? idx} value={(i.id ?? idx).toString()}>
                        {i.name}
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
                      {states.map((s, idx) => (
                        <SelectItem key={idx} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Suburb/Postcode */}
              {selectedFilters.state && (
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
                      <SelectValue placeholder="Select suburb or postcode" />
                    </SelectTrigger>
                    <SelectContent>
                      {suburbs.length > 0 ? (
                        suburbs.map((s, idx) => (
                          <SelectItem key={idx} value={s}>
                            {s}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No suburbs available
                        </SelectItem>
                      )}
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
                    setSelectedFilters((prev) => ({ ...prev, salaryRange: v }))
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
                    {facilities.map((f, idx) => (
                      <SelectItem key={f.id ?? idx} value={(f.id ?? idx).toString()}>
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
