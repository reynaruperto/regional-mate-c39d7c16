// src/pages/BrowseJobs.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  job_id: number;
  emp_id?: string;
  role?: string;
  company?: string;
  industry?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
  job_description?: string;
  profile_photo?: string;
}

const BrowseJobs: React.FC<{ user: { id: string } }> = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  // ✅ Load baseline: eligible jobs for this WHV user
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await (supabase as any).rpc("view_all_eligible_jobs", {
        p_maker_id: user.id,
      });

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      setJobs(data || []);
      setAllJobs(data || []);
    };

    fetchJobs();
  }, [user.id]);

  // 🔎 Local search (title, company, industry, location)
  useEffect(() => {
    if (!searchQuery) {
      setJobs(allJobs);
      return;
    }

    const q = searchQuery.toLowerCase();
    setJobs(
      allJobs.filter(
        (j) =>
          j.role?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.industry?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, allJobs]);

  // ✅ Apply filters via DB function, scoped to eligibility baseline
  const handleApplyFilters = async (filters: any) => {
    try {
      const { data, error } = await (supabase as any).rpc("filter_employer_for_maker", {
        p_filter_state: filters.state || null,
        p_filter_suburb_city_postcode: filters.suburbCityPostcode || null,
        p_filter_industry_ids: filters.industry ? [parseInt(filters.industry)] : null,
        p_filter_job_type: filters.jobType || null,
        p_filter_salary_range: filters.salaryRange || null,
        p_filter_facility_ids: filters.facility ? [parseInt(filters.facility)] : null,
        p_filter_start_date_range: null,
      });

      if (error) {
        console.error("Error applying filters:", error);
        return;
      }

      if (data && data.length > 0) {
        const eligibleJobIds = new Set(allJobs.map((j) => j.job_id));
        const filtered = data.filter((job: any) => eligibleJobIds.has(job.job_id));
        setJobs(filtered as Job[]);
      } else {
        setJobs(allJobs);
      }
    } catch (err) {
      console.error("Filter RPC failed:", err);
    }

    setShowFilters(false);
  };

  if (showFilters) {
    return (
      <WHVFilterPage
        onClose={() => setShowFilters(false)}
        onResults={handleApplyFilters}
        user={{
          id: user.id,
          subClass: "417", // TODO: pass real subclass
          countryId: 0, // TODO: pass real countryId
          stage: 1, // TODO: pass real visa stage
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate("/whv/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
            </div>

            {/* Search Bar */}
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
                  <p>No jobs available right now.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                  >
                    <div className="flex gap-3 items-start">
                      {/* Employer photo */}
                      <img
                        src={
                          job.profile_photo
                            ? supabase.storage
                                .from("profile_photo")
                                .getPublicUrl(job.profile_photo).data.publicUrl
                            : "/default-avatar.png"
                        }
                        alt={job.company}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
                      />

                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {job.role}
                        </h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-sm text-gray-600">
                          <strong>Industry:</strong> {job.industry}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Location:</strong> {job.location}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Type:</strong> {job.job_type} •{" "}
                          <strong>Pay:</strong> {job.salary_range}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {job.job_description}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() =>
                              navigate(`/job-preview/${job.job_id}`)
                            }
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                          >
                            View Job
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;
