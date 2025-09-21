// src/pages/WHV/WHVBrowseJobs.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface JobCard {
  job_id: number;
  company_name: string;
  profile_photo: string;
  role: string;
  industry: string;
  location: string;
  salary: string;
  employment_type: string;
  isLiked?: boolean;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch jobs + likes
  useEffect(() => {
    const fetchJobs = async () => {
      const { data: jobsData, error: jobsError } = await supabase
        .from("job")
        .select("job_id, user_id, industry_role_id, job_status, state, suburb_city, postcode, salary_range, employment_type")
        .eq("job_status", "active");

      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
        return;
      }
      if (!jobsData) return;

      const { data: employers } = await supabase
        .from("employer")
        .select("user_id, company_name, profile_photo");

      const { data: industryRoles } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry ( name )");

      // ✅ Fetch likes for this WHV
      let likedIds: number[] = [];
      if (whvId) {
        const { data: likes } = await supabase
          .from("likes")
          .select("liked_job_post_id")
          .eq("liker_id", whvId)
          .eq("liker_type", "whv");

        likedIds = likes?.map((l) => l.liked_job_post_id) || [];
      }

      const mapped: JobCard[] = jobsData.map((job) => {
        const employer = employers?.find((e) => e.user_id === job.user_id);
        const roleData = industryRoles?.find(
          (r) => r.industry_role_id === job.industry_role_id
        );

        const employerName = employer?.company_name || "Unknown Employer";

        const photoUrl = employer?.profile_photo
          ? supabase.storage
              .from("profile_photo")
              .getPublicUrl(employer.profile_photo).data.publicUrl
          : "/placeholder.png";

        const location = `${job.suburb_city || ""}, ${job.state || ""} ${
          job.postcode || ""
        }`.trim();

        return {
          job_id: job.job_id,
          company_name: employerName,
          profile_photo: photoUrl,
          role: roleData?.role || "Role",
          industry: roleData?.industry?.name || "Industry",
          location,
          salary: job.salary_range || "Rate not specified",
          employment_type: job.employment_type || "N/A",
          isLiked: likedIds.includes(job.job_id),
        };
      });

      setJobs(mapped);
    };

    if (whvId) fetchJobs();
  }, [whvId]);

  // ✅ Toggle Like (persistent)
  const handleLikeJob = async (jobId: number) => {
    if (!whvId) return;

    const job = jobs.find((j) => j.job_id === jobId);
    if (!job) return;

    try {
      if (job.isLiked) {
        // 🔄 Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liked_job_post_id", jobId)
          .eq("liker_type", "whv");

        setJobs((prev) =>
          prev.map((j) =>
            j.job_id === jobId ? { ...j, isLiked: false } : j
          )
        );
      } else {
        // ❤️ Like
        await supabase.from("likes").upsert(
          {
            liker_id: whvId,
            liker_type: "whv",
            liked_job_post_id: jobId,
          },
          { onConflict: "liker_id,liked_job_post_id,liker_type" }
        );

        setJobs((prev) =>
          prev.map((j) =>
            j.job_id === jobId ? { ...j, isLiked: true } : j
          )
        );

        setLikedJobTitle(job.role);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleViewJob = (jobId: number) => {
    navigate(`/whv/job/${jobId}`);
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedJobTitle("");
  };

  const getJobTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "full-time":
        return "bg-blue-100 text-blue-700";
      case "part-time":
        return "bg-purple-100 text-purple-700";
      case "casual":
        return "bg-orange-100 text-orange-700";
      case "seasonal":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (showFilters) {
    return (
      <WHVFilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={() => {}}
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
            <div className="px-6 pt-16 pb-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                  onClick={() => navigate("/whv/dashboard")}
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">
                  Browse Jobs
                </h1>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  placeholder="Search for jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white"
                />
                <button
                  onClick={() => setShowFilters(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <Filter className="text-gray-400" size={20} />
                </button>
              </div>

              {/* Jobs List */}
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={job.profile_photo}
                        alt={job.company_name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                              {job.company_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1 truncate">
                              {job.role} • {job.industry}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {job.location}
                            </p>

                            {/* Badges */}
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getJobTypeColor(
                                  job.employment_type
                                )}`}
                              >
                                {job.employment_type}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                💰 {job.salary}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            onClick={() => handleViewJob(job.job_id)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                          >
                            View Job
                          </Button>
                          <button
                            onClick={() => handleLikeJob(job.job_id)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={
                                job.isLiked
                                  ? "text-slate-800 fill-slate-800"
                                  : "text-slate-800"
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          <LikeConfirmationModal
            candidateName={likedJobTitle}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
