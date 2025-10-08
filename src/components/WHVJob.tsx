import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Heart,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  industry: string;
  company_name: string;
  tagline: string;
  company_photo: string | null;
  facilities: string[];
  licenses: string[];
  isLiked?: boolean;
}

const WHVJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [whvId, setWhvId] = useState<string | null>(null);
  const [showLikeModal, setShowLikeModal] = useState(false);

  const fromPage = (location.state as any)?.from;

  // ✅ Get user robustly (works even on cold page load)
  useEffect(() => {
    const getUser = async () => {
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user || null;
      }
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch job details when ready
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        const { data: job } = await supabase
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
            industry_role ( role, industry(name) ),
            user_id
          `)
          .eq("job_id", Number(jobId))
          .maybeSingle();

        if (!job) return;

        const { data: employer } = await supabase
          .from("employer")
          .select("company_name, tagline, profile_photo")
          .eq("user_id", job.user_id)
          .maybeSingle();

        let companyPhoto: string | null = null;
        if (employer?.profile_photo) {
          const photoPath = employer.profile_photo;
          if (photoPath.startsWith("http")) {
            companyPhoto = photoPath;
          } else {
            const { data } = supabase.storage
              .from("profile_photo")
              .getPublicUrl(photoPath);
            companyPhoto = data.publicUrl;
          }
        }

        const { data: facilityRows } = await supabase
          .from("employer_facility")
          .select("facility(name)")
          .eq("user_id", job.user_id);
        const facilities =
          facilityRows?.map((f: any) => f.facility?.name).filter(Boolean) || [];

        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("other, license_id!inner(name)")
          .eq("job_id", job.job_id);
        const licenses = (licenseRows || []).map((l: any) =>
          l.other || l.license_id?.name
        ).filter(Boolean);

        let isLiked = false;
        if (whvId) {
          const { data: like } = await supabase
            .from("likes")
            .select("id")
            .eq("liker_id", whvId)
            .eq("liked_job_post_id", Number(job.job_id))
            .eq("liker_type", "whv")
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
          industry: job.industry_role?.industry?.name || "Unknown Industry",
          company_name: employer?.company_name || "Unknown Company",
          tagline: employer?.tagline || "No tagline provided",
          company_photo: companyPhoto,
          facilities,
          licenses,
          isLiked,
        });
      } catch (err) {
        console.error("Error fetching job preview:", err);
      } finally {
        setLoading(false);
      }
    };

    if (whvId) fetchJobDetails();
  }, [jobId, whvId]);

  // ✅ Like / Unlike with recovery if user not ready
  const handleLikeJob = async () => {
    if (!jobDetails) return;

    let activeUserId = whvId;
    if (!activeUserId) {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        setWhvId(user.id);
        activeUserId = user.id;
      } else {
        console.warn("User not authenticated yet — cannot like job.");
        return;
      }
    }

    try {
      if (jobDetails.isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("liker_id", activeUserId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", Number(jobDetails.job_id));
        if (error) console.error("Error deleting like:", error);
        setJobDetails((prev) => (prev ? { ...prev, isLiked: false } : prev));
      } else {
        const { error } = await supabase.from("likes").insert({
          liker_id: activeUserId,
          liker_type: "whv",
          liked_job_post_id: Number(jobDetails.job_id),
          liked_whv_id: null,
        });
        if (error) console.error("Error inserting like:", error);
        setJobDetails((prev) => (prev ? { ...prev, isLiked: true } : prev));
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // ✅ Back navigation logic
  const handleBack = () => {
    if (fromPage === "notifications") navigate("/whv/notifications");
    else if (fromPage === "browse") navigate("/whv/browse-jobs");
    else if (fromPage === "topRecommended")
      navigate("/whv/matches", { state: { tab: "topRecommended" } });
    else if (fromPage === "matches")
      navigate("/whv/matches", { state: { tab: "matches" } });
    else navigate(-1);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  if (!jobDetails)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Job not found</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </Button>
            <h1 className="text-lg font-semibold">Job Preview</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#1E293B] rounded-2xl p-6 space-y-6">
              {/* Company */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#1E293B] overflow-hidden mb-3">
                  {jobDetails.company_photo ? (
                    <img
                      src={jobDetails.company_photo}
                      alt="Company"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <Image size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold">{jobDetails.company_name}</h2>
                <p className="text-sm text-gray-600">{jobDetails.tagline}</p>
              </div>

              {/* Job Info */}
              <div className="text-center">
                <h3 className="text-2xl font-bold">{jobDetails.role}</h3>
                <p className="text-sm text-gray-600">{jobDetails.industry}</p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    jobDetails.job_status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {jobDetails.job_status}
                </span>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center mb-1">
                  <MapPin className="w-5 h-5 text-[#1E293B] mr-2" />
                  <span className="text-sm font-medium text-gray-600">Location</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {jobDetails.suburb_city}, {jobDetails.state} {jobDetails.postcode}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Type</span>
                  </div>
                  <p className="font-semibold">{jobDetails.employment_type}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span>Salary</span>
                  </div>
                  <p className="font-semibold">{jobDetails.salary_range}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <User className="w-5 h-5 mr-2" />
                    <span>Experience</span>
                  </div>
                  <p className="font-semibold">{jobDetails.req_experience}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>Start Date</span>
                  </div>
                  <p className="font-semibold">
                    {new Date(jobDetails.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Licenses */}
              {jobDetails.licenses.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-semibold mb-2">Licenses Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.licenses.map((l, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Facilities</h4>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.facilities.length > 0 ? (
                    jobDetails.facilities.map((f, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">
                        {f}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No facilities listed</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Job Description</h4>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p>{jobDetails.description}</p>
                </div>
              </div>

              {/* Heart Button */}
              <Button
                onClick={handleLikeJob}
                disabled={loading || !whvId}
                className="w-full bg-[#1E293B] hover:bg-[#0f172a] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Heart
                  size={18}
                  className={
                    jobDetails.isLiked
                      ? "fill-orange-500 text-orange-500 transition-all duration-200"
                      : "text-white transition-all duration-200"
                  }
                />
                {jobDetails.isLiked ? "Unlike Job" : "Heart to Match"}
              </Button>
            </div>
          </div>
        </div>

        {/* Like Modal */}
        {showLikeModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <LikeConfirmationModal
              jobTitle={jobDetails.role}
              companyName={jobDetails.company_name}
              onClose={() => setShowLikeModal(false)}
              isVisible={showLikeModal}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WHVJobPreview;
