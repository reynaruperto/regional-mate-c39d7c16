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
  onResults: (jobs: any[], appliedFilters?: any) => void; // ✅ supports filters
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

  // ✅ Load dropdown data
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
      setJobTypes(Array.isArray(jobTypesData) ? (jobTypesData as string[]) : []);

      // Salary Ranges
      const { data: salaryRangesData } = await (supabase as any).rpc("get_enum_values", {
        enum_name: "pay_range",
      });
      setSalaryRanges(Array.isArray(salaryRangesData) ? (salaryRangesData as string[]) : []);
    };

    fetchEligibility();
  }, [user.id]);

  // ✅ Load locations when industry changes
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
      setSuburbs([]);
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
    onResults(data || [], selectedFilters || {}); // ✅ always send filters
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

            {/* Filters UI (industries, state, suburb, job type, salary, facility) */}
            {/* ... your existing Select components unchanged ... */}

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
