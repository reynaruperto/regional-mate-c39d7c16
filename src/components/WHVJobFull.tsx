// src/components/WHVJobFull.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Image,
  Globe,
  Hash,
  Phone,
  Mail,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
}

interface EmployerDetails {
  abn: string;
  website: string;
  mobile_num?: string;
  email?: string;
}

const WHVJobFull: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const fromPage = (location.state as any)?.from;

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [employer, setEmployer] = useState<EmployerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (fromPage === "browse") {
      navigate("/whv/browse-jobs");
    } else if (fromPage === "topRecommended") {
      navigate("/whv/matches", { state: { tab: "topRecommended" } });
    } else if (fromPage === "matches") {
      navigate("/whv/matches", { state: { tab: "matches" } });
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        // 1. Get job (with employer_id reference)
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
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        if (!job) return;

        // 2. Get employer
        const { data: emp } = await supabase
          .from("employer")
          .select("company_name, tagline, profile_photo, abn, website, mobile_num, user_id")
          .eq("user_id", job.user_id)
          .maybeSingle();

        // 3. Get employer email from profile
        let email = "";
        if (emp?.user_id) {
          const { data: profile } = await supabase
            .from("profile")
            .select("email")
            .eq("user_id", emp.user_id)
            .maybeSingle();
          email = profile?.email || "";
          console.log("PROFILE EMAIL:", email); // 🔎 Debug log
        }

        // 4. Handle company photo
        let companyPhoto: string | null = null;
        if (emp?.profile_photo) {
          let photoPath = emp.profile_photo;
          if (photoPath.includes("/profile_photo/")) {
            photoPath = photoPath.split("/profile_photo/")[1];
          }
          const { data: signed } = await supabase.storage
            .from("profile_photo")
            .createSignedUrl(photoPath, 3600);
          companyPhoto = signed?.signedUrl || null;
        }

        // 5. Facilities
        const { data: facilityRows } = await supabase
          .from("employer_facility")
          .select("facility(name)")
          .eq("user_id", job.user_id);

        const facilities = facilityRows?.map((f: any) => f.facility?.name).filter(Boolean) || [];

        // 6. Licenses
        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        const licenses = licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || [];

        // ✅ Set states
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
          company_name: emp?.company_name || "Unknown Company",
          tagline: emp?.tagline || "No tagline provided",
          company_photo: companyPhoto,
          facilities,
          licenses,
        });

        setEmployer({
          abn: emp?.abn || "N/A",
          website: emp?.website || "Not provided",
          mobile_num: emp?.mobile_num || "",
          email,
        });
      } catch (err) {
        console.error("Error fetching job full details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  if (loading)
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold">Full Job Details</h1>
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

              {/* Employer Info */}
              {employer && (
                <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2">
                  <p>
                    <Hash size={14} className="inline mr-1" /> ABN: {employer.abn}
                  </p>
                  {employer.email && (
                    <p>
                      <Mail size={14} className="inline mr-1" />
                      <a
                        href={`mailto:${employer.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {employer.email}
                      </a>
                    </p>
                  )}
                  {employer.mobile_num && (
                    <p>
                      <Phone size={14} className="inline mr-1" /> {employer.mobile_num}
                    </p>
                  )}
                  <p>
                    <Globe size={14} className="inline mr-1" /> {employer.website}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVJobFull;
