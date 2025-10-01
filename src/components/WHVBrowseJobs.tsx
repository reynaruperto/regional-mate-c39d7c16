// src/components/WHVBrowseJobs.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface JobCard {
  job_id: number;
  company: string;
  profile_photo: string;
  role: string;
  industry: string;
  location: string;
  salary_range: string;
  job_type: string;
  description?: string;
  isLiked?: boolean;
}

const WHVBrowseJobs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [allJobs, setAllJobs] = useState<JobCard[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [whvId, setWhvId] = useState<string | null>(null);
  const [visaStageLabel, setVisaStageLabel] = useState<string>("");

  //  Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  //  Fetch WHV visa info
  useEffect(() => {
    if (!whvId) return;

    const fetchVisaInfo = async () => {
      const { data, error } = await supabase
        .from("maker_visa")
        .select(`
          stage_id,
          expiry_date,
          visa_stage:stage_id (
            sub_class,
            label
          )
        `)
        .eq("user_id", whvId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching visa info:", error);
        return;
      }

      if (data?.visa_stage) {
        // Example: "417 – First Year"
        setVisaStageLabel(`${data.visa_stage.sub_class} – ${data.visa_stage.label}`);
      }
    };

    fetchVisaInfo();
  }, [whvId]);

  //  Fetch jobs (eligible)
  const fetchJobs = async (activeFilters: any = {}) => {
    if (!whvId) return;

    const { data: jobsData, error } = await (supabase as any).rpc("filter_jobs_for_maker", {
      p_maker_id: whvId,
      p_filter_state: activeFilters.state || null,
      p_filter_suburb_city_postcode: activeFilters.suburbCityPostcode || null,
      p_filter_industry_ids: activeFilters.industry ? [activeFilters.industry] : null,
      p_filter_job_type: activeFilters.jobType || null,
      p_filter_salary_range: activeFilters.salaryRange || null,
      p_filter_facility_ids: activeFilters.facility ? [activeFilters.facility] : null,
    });

    if (error) {
      console.error("Error fetching jobs:", error);
      return;
    }
    if (!jobsData) return;

    // Likes
    const { data: likes } = await supabase
      .from("likes")
      .select("liked_job_post_id")
      .eq("liker_id", whvId)
      .eq("liker_type", "whv");

    const likedIds = likes?.map((l) => l.liked_job_post_id) || [];

    const mapped: JobCard[] = (jobsData as any[]).map((job: any) => ({
      job_id: job.job_id,
      company: job.company || "Employer not listed",
      profile_photo: job.profile_photo || "/placeholder.png",
      role: job.role || "Role not specified",
      industry: job.industry || "General",
      location: job.location || "Location not specified",
      salary_range: job.salary_range || "Pay not disclosed",
      job_type: job.job_type || "Employment type not specified",
      description: job.description || "No description provided",
      isLiked: likedIds.includes(job.job_id),
    }));

    setJobs(mapped);
    setAllJobs(mapped);
  };

  useEffect(() => {
    fetchJobs();
  }, [whvId]);

  //  Like/unlike
  const handleLikeJob = async (jobId: number) => {
    if (!whvId) return;
    const job = jobs.find((j) => j.job_id === jobId);
    if (!job) return;

    try {
      if (job.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", jobId);

        setJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j)));
        setAllJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j)));
      } else {
        await supabase.from("likes").insert({
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: jobId,
          liked_whv_id: null,
        });

        setJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));
        setAllJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));

        setLikedJobTitle(job.role);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  //  Remove single filter chip
  const handleRemoveFilter = (key: string) => {
    const updated = { ...filters, [key]: null };
    const clean = Object.fromEntries(Object.entries(updated).filter(([_, v]) => v));
    setFilters(clean);
    fetchJobs(clean);
  };

  //  Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    fetchJobs({});
  };

  //  Build filter chips
  const filterChips = Object.entries(filters)
    .filter(([_, v]) => v)
    .map(([key, value]) => ({
      key,
      label: value as string,
    }));

  return showFilters ? (
    <WHVFilterPage
      onClose={() => setShowFilters(false)}
      onResults={(jobs, appliedFilters) => {
        setJobs(jobs);
        setAllJobs(jobs);
        setFilters(appliedFilters);
        setShowFilters(false);
      }}
      user={{
        id: whvId || "",
        subClass: "417",
        countryId: 1,
        stage: 1,
      }}
    />
  ) : (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
            </div>

            {/* Visa Info */}
            <div className="bg-gray-100 px-6 py-2 text-sm text-gray-700 text-center">
              <p>
                Your visa: <strong>{visaStageLabel || "Unknown"}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Only jobs eligible for your visa will appear here.
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-2 px-6 mt-2">
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

            {/* Chips */}
            {filterChips.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 mb-2">
                {filterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs"
                  >
                    {chip.label}
                    <button
                      className="ml-2 text-orange-600 hover:text-orange-900"
                      onClick={() => handleRemoveFilter(chip.key)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-600 underline"
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Jobs */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {jobs.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No jobs found. Try adjusting your search or filters.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={job.profile_photo}
                        alt={job.company}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">{job.role}</h2>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.industry}
                        </p>
                        <p className="text-sm text-gray-500">{job.location}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {job.job_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {job.salary_range}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                          >
                            View Details
                          </Button>
                          <button
                            onClick={() => handleLikeJob(job.job_id)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={job.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={likedJobTitle}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
