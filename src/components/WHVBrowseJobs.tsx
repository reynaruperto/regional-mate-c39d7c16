import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Heart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCard {
  job_id: number;
  company: string;
  profile_photo: string | null;
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

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch jobs (eligible only)
  useEffect(() => {
    if (!whvId) return;

    const fetchJobs = async () => {
      const { data, error } = await (supabase as any).rpc("view_all_eligible_jobs", {
        p_maker_id: whvId,
      });

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }
      if (!data) return;

      const mapped: JobCard[] = data.map((job: any) => {
        const photoUrl = job.profile_photo
          ? supabase.storage
              .from("profile-photos")
              .getPublicUrl(job.profile_photo).data.publicUrl
          : "/placeholder.png";

        return {
          job_id: job.job_id,
          company: job.company,
          profile_photo: photoUrl,
          role: job.role,
          industry: job.industry,
          location: job.location,
          salary_range: job.salary_range || "Rate not specified",
          employment_type: job.job_type || "N/A",
          description: job.job_description || "",
          isLiked: false,
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
    setJobs(list);
  }, [searchQuery, allJobs]);

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
          .eq("liked_job_post_id", jobId)
          .eq("liker_type", "whv");

        setJobs((prev) =>
          prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j))
        );
        setAllJobs((prev) =>
          prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j))
        );
      } else {
        await supabase.from("likes").upsert(
          {
            liker_id: whvId,
            liker_type: "whv",
            liked_job_post_id: jobId,
          },
          { onConflict: "liker_id,liked_job_post_id,liker_type" }
        );

        setJobs((prev) =>
          prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j))
        );
        setAllJobs((prev) =>
          prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j))
        );
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
      onResults={(filtered) => setJobs(filtered)}
      user={{
        id: whvId || "",
        subClass: "417",
        countryId: 36,
        stage: 1,
      }}
    />
  ) : (
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
                onClick={() => navigate("/whv/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>

              {/* Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-5 h-5 ml-2 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm">
                    Only jobs you are eligible for will show here, based on your visa type and stage.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                        src={job.profile_photo || "/placeholder.png"}
                        alt={job.company}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">{job.role}</h2>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.industry}
                        </p>
                        <p className="text-sm text-gray-500">{job.location}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {job.employment_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            💰 {job.salary_range}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description || "No description provided"}
                        </p>
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
                              className={
                                job.isLiked
                                  ? "text-orange-500 fill-orange-500"
                                  : "text-orange-500"
                              }
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
