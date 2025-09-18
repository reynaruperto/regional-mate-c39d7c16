// src/pages/employer/EmployerJobPreview.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Award,
  Globe,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  company_name: string;
  tagline: string;
  website?: string;
  company_photo: string | null;
  licenses: string[];
}

const EmployerJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!jobId) return;

      try {
        // 1) Fetch the job (and role) by id
        const jobIdNum = parseInt(jobId, 10);
        const { data: job, error: jobError } = await supabase
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
            industry_role ( role ),
            user_id
          `
          )
          .eq("job_id", jobIdNum)
          .maybeSingle();

        if (jobError || !job) {
          toast({
            title: "Error loading job",
            description: jobError?.message || "Job not found",
            variant: "destructive",
          });
          setJobDetails(null);
          return;
        }

        // 2) Fetch employer by job.user_id (no schema-cache joins)
        const { data: emp, error: empErr } = await supabase
          .from("employer")
          .select("company_name, tagline, website, profile_photo")
          .eq("user_id", job.user_id)
          .maybeSingle();

        if (empErr) {
          // not fatal; just log
          console.error("Employer fetch error:", empErr);
        }

        // 3) Sign employer profile photo if present
        let companyPhoto: string | null = null;
        if (emp?.profile_photo) {
          let path = emp.profile_photo as string;
          if (path.includes("/profile_photo/")) {
            path = path.split("/profile_photo/")[1];
          }
          const { data: signed } = await supabase
            .storage
            .from("profile_photo")
            .createSignedUrl(path, 3600);
          companyPhoto = signed?.signedUrl ?? null;
        }

        // 4) Licenses required for this job
        const { data: licenseRows, error: licErr } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        if (licErr) {
          console.error("Licenses fetch error:", licErr);
        }

        const licenses =
          licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || [];

        // 5) Build final jobDetails state
        setJobDetails({
          job_id: job.job_id,
          description: job.description || "No description available",
          employment_type: job.employment_type || "Full-time",
          salary_range: job.salary_range || "",
          req_experience: job.req_experience || "",
          state: job.state || "",
          suburb_city: job.suburb_city || "",
          postcode: job.postcode || "",
          start_date: job.start_date,
          job_status: job.job_status || "active",
          role: job.industry_role?.role || "Unknown Role",
          company_name: emp?.company_name || "Unknown Company",
          tagline: emp?.tagline || "",
          website: emp?.website || "",
          company_photo: companyPhoto,
          licenses,
        });
      } catch (e) {
        console.error(e);
        toast({
          title: "Error loading job",
          description: "Something went wrong fetching this job.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [jobId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading job details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600">Job not found</p>
                <Button onClick={() => navigate("/post-jobs")} className="mt-4">
                  Back to Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm"
                onClick={() => navigate("/post-jobs")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
              <div className="w-12 h-12"></div>
            </div>

            {/* Job Preview Card */}
            <div className="flex-1 px-6 overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                {/* Company Info */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full border-4 border-[#1E293B] mx-auto mb-4 overflow-hidden flex items-center justify-center bg-gray-50">
                    {jobDetails.company_photo ? (
                      <img
                        src={jobDetails.company_photo}
                        alt="Company"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[#1E293B]">
                        {jobDetails.company_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {jobDetails.company_name}
                  </h2>
                  <p className="text-gray-600 text-sm">{jobDetails.tagline}</p>
                  {jobDetails.website && (
                    <p className="text-sm mt-2">
                      <Globe size={14} className="inline mr-1 text-[#1E293B]" />
                      <a
                        href={
                          jobDetails.website.startsWith("http")
                            ? jobDetails.website
                            : `https://${jobDetails.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {jobDetails.website}
                      </a>
                    </p>
                  )}
                </div>

                {/* Job Title */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {jobDetails.role}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      jobDetails.job_status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {jobDetails.job_status.charAt(0).toUpperCase() +
                      jobDetails.job_status.slice(1)}
                  </span>
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-2">
                      <Clock className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Type
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {jobDetails.employment_type}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-2">
                      <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Salary
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {jobDetails.salary_range}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Experience Required
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {jobDetails.req_experience} years
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Start Date
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {new Date(jobDetails.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Location
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {jobDetails.suburb_city}, {jobDetails.state}{" "}
                    {jobDetails.postcode}
                  </p>
                </div>

                {/* Licenses Required */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Award size={18} className="text-[#1E293B] mr-2" /> Licenses
                    Required
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.licenses.length > 0 ? (
                      jobDetails.licenses.map((l, i) => (
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

                {/* Heart CTA */}
                <Button className="w-full bg-[#1E293B] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 shadow-md">
                  <Heart size={18} className="fill-white" /> Heart to Match
                </Button>
              </div>
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobPreview;
