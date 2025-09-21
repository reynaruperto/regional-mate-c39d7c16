// src/pages/whv/WHVJobPreview.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Heart,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";

interface JobDetails {
  job_id: number;
  description: string;
  employment_type: string;
  salary_range: string;
  req_experience: string;
  state: string;
  suburb_city: string;
  postcode: string;
  start_date: string;
  job_status: string;
  role: string;
  company_name: string;
  tagline: string;
  company_photo: string | null;
  licenses: string[];
  website: string;
  isLiked?: boolean;
}

const WHVJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [whvId, setWhvId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLikeModal, setShowLikeModal] = useState(false);

  // ✅ Get logged-in WHV
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch job details + like state
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        const { data: job } = await supabase
          .from("job")
          .select(
            `
            job_id,
            description,
            employment_type,
            salary_range,
            req_experience,
            state,
            suburb_city,
            postcode,
            start_date,
            job_status,
            industry_role ( role ),
            user_id
          `
          )
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        if (!job) return;

        const { data: employer } = await supabase
          .from("employer")
          .select("company_name, tagline, profile_photo, website")
          .eq("user_id", job.user_id)
          .maybeSingle();

        let companyPhoto: string | null = null;
        if (employer?.profile_photo) {
          let photoPath = employer.profile_photo;
          if (photoPath.includes("/profile_photo/")) {
            photoPath = photoPath.split("/profile_photo/")[1];
          }
          const { data: signed } = await supabase.storage
            .from("profile_photo")
            .createSignedUrl(photoPath, 3600);
          companyPhoto = signed?.signedUrl || null;
        }

        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license ( name )")
          .eq("job_id", job.job_id);

        const licenses =
          licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || [];

        let isLiked = false;
        if (whvId) {
          const { data: like } = await supabase
            .from("likes")
            .select("liked_job_post_id")
            .eq("liker_id", whvId)
            .eq("liker_type", "whv")
            .eq("liked_job_post_id", job.job_id)
            .maybeSingle();
          isLiked = !!like;
        }

        setJobDetails({
          job_id: job.job_id,
          description: job.description || "No description available",
          employment_type: job.employment_type || "N/A",
          salary_range: job.salary_range || "N/A",
          req_experience: job.req_experience || "N/A",
          state: job.state || "N/A",
          suburb_city: job.suburb_city || "N/A",
          postcode: job.postcode || "",
          start_date: job.start_date || new Date().toISOString(),
          job_status: job.job_status || "draft",
          role: job.industry_role?.role || "Unknown Role",
          company_name: employer?.company_name || "Unknown Company",
          tagline: employer?.tagline || "No tagline provided",
          company_photo: companyPhoto,
          licenses,
          website: employer?.website || "Not applicable",
          isLiked,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, whvId]);

  // ✅ Optimistic Like toggle
  const handleLikeJob = async () => {
    if (!whvId || !jobDetails) return;

    const newState = !jobDetails.isLiked;
    setJobDetails({ ...jobDetails, isLiked: newState });

    try {
      if (newState) {
        await supabase.from("likes").upsert(
          {
            liker_id: whvId,
            liker_type: "whv",
            liked_job_post_id: jobDetails.job_id,
          },
          { onConflict: "liker_id,liked_job_post_id,liker_type" }
        );
        setShowLikeModal(true);
      } else {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liked_job_post_id", jobDetails.job_id)
          .eq("liker_type", "whv");
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setJobDetails({ ...jobDetails, isLiked: !newState }); // rollback if error
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!jobDetails) return <div className="flex items-center justify-center min-h-screen">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => navigate("/whv/browse-jobs")}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
            <div className="w-10"></div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Company Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-slate-800 overflow-hidden mb-3">
                  {jobDetails.company_photo ? (
                    <img src={jobDetails.company_photo} alt="Company" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <Image size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{jobDetails.company_name}</h2>
                <p className="text-sm text-gray-600 mt-1">{jobDetails.tagline}</p>
              </div>

              {/* Job Info */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{jobDetails.role}</h3>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  {jobDetails.job_status}
                </span>
              </div>

              {/* Salary & Type */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <Clock className="w-5 h-5 text-slate-800 mr-2" />
                  <p className="text-gray-900 font-semibold">{jobDetails.employment_type}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <DollarSign className="w-5 h-5 text-slate-800 mr-2" />
                  <p className="text-gray-900 font-semibold">{jobDetails.salary_range}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">{jobDetails.description}</p>
                </div>
              </div>

              {/* Heart Button */}
              <Button
                onClick={handleLikeJob}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <Heart
                  size={18}
                  className={jobDetails.isLiked ? "fill-red-500 text-red-500" : "text-white"}
                />
                {jobDetails.isLiked ? "Unlike Job" : "Heart to Match"}
              </Button>
            </div>
          </div>

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={jobDetails.role}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVJobPreview;
