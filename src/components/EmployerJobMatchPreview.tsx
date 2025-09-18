// src/pages/employer/EmployerJobMatchPreview.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Globe,
  Hash,
  Phone,
  Mail,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface JobDetails {
  job_id: number;
  role: string;
  description: string;
  employment_type: string;
  salary_range: string;
  req_experience: string;
  state: string;
  suburb_city: string;
  postcode: string;
  start_date: string;
  job_status: string;
}

interface EmployerDetails {
  company_name: string;
  tagline: string;
  profile_photo: string | null;
  abn: string;
  website: string;
  mobile_num?: string;
  email?: string;
}

const EmployerJobMatchPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [employer, setEmployer] = useState<EmployerDetails | null>(null);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobAndEmployer = async () => {
      try {
        if (!jobId) return;

        // 1️⃣ Get job info
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
            industry_role(role),
            user_id
          `
          )
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        if (!job) return;

        setJobDetails({
          job_id: job.job_id,
          description: job.description,
          employment_type: job.employment_type,
          salary_range: job.salary_range,
          req_experience: job.req_experience,
          state: job.state,
          suburb_city: job.suburb_city,
          postcode: job.postcode,
          start_date: job.start_date,
          job_status: job.job_status,
          role: job.industry_role?.role || "Unknown Role",
        });

        // 2️⃣ Employer details
        const { data: emp } = await supabase
          .from("employer")
          .select(
            "company_name, tagline, profile_photo, abn, website, mobile_num, user_id"
          )
          .eq("user_id", job.user_id)
          .maybeSingle();

        // 3️⃣ Employer email from profile
        const { data: profile } = await supabase
          .from("profile")
          .select("email")
          .eq("user_id", job.user_id)
          .maybeSingle();

        let signedPhoto: string | null = null;
        if (emp?.profile_photo) {
          let path = emp.profile_photo;
          if (path.includes("/profile_photo/")) {
            path = path.split("/profile_photo/")[1];
          }
          const { data: signed } = await supabase.storage
            .from("profile_photo")
            .createSignedUrl(path, 3600);
          signedPhoto = signed?.signedUrl ?? null;
        }

        setEmployer({
          company_name: emp?.company_name || "Unknown Company",
          tagline: emp?.tagline || "",
          profile_photo: signedPhoto,
          abn: emp?.abn || "N/A",
          website: emp?.website || "Not applicable",
          mobile_num: emp?.mobile_num || "",
          email: profile?.email || "",
        });

        // 4️⃣ Facilities
        const { data: facs } = await supabase
          .from("employer_facility")
          .select("facility(name)")
          .eq("user_id", job.user_id);

        setFacilities(
          facs?.map((f: any) => f.facility?.name).filter(Boolean) || []
        );

        // 5️⃣ Licenses
        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        setLicenses(
          licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || []
        );
      } catch (err) {
        console.error("Error fetching job preview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndEmployer();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!jobDetails || !employer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Job not found</p>
        <Button onClick={() => navigate("/post-jobs")} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                onClick={() => navigate("/post-jobs")}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Job Match</h1>
              <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <div className="border-2 border-[#1E293B] rounded-2xl p-6 space-y-6">
                {/* Employer Header */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-2 border-[#1E293B] overflow-hidden mb-3">
                    {employer.profile_photo ? (
                      <img
                        src={employer.profile_photo}
                        alt="Company"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {employer.company_name}
                  </h2>
                  <p className="text-sm text-gray-600">{employer.tagline}</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Hash size={14} className="mr-1 text-[#1E293B]" />
                    ABN: {employer.abn}
                  </p>
                  {employer.mobile_num && (
                    <p className="text-sm text-gray-700 flex items-center mt-1">
                      <Phone size={14} className="mr-1 text-[#1E293B]" />{" "}
                      {employer.mobile_num}
                    </p>
                  )}
                  {employer.email && (
                    <p className="text-sm text-gray-700 flex items-center mt-1">
                      <Mail size={14} className="mr-1 text-[#1E293B]" />{" "}
                      {employer.email}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 flex items-center mt-1">
                    <Globe size={14} className="mr-1 text-[#1E293B]" />{" "}
                    {employer.website}
                  </p>
                </div>

                {/* Job Info */}
                <div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">
                    Job Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <p className="font-medium text-gray-900">
                        {jobDetails.role}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium text-gray-900">
                        {jobDetails.employment_type}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Salary:</span>
                      <p className="font-medium text-gray-900">
                        {jobDetails.salary_range}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Experience Required:</span>
                      <p className="font-medium text-gray-900">
                        {jobDetails.req_experience} years
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(jobDetails.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium text-gray-900">
                        {jobDetails.job_status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">Location</h3>
                  <p className="text-gray-900 font-medium">
                    {jobDetails.suburb_city}, {jobDetails.state}{" "}
                    {jobDetails.postcode}
                  </p>
                </div>

                {/* Facilities */}
                <div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">
                    Facilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {facilities.length > 0 ? (
                      facilities.map((f, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 border border-[#1E293B] text-[#1E293B] text-xs rounded-full"
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

                {/* License Required */}
                <div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">
                    License Required
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.length > 0 ? (
                      licenses.map((l, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 border border-[#1E293B] text-[#1E293B] text-xs rounded-full"
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

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">
                    Job Description
                  </h3>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {jobDetails.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobMatchPreview;
