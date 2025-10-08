// src/components/WHVBrowseJobs.tsx
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, Filter, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  licenses?: string[];
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [whvId, setWhvId] = useState<string | null>(null);
  const [visaStageLabel, setVisaStageLabel] = useState<string>("");

  // ✅ Resolve photo URL
  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/placeholder.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  // ✅ Fetch WHV + visa info
  useEffect(() => {
    const getUserAndVisa = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error fetching user:", error);
        return;
      }

      setWhvId(user.id);

      // Fetch visa info via join
      const { data: visaData, error: visaError } = await supabase
        .from("maker_visa")
        .select("stage_id, visa_stage:stage_id(label)")
        .eq("user_id", user.id)
        .single();

      if (visaError) {
        console.error("Error fetching visa info:", visaError);
        return;
      }

      if (visaData?.visa_stage) {
        setVisaStageLabel(visaData.visa_stage.label);
      } else {
        setVisaStageLabel("Visa not registered");
      }
    };

    getUserAndVisa();
  }, []);

  // ✅ Fetch jobs whenever filters or whvId change
  useEffect(() => {
    if (!whvId) return;

    const fetchJobs = async () => {
      console.log("🔍 Applying filters:", {
        state: filters.state,
        licenseId: filters.licenseId,
        licenseLabel: filters.licenseLabel,
        allFilters: filters
      });

      const { data: jobsData, error } = await (supabase as any).rpc("filter_jobs_for_maker", {
        p_maker_id: whvId,
        p_filter_state: filters.state || null,
        p_filter_suburb_city_postcode: filters.suburbCityPostcode || null,
        p_filter_industry_ids: filters.industryId ? [filters.industryId] : null,
        p_filter_job_type: filters.jobType || null,
        p_filter_salary_range: filters.salaryRange || null,
        p_filter_facility_ids: filters.facilityId ? [filters.facilityId] : null,
        p_filter_license_ids: filters.licenseId ? [filters.licenseId] : null,
      });

      console.log("📊 Jobs returned:", jobsData?.length, jobsData);

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      if (!jobsData) return;

      // Fetch liked jobs
      const { data: likes } = await supabase
        .from("likes")
        .select("liked_job_post_id")
        .eq("liker_id", whvId)
        .eq("liker_type", "whv");

      const likedIds = likes?.map((l) => l.liked_job_post_id) || [];

      const mapped: JobCard[] = (jobsData as any[]).map((job: any) => ({
        job_id: job.job_id,
        company: job.company || "Employer not listed",
        profile_photo: resolvePhoto(job.profile_photo),
        role: job.role || "Role not specified",
        industry: job.industry || "General",
        location: job.location || "Location not specified",
        salary_range: job.salary_range || "Pay not disclosed",
        job_type: job.job_type || "Employment type not specified",
        description: job.description || "No description provided",
        isLiked: likedIds.includes(job.job_id),
        licenses: job.licenses || [],
      }));

      setJobs(mapped);
    };

    fetchJobs();
  }, [whvId, filters]);

  // ✅ Like/Unlike handler
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
      } else {
        await supabase.from("likes").insert({
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: jobId,
          liked_whv_id: null,
        });
        setJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));
        setLikedJobTitle(job.role);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // ✅ FIXED: Remove filter instantly and auto-refresh jobs
  const handleRemoveFilter = (key: string) => {
    setFilters((prev: any) => {
      const updated = { ...prev };
      if (key === "industryId") {
        delete updated.industryId;
        delete updated.industryLabel;
      } else if (key === "facilityId") {
        delete updated.facilityId;
        delete updated.facilityLabel;
      } else if (key === "licenseId") {
        delete updated.licenseId;
        delete updated.licenseLabel;
      } else {
        delete updated[key];
      }
      return updated;
    });
  };

  // ✅ Clear all filters
  const handleClearFilters = () => {
    setFilters({});
  };

  // ✅ Filter chips
  const filterChips = [
    filters.industryLabel && { key: "industryId", label: filters.industryLabel },
    filters.state && { key: "state", label: filters.state },
    filters.suburbCityPostcode && { key: "suburbCityPostcode", label: filters.suburbCityPostcode },
    filters.jobType && { key: "jobType", label: filters.jobType },
    filters.salaryRange && { key: "salaryRange", label: filters.salaryRange },
    filters.facilityLabel && { key: "facilityId", label: filters.facilityLabel },
    filters.licenseLabel && { key: "licenseId", label: filters.licenseLabel },
  ].filter(Boolean) as { key: string; label: string }[];

  // ✅ Search filter
  const visibleJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter((j) =>
      [j.role, j.company, j.industry, j.location, j.salary_range, j.job_type, j.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [jobs, searchQuery]);

  return showFilters ? (
    <WHVFilterPage
      onClose={() => setShowFilters(false)}
      onResults={(jobs, appliedFilters) => {
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
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6 text-[#1E293B]" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
            </div>

            {/* Visa Info */}
            <div className="bg-gray-100 px-6 py-2 text-sm text-gray-700 text-center">
              <p>
                Your visa: <strong>{visaStageLabel || "Loading..."}</strong>
              </p>
              <p className="text-xs text-gray-500">Only jobs eligible for your visa will appear here.</p>
            </div>

            {/* Search */}
            <div className="relative mb-2 px-6 mt-2">
              <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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

            {/* Filter Chips */}
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

            {/* Jobs List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {visibleJobs.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No jobs found. Try adjusting your search or filters.</p>
                </div>
              ) : (
                visibleJobs.map((job) => (
                  <div key={job.job_id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4">
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

                        {job.licenses && job.licenses.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {job.licenses.slice(0, 2).map((license, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700"
                              >
                                {license}
                              </span>
                            ))}
                            {job.licenses.length > 2 && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                                +{job.licenses.length - 2} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            className="flex-1 bg-[#1E293B] hover:bg-[#0f172a] text-white h-11 rounded-xl"
                            onClick={() => navigate(`/whv/job/${job.job_id}`, { state: { from: "browse" } })}
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

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Confirmation Modal */}
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
