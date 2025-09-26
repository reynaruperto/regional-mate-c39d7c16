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

interface EligibilityRule {
  industry_id: number;
  states: string[];
  postcodes: string[];
}

interface WHVFilterPageProps {
  onClose: () => void;
  onResults: (jobs: any[]) => void; // parent gets filtered jobs
  userId: string; // logged-in WHV user
}

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({ onClose, onResults, userId }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    industry: "",
    state: "",
    postcode: "",
    jobType: "",
    payRange: "",
    facilities: "",
    startDate: "",
  });

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityRule[]>([]);

  const [filteredStates, setFilteredStates] = useState<string[]>([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchOptionsAndEligibility = async () => {
      try {
        // Industries (full list so we can map IDs to names)
        const { data: industryData } = await supabase.from("industry").select("id, name");
        setIndustries(industryData || []);

        // Facilities
        const { data: facilityData } = await supabase.from("facility").select("id, name");
        setFacilities(facilityData || []);

        // Job Types
        const { data: jobTypesData } = await supabase.rpc("get_enum_values", { enum_name: "job_type_enum" });
        setJobTypes(jobTypesData || []);

        // Pay Ranges
        const { data: payRangesData } = await supabase.rpc("get_enum_values", { enum_name: "pay_range" });
        setPayRanges(payRangesData || []);

        // Eligibility rules for this user
        const { data: eligData } = await supabase
          .from("work_preference_onboarding")
          .select("eligibility_json")
          .eq("user_id", userId)
          .single();

        if (eligData?.eligibility_json) {
          setEligibility(eligData.eligibility_json as EligibilityRule[]);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchOptionsAndEligibility();
  }, [userId]);

  const handleIndustryChange = (industryId: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      industry: industryId,
      state: "",
      postcode: "",
    }));

    const elig = eligibility.find((e) => e.industry_id === parseInt(industryId));
    setFilteredStates(elig?.states || []);
    setFilteredPostcodes([]); // reset until state is chosen
  };

  const handleStateChange = (state: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      state,
      postcode: "",
    }));

    const elig = eligibility.find((e) => e.industry_id === parseInt(selectedFilters.industry));
    const statePostcodes = elig?.postcodes.filter((pc) => pc.startsWith(state)) || [];
    setFilteredPostcodes(statePostcodes);
  };

  const handleFindJobs = async () => {
    try {
      const { data, error } = await supabase.rpc("filter_employer_for_maker", {
        p_filter_state: selectedFilters.state || null,
        p_filter_suburb_city_postcode: selectedFilters.postcode || null,
        p_filter_industry_ids: selectedFilters.industry ? [parseInt(selectedFilters.industry)] : null,
        p_filter_job_type: selectedFilters.jobType || null,
        p_filter_pay_range: selectedFilters.payRange || null,
        p_filter_facility_ids: selectedFilters.facilities ? [parseInt(selectedFilters.facilities)] : null,
        p_filter_start_date_range: selectedFilters.startDate || null,
      });

      if (error) {
        console.error("Error fetching filtered jobs:", error);
        return;
      }

      // Already constrained by eligibility in dropdowns,
      // but still double-check before sending back.
      const eligibleJobs = (data || []).filter((job) => {
        const elig = eligibility.find((e) => e.industry_id === job.industry_id);
        return (
          elig &&
          elig.states.includes(job.state) &&
          (elig.postcodes.length === 0 || elig.postcodes.includes(job.postcode))
        );
      });

      onResults(eligibleJobs);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // Build dropdown-ready list of eligible industries
  const eligibleIndustries = industries.filter((i) =>
    eligibility.some((e) => e.industry_id === i.id)
  );

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
                    {eligibleIndustries.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              {filteredStates.length > 0 && (
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
                      {filteredStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Postcode */}
              {filteredPostcodes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                  <Select
                    value={selectedFilters.postcode}
                    onValueChange={(v) => setSelectedFilters((prev) => ({ ...prev, postcode: v }))}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select postcode" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPostcodes.map((pc) => (
                        <SelectItem key={pc} value={pc}>
                          {pc}
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
                  onValueChange={(v) => setSelectedFilters((prev) => ({ ...prev, jobType: v }))}
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
                  onValueChange={(v) => setSelectedFilters((prev) => ({ ...prev, payRange: v }))}
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

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employer Facilities</label>
                <Select
                  value={selectedFilters.facilities}
                  onValueChange={(v) => setSelectedFilters((prev) => ({ ...prev, facilities: v }))}
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

            {/* Action */}
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
