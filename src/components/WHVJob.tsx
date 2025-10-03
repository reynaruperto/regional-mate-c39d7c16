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

  // Logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // Fetch job details
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
              onClick={() => navigate(-1)} //  Dynamic back navigation
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
            <div className="w-10"></div>
          </div>

          {/* Main content remains unchanged */}
          {/* ... */}
        </div>

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
