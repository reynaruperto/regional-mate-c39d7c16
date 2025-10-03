// src/pages/whv/WHVJobFull.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Image,
  Award,
  Globe,
  Hash,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
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
  const { jobId } = useParams();

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [employer, setEmployer] = useState<EmployerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        // Job
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

        // Employer
        const { data: emp } = await supabase
          .from("employer")
          .select(
            "company_name, tagline, profile_photo, abn, website, mobile_num, user_id"
          )
          .eq("user_id", job.user_id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("profile")
          .select("email")
          .eq("user_id", job.user_id)
          .maybeSingle();

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
          email: profile?.email || "",
        });
      } catch (err) {
        console.error("Error fetching job full details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

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
            <button
              onClick={() => navigate(-1)}  // ✅ simple back
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Full Job Details</h1>
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

              {/* Job Description */}
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
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
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

              {/* Employer Info */}
              {employer && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Employer Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><Hash size={14} className="inline-block mr-1 text-[#1E293B]" /> ABN: {employer.abn}</p>
                    <p><Globe size={14} className="inline-block mr-1 text-[#1E293B]" /> {employer.website}</p>
                    {employer.email && <p><Mail size={14} className="inline-block mr-1 text-[#1E293B]" /> {employer.email}</p>}
                    {employer.mobile_num && <p><Phone size={14} className="inline-block mr-1 text-[#1E293B]" /> {employer.mobile_num}</p>}
                  </div>
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
