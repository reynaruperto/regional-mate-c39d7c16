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
  location: string; // "Suburb (Postcode)"
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

  // ✅ Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await (supabase as any).rpc("view_eligible_industries_for_maker", {
        p_maker_id: user.id,
      });
      if (error) {
        console.error("Industry fetch error:", error);
        return;
      }
      if (data) {
        setIndustries(
          data.map((d: any, idx: number) => ({
            id: d.industry_id ?? idx,
            name: d.industry,
          }))
        );
      }
    };
    fetchIndustries();
  }, [user.id]);

  // ✅ Fetch states + suburbs whenever industry changes
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await (supabase as any).rpc("view_eligible_locations_for_maker", {
        p_maker_id: user.id,
        p_industry_id: selectedFilters.industry ? parseInt(selectedFilters.industry) : null,
      });
      if (error) {
        console.error("Location fetch error:", error);
        return;
      }
      if (data) {
        setStates([...new Set(data.map((l: any) => l.state))]);
        setAllSuburbs(data); // keep full list with state + suburb
      }
    };
    fetchLocations();
  }, [user.id, selectedFilters.industry]);

  // ✅ Fetch facilities + enums
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

  // ✅ Filter suburbs based on selected state
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="px-6 py-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft />
        </Button>
        <h1 className="ml-3 text-lg font-semibold">Filter Jobs</h1>
      </div>

      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        {/* Industry */}
        <div>
          <label className="block text-sm font-medium">Industry</label>
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
            <SelectTrigger>
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
            <label className="block text-sm font-medium">State</label>
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
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s, idx) => (
                  <SelectItem key={idx} value={s || `state-${idx}`}>
                    {s || "Unknown state"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Suburb */}
        {suburbs.length > 0 && (
          <div>
            <label className="block text-sm font-medium">Suburb / Postcode</label>
            <Select
              value={selectedFilters.suburbCityPostcode}
              onValueChange={(v) =>
                setSelectedFilters((prev) => ({ ...prev, suburbCityPostcode: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select suburb" />
              </SelectTrigger>
              <SelectContent>
                {suburbs.map((s, idx) => (
                  <SelectItem key={idx} value={s || `suburb-${idx}`}>
                    {s || "Unknown suburb"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="px-6 mt-auto pb-6">
        <Button onClick={handleFindJobs} className="w-full bg-slate-800 text-white rounded-xl">
          Find Jobs
        </Button>
      </div>
    </div>
  );
};

export default WHVFilterPage;
