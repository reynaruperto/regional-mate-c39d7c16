// src/pages/WHVBrowseJobs.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  job_id: number;
  description: string;
  state: string;
  suburb_city: string;
  postcode: string;
  employment_type: string;
  salary_range: string;
  company_name: string;
  profile_photo: string | null;
  role: string;
  industry: string;
  isLiked?: boolean;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobName, setLikedJobName] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select(
          `job_id, description, state, suburb_city, postcode, employment_type, salary_range,
           employer:employer(company_name, profile_photo),
           industry_role(role, industry(name))`
        )
        .eq("job_status", "active");

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      const mapped: Job[] =
        data?.map((j: any) => ({
          job_id: j.job_id,
          description: j.description,
          state: j.state,
          suburb_city: j.suburb_city,
          postcode: j.postcode,
          employment_type: j.employment_type,
          salary_range: j.salary_range,
          company_name: j.employer?.company_name || "Unknown Employer",
          profile_photo: j.employer?.profile_photo || null,
          role: j.industry_role?.role || "N/A",
          industry: j.industry_role?.industry?.name || "N/A",
        })) || [];

      setJobs(mapped);
      setAllJobs(mapped);
    };

    fetchJobs();
  }, []);

  const applyFilters = (filters: any) => {
    const hasFilters =
      filters.state ||
      filters.citySuburb ||
      filters.postcode ||
      filters.interestedIndustry ||
      filters.interestedRole ||
      filters.lookingForJobType ||
      filters.minPayRate ||
      filters.maxPayRate;

    if (!hasFilters) {
      setJobs(allJobs); // reset if no filters applied
      setShowFilters(false);
      return;
    }

    let filtered = [...allJobs];

    if (filters.state) {
      const cleanState = filters.state.split(" ")[0];
      filtered = filtered.filter((j) => j.state === cleanState);
    }

    if (filters.citySuburb) {
      filtered = filtered.filter((j) =>
        j.suburb_city.toLowerCase().includes(filters.citySuburb.toLowerCase())
      );
    }

    if (filters.postcode) {
      filtered = filtered.filter((j) => j.postcode === filters.postcode);
    }

    if (filters.interestedIndustry) {
      filtered = filtered.filter(
        (j) =>
          j.industry.toLowerCase() ===
          filters.interestedIndustry.toLowerCase()
      );
    }

    if (filters.interestedRole) {
      filtered = filtered.filter(
        (j) => j.role.toLowerCase() === filters.interestedRole.toLowerCase()
      );
    }

    if (filters.lookingForJobType) {
      filtered = filtered.filter(
        (j) => j.employment_type === filters.lookingForJobType
      );
    }

    if (filters.minPayRate || filters.maxPayRate) {
      filtered = filtered.filter((j) => {
        if (!j.salary_range) return false;
        const match = j.salary_range.match(/\$(\d+)/g);
        if (!match) return false;
        const numbers = match.map((m) => parseInt(m.replace("$", ""), 10));
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        if (filters.minPayRate && min < parseInt(filters.minPayRate, 10))
          return false;
        if (filters.maxPayRate && max > parseInt(filters.maxPayRate, 10))
          return false;
        return true;
      });
    }

    setJobs(filtered);
    setShowFilters(false);
  };

  const handleLikeJob = (jobId: number, jobName: string) => {
    setLikedJobName(jobName);
    setShowLikeModal(true);
    setJobs((prev) =>
      prev.map((j) =>
        j.job_id === jobId ? { ...j, isLiked: !j.isLiked } : j
      )
    );
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedJobName("");
  };

  if (showFilters) {
    return (
      <WHVFilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={applyFilters}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 px-4 pt-12">
            <button onClick={() => navigate("/whv/dashboard")}>
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Browse Jobs
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 px-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-10 rounded-xl border-gray-200 bg-white"
            />
            <button
              onClick={() => setShowFilters(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <Filter className="text-gray-400" size={20} />
            </button>
          </div>

          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-20">
            {jobs
              .filter(
                (j) =>
                  j.company_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  j.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  j.industry
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              )
              .map((job) => (
                <div
                  key={job.job_id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        job.profile_photo
                          ? supabase.storage
                              .from("profile_photo")
                              .getPublicUrl(job.profile_photo).data.publicUrl
                          : "/default-avatar.png"
                      }
                      alt={job.company_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {job.company_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {job.role} – {job.industry}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {job.suburb_city}, {job.state} {job.postcode}
                      </p>

                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={() =>
                            navigate(`/whv/job-profile/${job.job_id}`)
                          }
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl"
                        >
                          View Job
                        </Button>
                        <button
                          onClick={() =>
                            handleLikeJob(job.job_id, job.company_name)
                          }
                          className={`h-11 w-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
                            job.isLiked
                              ? "bg-slate-800"
                              : "bg-slate-200 hover:bg-slate-300"
                          }`}
                        >
                          <Heart
                            size={18}
                            className={
                              job.isLiked ? "text-white fill-white" : "text-slate-800"
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {jobs.length === 0 && (
              <p className="text-center text-gray-500 text-sm mt-10">
                No jobs found matching filters
              </p>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t flex-shrink-0 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={likedJobName}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
