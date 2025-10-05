// src/pages/WHVJobPreview.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Calendar,
  User,
  Heart,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface JobDetails {
  job_id: number;
  role: string;
  employment_type: string;
  salary_range: string;
  req_experience: string;
  start_date: string;
  description: string;
  isLiked?: boolean;
}

const WHVJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [whvId, setWhvId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLikeModal, setShowLikeModal] = useState(false);

  // ✅ Fetch logged-in WHV user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        console.error("Error fetching user:", error);
        return;
      }
      setWhvId(data.user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch job details + like state
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("job")
        .select(
          "job_id, employment_type, salary_range, req_experience, start_date, description, industry_role(role)"
        )
        .eq("job_id", Number(jobId))
        .maybeSingle();

      if (error || !data) {
        console.error("Error fetching job:", error);
        setLoading(false);
        return;
      }

      let isLiked = false;
      if (whvId) {
        const { data: likeRows } = await supabase
          .from("likes")
          .select("id")
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", Number(jobId));

        isLiked = !!likeRows?.length;
      }

      setJobDetails({
        job_id: data.job_id,
        role: (data.industry_role as any)?.role || "N/A",
        employment_type: data.employment_type,
        salary_range: data.salary_range,
        req_experience: data.req_experience,
        start_date: data.start_date,
        description: data.description,
        isLiked
      });
      setLoading(false);
    };

    fetchJob();
  }, [jobId, whvId]);

  // ✅ Handle Like / Unlike (TypeScript-safe)
  const handleLikeJob = async () => {
    if (!whvId || !jobDetails) return;

    try {
      if (jobDetails.isLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", Number(jobDetails.job_id));

        if (error) {
          console.error("Error unliking job:", error);
          alert("Failed to remove like.");
          return;
        }

        setJobDetails((prev) =>
          prev ? { ...prev, isLiked: false } : prev
        );
      } else {
        // Like
        const payload = {
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: Number(jobDetails.job_id), // ✅ correct key
          liked_whv_id: null,
        };

        const { data, error } = await supabase.from("likes").insert(payload).select();
        if (error) {
          console.error("Error liking job:", error);
          alert("Failed to save like: " + error.message);
          return;
        }

        console.log("✅ Like saved:", data);
        setJobDetails((prev) =>
          prev ? { ...prev, isLiked: true } : prev
        );
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // ✅ Handle back navigation
  const handleBack = () => navigate(-1);

  if (loading || !jobDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold">Job Preview</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <div className="border-2 border-[#EC5823] rounded-2xl p-6 space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <Clock size={16} />
                    <span className="font-medium">Type</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {jobDetails.employment_type || "N/A"}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <DollarSign size={16} />
                    <span className="font-medium">Salary</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {jobDetails.salary_range || "N/A"}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <User size={16} />
                    <span className="font-medium">Experience</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {jobDetails.req_experience || "None"}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <Calendar size={16} />
                    <span className="font-medium">Start Date</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(jobDetails.start_date).toLocaleDateString("en-US")}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">
                  Job Description
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {jobDetails.description || "No description available"}
                </p>
              </div>

              {/* Heart Button */}
              <Button
                onClick={handleLikeJob}
                className={`w-full ${
                  jobDetails.isLiked
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-slate-800 hover:bg-slate-700"
                } text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md`}
              >
                <Heart
                  size={18}
                  className={
                    jobDetails.isLiked ? "fill-white text-white" : "text-white"
                  }
                />
                {jobDetails.isLiked ? "Liked" : "Heart to Match"}
              </Button>
            </div>
          </div>

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
