// src/components/WHVBrowseJobs.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";

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
  employment_type: string;
  description?: string;
  isLiked?: boolean;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = (url: string) => {
    window.location.href = url;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [allJobs, setAllJobs] = useState<JobCard[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [whvId, setWhvId] = useState<string | null>(null);

  const [visaStageLabel, setVisaStageLabel] = useState<string>("");

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch jobs (only eligible for WHV user, via RPC)
  useEffect(() => {
    const fetchJobs = async () => {
      if (!whvId) return;

      // 1️⃣ Get latest visa stage label
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, visa_stage(label)")
        .eq("user_id", whvId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setVisaStageLabel(visa?.visa_stage?.label || "");

      // 2️⃣ Fetch jobs from RPC
      const { data: jobsData, error } = await (supabase as any).rpc("view_all_eligible_jobs", {
        p_maker_id: whvId,
      });

      if (error) {
        console.error("Error fetching eligible jobs:", error);
        return;
      }
      if (!jobsData) return;

      // 3️⃣ Fetch likes for this WHV
      const { data: likes } = await supabase
        .from("likes")
        .select("liked_job_post_id")
        .eq("liker_id", whvId)
        .eq("liker_type", "whv");

      const likedIds = likes?.map((l) => l.liked_job_post_id) || [];

      // 4️⃣ Map jobs (frontend controls display design)
      const mapped: JobCard[] = jobsData.map((job: any) => {
        const photoUrl = job.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(job.profile_photo).data.publicUrl
          : "/placeholder.png";

        return {
          job_id: job.job_id,
          company: job.company_name?.trim() || "Employer not listed",
          profile_photo: photoUrl,
          role: job.position_title?.trim() || "Role not specified",
          industry: job.industry?.trim() || "General",
          location: job.location?.trim() || "Location not specified",
          salary_range: job.salary_range ? `💰 ${job.salary_range}` : "Pay not disclosed",
          employment_type: job.employment_type || "Employment type not specified",
          description: job.description?.trim() || "No description provided",
          isLiked: likedIds.includes(job.job_id),
        };
      });

      setJobs(mapped);
      setAllJobs(mapped);
    };

    fetchJobs();
  }, [whvId]);

  // 🔎 Search + Filters
  useEffect(() => {
    let list = [...allJobs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.role.toLowerCase().includes(query) ||
          j.industry.toLowerCase().includes(query) ||
          j.company.toLowerCase().includes(query) ||
          j.location.toLowerCase().includes(query)
      );
    }

    if (filters.state) {
      list = list.filter((j) => j.location.toLowerCase().includes(filters.state.toLowerCase()));
    }

    if (filters.facility) {
      list = list.filter((j) =>
        j.description?.toLowerCase().includes(filters.facility.toLowerCase())
      );
    }

    setJobs(list);
  }, [searchQuery, filters, allJobs]);

  // ✅ Like/unlike
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

  return showFilters ? (
    <WHVFilterPage 
      onClose={() => setShowFilters(false)} 
      onResults={(jobs) => {
        setJobs(jobs);
        setAllJobs(jobs);
        setShowFilters(false);
      }}
      user={{
        id: whvId || "",
        subClass: "417", // Default value, should be from user data
        countryId: 1, // Default value, should be from user data  
        stage: 1 // Default value, should be from user data
      }}
    />
  ) : (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-2 flex items-center">
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
            <div className="relative mb-4 px-6 mt-2">
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

            {/* Jobs List */}
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
                        {/* Job Title */}
                        <h2 className="text-xl font-bold text-gray-900">{job.role}</h2>
                        
                        {/* Employer + Industry */}
                        <p className="text-sm text-gray-600">
                          🏢 {job.company} • {job.industry}
                        </p>
                        
                        {/* Location */}
                        <p className="text-sm text-gray-500">📍 {job.location}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {job.employment_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {job.salary_range}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            onClick={() => navigate(`/whv/job/${job.job_id}`)}
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

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

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
