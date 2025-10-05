// src/components/WHVJobPreview.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, DollarSign, Briefcase, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WHVJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { job_id } = useParams<{ job_id: string }>();

  const [job, setJob] = useState<any>(null);
  const [whvId, setWhvId] = useState<string | null>(null);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch job details + like status
  useEffect(() => {
    const fetchData = async () => {
      if (!job_id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("vw_jobs_with_employers")
        .select("*")
        .eq("job_id", Number(job_id))
        .maybeSingle();

      if (error) {
        console.error("Error fetching job:", error);
        setLoading(false);
        return;
      }

      const resolvedJob = {
        ...data,
        salary_range: data?.salary_range || "Not specified",
        employment_type: data?.employment_type || "N/A",
        req_experience: data?.req_experience || "None",
        start_date: data?.start_date
          ? new Date(data.start_date).toLocaleDateString()
          : "TBD",
      };

      setJob(resolvedJob);

      // ✅ Check if WHV already liked this job
      if (whvId) {
        const { data: liked } = await supabase
          .from("likes")
          .select("id")
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", Number(job_id));

        setIsLiked(!!liked?.length);
      }

      setLoading(false);
    };

    fetchData();
  }, [job_id, whvId]);

  // ✅ Like/unlike logic
  const handleLikeJob = async () => {
    if (!whvId || !job_id) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", Number(job_id));

        if (error) throw error;
        setIsLiked(false);
      } else {
        const { error } = await supabase.from("likes").insert({
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: Number(job_id),
          liked_whv_id: null,
        });

        if (error) throw error;
        setIsLiked(true);
        setShowLikeModal(true);
      }
    } catch (error) {
      console.error("Error liking job:", error);
      alert("Failed to save like.");
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!job) return <div className="flex justify-center items-center min-h-screen">Job not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
            <div className="w-10" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">{job.employment_type}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">{job.salary_range}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Briefcase className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">{job.req_experience}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Calendar className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">{job.start_date}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Job Description</h3>
              <p className="text-gray-700 text-sm">
                {job.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Heart Button */}
          <div className="px-6 pb-8">
            <Button
              onClick={handleLikeJob}
              className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md ${
                isLiked ? "bg-gray-800 text-white" : "bg-[#EC5823] text-white hover:bg-orange-600"
              }`}
            >
              <Heart size={18} className={isLiked ? "fill-white" : ""} />
              {isLiked ? "Liked" : "Heart to Match"}
            </Button>
          </div>
        </div>
      </div>

      <LikeConfirmationModal
        candidateName={job.role}
        onClose={() => setShowLikeModal(false)}
        isVisible={showLikeModal}
      />
    </div>
  );
};

export default WHVJobPreview;
