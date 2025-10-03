// src/pages/whv/WHVJobPreview.tsx
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
  Award,
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
  const { jobId } = useParams();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [whvId, setWhvId] = useState<string | null>(null);
  const [showLikeModal, setShowLikeModal] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

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
            industry_role ( role, industry(name) ),
            user_id
          `
          )
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        if (!job) return;

        const { data: employer } = await supabase
          .from("employer")
          .select("company_name, tagline, profile_photo")
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

        const { data: facilityRows } = await supabase
          .from("employer_facility")
          .select("facility ( name )")
          .eq("user_id", job.user_id);

        const facilities =
          facilityRows?.map((f: any) => f.facility?.name).filter(Boolean) || [];

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
            .select("id")
            .eq("liker_id", whvId)
            .eq("liked_job_post_id", job.job_id)
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

  const handleLikeJob = async () => {
    if (!whvId || !jobDetails) return;

    try {
      if (jobDetails.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liked_job_post_id", jobDetails.job_id)
          .eq("liker_type", "whv");

        setJobDetails({ ...jobDetails, isLiked: false });
      } else {
        await supabase.from("likes").upsert(
          {
            liker_id: whvId,
            liker_type: "whv",
            liked_job_post_id: jobDetails.job_id,
          },
          { onConflict: "liker_id,liked_job_post_id,liker_type" }
        );

        setJobDetails({ ...jobDetails, isLiked: true });
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!jobDetails) {
    return <div className="flex items-center justify-center min-h-screen"><p>Job not found</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => navigate("/whv/browse-jobs")}
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#1E293B] rounded-2xl p-6 space-y-6">
              {/* Company */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#1E293B] overflow-hidden mb-3">
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

              {/* Role + Industry */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{jobDetails.role}</h3>
                <p className="text-sm text-gray-600 mb-2">{jobDetails.industry}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  jobDetails.job_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {jobDetails.job_status}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">{jobDetails.description}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2"><Clock className="w-5 h-5 text-[#1E293B] mr-2" />
                    <span className="text-sm font-medium text-gray-600">Type</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{jobDetails.employment_type}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2"><DollarSign className="w-5 h-5 text-[#1E293B] mr-2" />
                    <span className="text-sm font-medium text-gray-600">Salary</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{jobDetails.salary_range}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2"><User className="w-5 h-5 text-[#1E293B] mr-2" />
                    <span className="text-sm font-medium text-gray-600">Experience Required</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{jobDetails.req_experience}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2"><Calendar className="w-5 h-5 text-[#1E293B] mr-2" />
                    <span className="text-sm font-medium text-gray-600">Start Date</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{new Date(jobDetails.start_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Licenses */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center mb-2"><Award className="w-5 h-5 text-[#1E293B] mr-2" />
                  <span className="text-sm font-medium text-gray-600">License Required</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.licenses.length > 0 ? (
                    jobDetails.licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border border-[#1E293B] text-[#1E293B] text-xs rounded-full">{l}</span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No licenses required</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center mb-2"><MapPin className="w-5 h-5 text-[#1E293B] mr-2" />
                  <span className="text-sm font-medium text-gray-600">Location</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {jobDetails.suburb_city}, {jobDetails.state} {jobDetails.postcode}
                </p>
              </div>

              {/* Facilities */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.facilities.length > 0 ? (
                    jobDetails.facilities.map((f, i) => (
                      <span key={i} className="px-3 py-1 border border-[#1E293B] text-[#1E293B] text-xs rounded-full">{f}</span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No facilities listed</p>
                  )}
                </div>
              </div>

              {/* Heart Button */}
              <Button
                onClick={handleLikeJob}
                className="w-full bg-[#1E293B] hover:bg-[#0f172a] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <Heart size={18} className={jobDetails.isLiked ? "fill-red-500 text-red-500" : "text-white"} />
                {jobDetails.isLiked ? "Unlike Job" : "Heart to Match"}
              </Button>
            </div>
          </div>
        </div>

        {/* Like Modal */}
        {showLikeModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-full h-full flex items-center justify-center">
              <LikeConfirmationModal
                jobTitle={jobDetails.role}
                companyName={jobDetails.company_name}
                onClose={() => setShowLikeModal(false)}
                isVisible={showLikeModal}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WHVJobPreview;
