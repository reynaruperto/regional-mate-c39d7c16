// src/pages/EmployerJobMatchPreview.tsx
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
  Clipboard,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  industry?: string;
}

interface EmployerDetails {
  company_name: string;
  tagline: string;
  profile_photo: string | null;
  abn: string;
  website: string;
  mobile_num?: string;
  email?: string;
  business_tenure?: string;
  employee_count?: string;
}

const EmployerJobMatchPreview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const fromPage = (location.state as any)?.from;

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [employer, setEmployer] = useState<EmployerDetails | null>(null);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (fromPage === "postJob") {
      navigate("/employer/post-job");
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    const fetchJobAndEmployer = async () => {
      try {
        if (!jobId) return;

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
            industry_role(role, industry(name)),
            user_id
          `)
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
          industry: job.industry_role?.industry?.name || "Unknown Industry",
        });

        const { data: emp } = await supabase
          .from("employer")
          .select("company_name, tagline, profile_photo, abn, website, mobile_num, user_id, business_tenure, employee_count")
          .eq("user_id", job.user_id)
          .maybeSingle();

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
          website: emp?.website || "Not provided",
          mobile_num: emp?.mobile_num || "",
          email: profile?.email || "",
          business_tenure: emp?.business_tenure || "Not available",
          employee_count: emp?.employee_count || "Not available",
        });

        const { data: facs } = await supabase
          .from("employer_facility")
          .select("facility(name)")
          .eq("user_id", job.user_id);

        setFacilities(facs?.map((f: any) => f.facility?.name).filter(Boolean) || []);

        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        setLicenses(licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || []);
      } catch (err) {
        console.error("Error fetching job preview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndEmployer();
  }, [jobId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!jobDetails || !employer) return <div className="min-h-screen flex items-center justify-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold">Job Preview</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#1E293B] rounded-2xl p-6 space-y-6">
              {/* Company */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#1E293B] overflow-hidden mb-3">
                  {employer.profile_photo ? (
                    <img src={employer.profile_photo} alt="Company" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <Image size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold">{employer.company_name}</h2>
                <p className="text-sm text-gray-600">{employer.tagline}</p>
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
              <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2 text-center">
                {employer.abn && employer.abn !== "N/A" ? (
                  <p className="flex items-center justify-center gap-2">
                    <Hash size={14} />
                    <a
                      href={`https://abr.business.gov.au/ABN/View?id=${employer.abn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      ABN: {employer.abn}
                    </a>
                    <button onClick={() => copyToClipboard(employer.abn)}>
                      <Clipboard size={16} className="cursor-pointer text-gray-500 hover:text-black" />
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-500">⚠️ No ABN provided</p>
                )}
                {employer.email ? (
                  <p className="flex items-center justify-center gap-2">
                    <Mail size={14} />
                    <a href={`mailto:${employer.email}`} className="text-blue-600 hover:underline">
                      {employer.email}
                    </a>
                    <button onClick={() => copyToClipboard(employer.email!)}>
                      <Clipboard size={16} className="cursor-pointer text-gray-500 hover:text-black" />
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-500">⚠️ No email found</p>
                )}
                {employer.mobile_num && (
                  <p className="flex items-center justify-center gap-2">
                    <Phone size={14} />
                    <a href={`tel:${employer.mobile_num}`} className="text-blue-600 hover:underline">
                      {employer.mobile_num}
                    </a>
                    <button onClick={() => copyToClipboard(employer.mobile_num!)}>
                      <Clipboard size={16} className="cursor-pointer text-gray-500 hover:text-black" />
                    </button>
                  </p>
                )}
                {employer.website && employer.website !== "Not provided" ? (
                  <p className="flex items-center justify-center gap-2">
                    <Globe size={14} />
                    <a
                      href={employer.website.startsWith("http") ? employer.website : `https://${employer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {employer.website}
                    </a>
                    <button onClick={() => copyToClipboard(employer.website)}>
                      <Clipboard size={16} className="cursor-pointer text-gray-500 hover:text-black" />
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-500">⚠️ No website provided</p>
                )}
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
                    <span>Experience Required</span>
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

              {/* Company Tenure + Employees */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <User className="w-5 h-5 mr-2" />
                    <span>Company Tenure</span>
                  </div>
                  <p className="font-semibold">{employer.business_tenure}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-1">
                    <User className="w-5 h-5 mr-2" />
                    <span>Employees</span>
                  </div>
                  <p className="font-semibold">{employer.employee_count}</p>
                </div>
              </div>

              {/* Licenses Required */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Licenses Required</h4>
                <div className="flex flex-wrap gap-2">
                  {licenses.length > 0 ? (
                    licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">{l}</span>
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
                  {facilities.length > 0 ? (
                    facilities.map((f, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">{f}</span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No facilities listed</p>
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

export default EmployerJobMatchPreview;
