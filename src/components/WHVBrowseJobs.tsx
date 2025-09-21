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
  start_date: string | null;
  company_name: string;
  profile_photo: string;
  role: string;
  industry: string;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      // 1️⃣ Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("job")
        .select("job_id, user_id, industry_role_id, start_date, job_status")
        .eq("job_status", "active");

      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
        return;
      }

      if (!jobsData) return;

      // 2️⃣ Fetch employer profiles
      const { data: profiles } = await supabase
        .from("profile")
        .select("user_id, company_name, profile_photo");

      // 3️⃣ Fetch industry roles
      const { data: industryRoles } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry ( name )");

      // 4️⃣ Merge into JobCard[]
      const mapped: JobCard[] = jobsData.map((job) => {
        const profile = profiles?.find((p) => p.user_id === job.user_id);
        const roleData = industryRoles?.find(
          (r) => r.industry_role_id === job.industry_role_id
        );

        // Photo URL
        const photoUrl = profile?.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(profile.profile_photo).data.publicUrl
          : "/placeholder.png";

        return {
          job_id: job.job_id,
          start_date: job.start_date,
          company_name: profile?.company_name || "Unknown Employer",
          profile_photo: photoUrl,
          role: roleData?.role || "Role",
          industry: roleData?.industry?.name || "Industry",
        };
      });

      setJobs(mapped);
    };

    fetchJobs();
  }, []);

  const handleLikeJob = (jobId: number) => {
    const job = jobs.find((j) => j.job_id === jobId);
    if (job) {
      setLikedJobTitle(job.role);
      setShowLikeModal(true);
    }
  };

  const handleViewJob = (jobId: number) => {
    navigate(`/whv/job/${jobId}`);
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedJobTitle("");
  };

  if (showFilters) {
    return (
      <WHVFilterPage onClose={() => setShowFilters(false)} onApplyFilters={() => {}} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0"></div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigate("/whv/dashboard")}>
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Browse Jobs</h1>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search for jobs"
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
            <div className="space-y-4 pb-20">
              {jobs.map((job) => (
                <div key={job.job_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <img
                      src={job.profile_photo}
                      alt={job.company_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {job.company_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {job.role} • {job.industry}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        Start Date: {job.start_date || "TBD"}
                      </p>

                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={() => handleViewJob(job.job_id)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl"
                        >
                          View Job
                        </Button>
                        <button
                          onClick={() => handleLikeJob(job.job_id)}
                          className="h-11 w-11 flex-shrink-0 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all duration-200 shadow-sm"
                        >
                          <Heart size={18} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-t flex-shrink-0 rounded-b-[48px]">
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
