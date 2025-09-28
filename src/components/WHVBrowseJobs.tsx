// src/components/WHVBrowseJobs.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  job_id: number;
  emp_id: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  job_type: string;
  salary_range: string;
  job_description: string;
  profile_photo: string | null;
}

interface WHVBrowseJobsProps {
  user?: {
    id: string;
    subClass: string;
    countryId: number;
    stage: number;
  };
}

const WHVBrowseJobs: React.FC<WHVBrowseJobsProps> = ({ user }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Guard: don’t crash if user is missing
  if (!user?.id) {
    return <p className="text-center mt-10">Please log in to view jobs.</p>;
  }

  // ✅ Fetch eligible jobs
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await (supabase as any).rpc("view_all_eligible_jobs", {
        p_maker_id: user.id,
      });

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      setJobs((data || []) as Job[]);
      setAllJobs((data || []) as Job[]);
    };

    fetchJobs();
  }, [user]);

  // 🔎 Search
  useEffect(() => {
    if (!searchQuery) {
      setJobs(allJobs);
      return;
    }

    const query = searchQuery.toLowerCase();
    setJobs(
      allJobs.filter(
        (job) =>
          job.role?.toLowerCase().includes(query) ||
          job.company?.toLowerCase().includes(query) ||
          job.industry?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, allJobs]);

  // ✅ Apply filters
  const handleApplyFilters = async (filters: any) => {
    const { data, error } = await (supabase as any).rpc("filter_employer_for_maker", {
      p_filter_state: filters.state || null,
      p_filter_suburb_city_postcode: filters.suburbCityPostcode || null,
      p_filter_industry_ids: filters.industry ? [parseInt(filters.industry)] : null,
      p_filter_job_type: filters.jobType || null,
      p_filter_salary_range: filters.payRange || null,
      p_filter_facility_ids: filters.facility ? [parseInt(filters.facility)] : null,
      p_filter_start_date_range: null,
    });

    if (error) {
      console.error("Error filtering jobs:", error);
      return;
    }

    if (data && data.length > 0) {
      const eligibleIds = new Set(allJobs.map((j) => j.job_id));
      const filtered = data.filter((job: any) => eligibleIds.has(job.job_id));
      setJobs(filtered as Job[]);
    } else {
      setJobs(allJobs);
    }

    setShowFilters(false);
  };

  if (showFilters) {
    return (
      <WHVFilterPage
        onClose={() => setShowFilters(false)}
        onResults={handleApplyFilters}
        user={user}
      />
    );
  }

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
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
            </div>

            {/* Search */}
            <div className="relative mb-4 px-6">
              <Search
                className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white w-full"
              />
              <button
                onClick={() => setShowFilters(true)}
                className="absolute right-9 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Job List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {jobs.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No jobs found matching your criteria.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                  >
                    <div className="flex gap-3 items-start">
                      {job.profile_photo && (
                        <img
                          src={job.profile_photo}
                          alt={job.company}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {job.role}
                        </h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-sm text-gray-600">{job.industry}</p>
                        <p className="text-sm text-gray-600">{job.location}</p>
                        <p className="text-sm text-gray-600">
                          {job.job_type} • {job.salary_range}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {job.job_description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
