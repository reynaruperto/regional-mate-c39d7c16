// src/pages/WHVJobPreview.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  Heart,
  MapPin,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WHVJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { job_id } = useParams<{ job_id: string }>();

  const [job, setJob] = useState<any>(null);
  const [whvId, setWhvId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch current WHV user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) setWhvId(data.user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch job details + liked state
  useEffect(() => {
    const fetchJob = async () => {
      if (!job_id) return;

      try {
        setLoading(true);

        const { data: jobData, error } = await supabase
          .from("job")
          .select(`
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
            industry_role:industry_role_id (role, industry:industry_id (name)),
            employer:user_id (company_name, tagline, profile_photo)
          `)
          .eq("job_id", Number(job_id))
          .maybeSingle();

        if (error || !jobData) throw error;
        setJob(jobData);

        if (whvId) {
          const { data: likes } = await supabase
            .from("likes")
            .select("liked_job_post_id")
            .eq("liker_id", whvId)
            .eq("liker_type", "whv");

          const likedIds = likes?.map((l) => l.liked_job_post_id) || [];
          setIsLiked(likedIds.includes(Number(job_id)));
        }
      } catch (err) {
        console.error("Error fetching job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [job_id, whvId]);

  // ✅ Like/Unlike Job
  const handleLikeJob = async () => {
    if (!whvId || !job_id) return;

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", job_id);

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
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Failed to like this job. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading...
      </div>
    );

  if (!job)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Job not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
            <div className="w-10" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            {/* Company */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-[#1E293B] overflow-hidden mb-3">
                {job.employer?.profile_photo ? (
                  <img
                    src={job.employer.profile_photo}
                    alt="Company"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <Image size={32} />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">{job.employer?.company_name}</h2>
              <p className="text-sm text-gray-600">{job.employer?.tagline}</p>
            </div>

            {/* Job Role */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {job.industry_role?.role || "Role not specified"}
              </h3>
              <p className="text-sm text-gray-600">
                {job.industry_role?.industry?.name || "Industry not listed"}
              </p>
            </div>

            {/* Location */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center mb-1">
                <MapPin className="w-5 h-5 text-[#1E293B] mr-2" />
                <span className="text-sm font-medium text-gray-600">Location</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {job.suburb_city}, {job.state} {job.postcode}
              </p>
            </div>

            {/* Job Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <Clock className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">
                  {job.employment_type || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">
                  {job.salary_range || "Not specified"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <Briefcase className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">
                  {job.req_experience || "None"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <Calendar className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">
                  {job.start_date
                    ? new Date(job.start_date).toLocaleDateString("en-AU")
                    : "TBD"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Job Description</h4>
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700">
                {job.description || "No description provided."}
              </div>
            </div>
          </div>

          {/* Heart Button */}
          <div className="px-6 pb-8">
            <Button
              onClick={handleLikeJob}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md ${
                isLiked
                  ? "bg-gray-800 text-white"
                  : "bg-[#EC5823] text-white hover:bg-orange-600"
              }`}
            >
              <Heart size={18} className={isLiked ? "fill-white" : ""} />
              {isLiked ? "Liked" : "Heart to Match"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <LikeConfirmationModal
        candidateName={job.industry_role?.role || "Job successfully liked"}
        onClose={() => setShowLikeModal(false)}
        isVisible={showLikeModal}
      />
    </div>
  );
};

export default WHVJobPreview;
