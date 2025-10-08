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
  Copy,
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
    if (fromPage === "browse") navigate("/whv/browse-jobs");
    else if (fromPage === "topRecommended") navigate("/whv/matches", { state: { tab: "topRecommended" } });
    else if (fromPage === "matches") navigate("/whv/matches", { state: { tab: "matches" } });
    else navigate(-1);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard ✅");
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        // ===================== JOB =====================
        const { data: jobData } = await supabase
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
            user_id,
            industry_role ( role, industry(name) )
          `,
          )
          .eq("job_id", Number(jobId))
          .maybeSingle();

        if (!jobData) {
          setLoading(false);
          return;
        }

        // ===================== EMPLOYER =====================
        const { data: employerData } = await supabase
          .from("employer")
          .select(
            `
            user_id,
            company_name,
            tagline,
            profile_photo,
            abn,
            website,
            mobile_num
          `,
          )
          .eq("user_id", jobData.user_id)
          .maybeSingle();

        // ===================== PROFILE EMAIL =====================
        const { data: profileData } = await supabase
          .from("profile")
          .select("email")
          .eq("user_id", jobData.user_id)
          .maybeSingle();

        // ===================== COMPANY PHOTO =====================
        let companyPhoto: string | null = null;
        if (employerData?.profile_photo) {
          let photoPath = employerData.profile_photo;
          if (photoPath.includes("/profile_photo/")) {
            photoPath = photoPath.split("/profile_photo/")[1];
          }
          const { data: signed } = await supabase.storage.from("profile_photo").createSignedUrl(photoPath, 3600);
          companyPhoto = signed?.signedUrl || null;
        }

        // ===================== FACILITIES =====================
        const { data: facilityRows } = await supabase
          .from("employer_facility")
          .select("facility(name)")
          .eq("user_id", jobData.user_id);

        const facilities = facilityRows?.map((f: any) => f.facility?.name).filter(Boolean) || [];

        // ===================== LICENSES (FULL FIX) =====================
        const { data: jobLicenseRows, error: jobLicenseError } = await supabase
          .from("job_license")
          .select("license_id, other")
          .eq("job_id", Number(jobData.job_id)); // ensure numeric match

        console.log("jobLicenseRows →", jobLicenseRows);
        if (jobLicenseError) console.error("job_license fetch error:", jobLicenseError);

        let licenses: string[] = [];

        if (jobLicenseRows && jobLicenseRows.length > 0) {
          const licenseIds = jobLicenseRows.map((row) => row.license_id);
          console.log("licenseIds →", licenseIds);

          const { data: licenseNames, error: licenseNameError } = await supabase
            .from("license")
            .select("license_id, name")
            .in("license_id", licenseIds);

          console.log("licenseNames →", licenseNames);
          if (licenseNameError) console.error("license name fetch error:", licenseNameError);

          const otherLicenses = jobLicenseRows.map((l) => l.other).filter((v) => v && v.trim() !== "");

          licenses = [...(licenseNames?.map((l) => l.name) || []), ...otherLicenses];

          console.log("Final merged licenses →", licenses);
        }

        // ===================== SET STATE =====================
        setJobDetails({
          job_id: jobData.job_id,
          description: jobData.description || "No description available",
          employment_type: jobData.employment_type || "N/A",
          salary_range: jobData.salary_range || "N/A",
          req_experience: jobData.req_experience || "N/A",
          state: jobData.state || "N/A",
          suburb_city: jobData.suburb_city || "N/A",
          postcode: jobData.postcode || "",
          start_date: jobData.start_date || new Date().toISOString(),
          job_status: jobData.job_status || "draft",
          role: jobData.industry_role?.role || "Unknown Role",
          industry: jobData.industry_role?.industry?.name || "Unknown Industry",
          company_name: employerData?.company_name || "Unknown Company",
          tagline: employerData?.tagline || "No tagline provided",
          company_photo: companyPhoto,
          facilities,
          licenses,
          email: profileData?.email || "",
          abn: employerData?.abn || "N/A",
          website: employerData?.website || "Not provided",
          mobile_num: employerData?.mobile_num || "",
        });
      } catch (err) {
        console.error("Error fetching job full details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!jobDetails)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Job not found</p>
      </div>
    );

  // ===================== RENDER =====================
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

          {/* Scrollable Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#1E293B] rounded-2xl p-6 space-y-6">
              {/* Company Info */}
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
                <h2 className="text-xl font-bold">{jobDetails.company_name}</h2>
                <p className="text-sm text-gray-600">{jobDetails.tagline}</p>
              </div>

              {/* Role and Industry */}
              <div className="text-center">
                <h3 className="text-2xl font-bold">{jobDetails.role}</h3>
                <p className="text-sm text-gray-600">{jobDetails.industry}</p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    jobDetails.job_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {jobDetails.job_status}
                </span>
              </div>

              {/* Licenses */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Licenses Required</h4>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.licenses.length > 0 ? (
                    jobDetails.licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">
                        {l}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No licenses required</p>
                  )}
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVJobFull;
