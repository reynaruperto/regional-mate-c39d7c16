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
  email?: string;
  abn?: string;
  website?: string;
  mobile_num?: string;
}

const WHVJobFull: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const fromPage = (location.state as any)?.from;
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
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
        const { data, error } = await supabase
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
            employer:user_id (
              company_name,
              tagline,
              profile_photo,
              abn,
              website,
              mobile_num,
              profile:user_id (
                email
              )
            )
          `
          )
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        if (error) {
          console.error("Error fetching job details:", error);
          return;
        }
        if (!data) return;

        // 👇 force TS to stop complaining
        const job: any = data;

        // Facilities
        const { data: facilityRows } = await supabase
          .from("employer_facility")
          .select("facility(name)")
          .eq("user_id", job.employer?.user_id);

        const facilities =
          facilityRows?.map((f: any) => f.facility?.name).filter(Boolean) || [];

        // Licenses
        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        const licenses =
          licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || [];

        // Photo
        let companyPhoto: string | null = null;
        if (job.employer?.profile_photo) {
          let photoPath = job.employer.profile_photo.includes("/profile_photo/")
            ? job.employer.profile_photo.split("/profile_photo/")[1]
            : job.employer.profile_photo;
          const { data: signed } = await supabase.storage
            .from("profile_photo")
            .createSignedUrl(photoPath, 3600);
          companyPhoto = signed?.signedUrl || null;
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
          company_name: job.employer?.company_name || "Unknown Company",
          tagline: job.employer?.tagline || "No tagline provided",
          company_photo: companyPhoto,
          facilities,
          licenses,
          email: job.employer?.profile?.email || "",
          abn: job.employer?.abn || "N/A",
          website: job.employer?.website || "Not provided",
          mobile_num: job.employer?.mobile_num || "",
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

              {/* Role + Industry + Status */}
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

              {/* Employer Info */}
              <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2">
                <p>
                  <Hash size={14} className="inline mr-1" /> ABN:{" "}
                  {jobDetails.abn}
                </p>
                <p>
                  <Mail size={14} className="inline mr-1" />
                  {jobDetails.email ? (
                    <a
                      href={`mailto:${jobDetails.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {jobDetails.email}
                    </a>
                  ) : (
                    <span className="text-gray-500">⚠ No email found</span>
                  )}
                </p>
                {jobDetails.mobile_num && (
                  <p>
                    <Phone size={14} className="inline mr-1" />{" "}
                    {jobDetails.mobile_num}
                  </p>
                )}
                <p>
                  <Globe size={14} className="inline mr-1" />{" "}
                  {jobDetails.website}
                </p>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center mb-1">
                  <MapPin className="w-5 h-5 text-[#1E293B] mr-2" />
                  <span className="text-sm font-medium text-gray-600">
                    Location
                  </span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {jobDetails.suburb_city}, {jobDetails.state}{" "}
                  {jobDetails.postcode}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Type</span>
                  </div>
                  <p className="font-semibold">
                    {jobDetails.employment_type}
                  </p>
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
                  <p className="font-semibold">
                    {jobDetails.req_experience}
                  </p>
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
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Licenses</h4>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.licenses.length > 0 ? (
                    jobDetails.licenses.map((l, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border text-xs rounded-full"
                      >
                        {l}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No licenses required
                    </p>
                  )}
                </div>
              </div>

              {/* Facilities */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Facilities</h4>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.facilities.length > 0 ? (
                    jobDetails.facilities.map((f, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border text-xs rounded-full"
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No facilities listed
                    </p>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h4 className="font-semibold mb-2">Job Description</h4>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p>{jobDetails.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVJobFull;
