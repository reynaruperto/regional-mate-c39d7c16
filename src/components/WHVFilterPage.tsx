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

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({
  onClose,
  onResults,
  user,
}) => {
  const [selectedFilters, setSelectedFilters] = useState({
    state: "",
    citySuburbPostcode: "",
    industry: "",
    jobType: "",
    payRange: "",
    facilities: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [suburbs, setSuburbs] = useState<string[]>([]);

  // ✅ Load industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase.from("industry").select("industry_id, name");
      if (!error && data) {
        setIndustries(data.map((i) => ({ id: i.industry_id, name: i.name })));
      }
    };
    fetchIndustries();
  }, []);

  // ✅ Load suburbs (for demo we just grab distinct)
  useEffect(() => {
    const fetchSuburbs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("suburb_city, postcode");
      if (!error && data) {
        const unique = Array.from(
          new Set(data.map((j) => `${j.suburb_city} (${j.postcode})`))
        );
        setSuburbs(unique);
        console.log("✅ Suburbs from DB:", unique);
      }
    };
    fetchSuburbs();
  }, []);

  const handleFindJobs = async () => {
    // ✅ Build payload with integer casting for industry/facilities
    const payload = {
      p_maker_id: user.id,
      p_filter_state: selectedFilters.state || null,
      p_filter_suburb_city_postcode: selectedFilters.citySuburbPostcode || null,
      p_filter_industry_ids: selectedFilters.industry
        ? [parseInt(selectedFilters.industry, 10)]
        : null,
      p_filter_job_type: selectedFilters.jobType || null,
      p_filter_salary_range: selectedFilters.payRange || null,
      p_filter_facility_ids: selectedFilters.facilities
        ? [parseInt(selectedFilters.facilities, 10)]
        : null,
    };

    console.log("🔎 Sending payload to filter_jobs_for_maker:", payload);

    const { data, error } = await supabase.rpc("filter_jobs_for_maker", payload);

    if (error) {
      console.error("❌ Error filtering jobs:", error);
      alert("Could not fetch jobs. Please try again.");
    } else {
      console.log("✅ Filter results:", data);
      onResults(data || []);
      onClose();
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <ArrowLeft onClick={onClose} className="cursor-pointer mr-2" />
        <h2 className="text-lg font-semibold">Filter Jobs</h2>
      </div>

      {/* Industry */}
      <label className="block text-sm font-medium mb-1">Industry</label>
      <Select
        value={selectedFilters.industry}
        onValueChange={(value) =>
          setSelectedFilters((prev) => ({ ...prev, industry: value }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select industry" />
        </SelectTrigger>
        <SelectContent>
          {industries.map((ind) => (
            <SelectItem key={ind.id} value={ind.id.toString()}>
              {ind.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* State */}
      <label className="block text-sm font-medium mt-4 mb-1">State</label>
      <Select
        value={selectedFilters.state}
        onValueChange={(value) =>
          setSelectedFilters((prev) => ({ ...prev, state: value }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select state" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Queensland">Queensland</SelectItem>
          <SelectItem value="New South Wales">New South Wales</SelectItem>
          <SelectItem value="Victoria">Victoria</SelectItem>
        </SelectContent>
      </Select>

      {/* Suburb / Postcode */}
      <label className="block text-sm font-medium mt-4 mb-1">
        Suburb / Postcode
      </label>
      <Select
        value={selectedFilters.citySuburbPostcode}
        onValueChange={(value) =>
          setSelectedFilters((prev) => ({
            ...prev,
            citySuburbPostcode: value,
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select suburb/postcode" />
        </SelectTrigger>
        <SelectContent>
          {suburbs.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Job Type */}
      <label className="block text-sm font-medium mt-4 mb-1">Job Type</label>
      <Select
        value={selectedFilters.jobType}
        onValueChange={(value) =>
          setSelectedFilters((prev) => ({ ...prev, jobType: value }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select job type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Full-time">Full-time</SelectItem>
          <SelectItem value="Part-time">Part-time</SelectItem>
          <SelectItem value="Casual">Casual</SelectItem>
        </SelectContent>
      </Select>

      {/* Salary */}
      <label className="block text-sm font-medium mt-4 mb-1">Salary Range</label>
      <Select
        value={selectedFilters.payRange}
        onValueChange={(value) =>
          setSelectedFilters((prev) => ({ ...prev, payRange: value }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select salary range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="$20-25/hour">$20-25/hour</SelectItem>
          <SelectItem value="$25-30/hour">$25-30/hour</SelectItem>
          <SelectItem value="$30-35/hour">$30-35/hour</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleFindJobs} className="w-full mt-6">
        Find Jobs
      </Button>
    </div>
  );
};

export default WHVFilterPage;
