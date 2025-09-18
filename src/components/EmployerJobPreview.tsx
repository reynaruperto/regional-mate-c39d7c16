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
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const jobIdNum = parseInt(jobId, 10);

        // 1. Fetch job
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
            industry_role (role),
            user_id
          `
          )
          .eq("job_id", jobIdNum)
          .maybeSingle();

        if (jobError || !job) {
          setJobDetails(null);
          toast({
            title: "Error",
            description: jobError?.message || "Job not found",
            variant: "destructive",
          });
          return;
        }

        // 2. Fetch employer separately
        const { data: emp } = await supabase
          .from("employer")
          .select("company_name, tagline, website, profile_photo")
          .eq("user_id", job.user_id)
          .maybeSingle();

        // 3. Sign company photo if present
        let companyPhoto: string | null = null;
        if (emp?.profile_photo) {
          let path = emp.profile_photo;
          if (path.includes("/profile_photo/")) {
            path = path.split("/profile_photo/")[1];
          }
          const { data: signed } = await supabase.storage
            .from("profile_photo")
            .createSignedUrl(path, 3600);
          companyPhoto = signed?.signedUrl ?? null;
        }

        // 4. Fetch job licenses
        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        const licenses =
          licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || [];

        // 5. Merge into state
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
          job_status: job.job_status,
          role: job.industry_role?.role || "Unknown Role",
          company_name: emp?.company_name || "Unknown Company",
          tagline: emp?.tagline || "",
          website: emp?.website || "",
          company_photo: companyPhoto,
          licenses,
        });
      } catch (e) {
        console.error("Error fetching job preview:", e);
        toast({
          title: "Error",
          description: "Could not load job preview",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, toast]);

  if (loading) return <p>Loading...</p>;
  if (!jobDetails) return <p>Job not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full"></div>
          <div className="w-full h-full flex flex-col relative bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="px-6 pt-16 pb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigate("/post-jobs")}>
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
              <div className="w-12"></div>
            </div>

            {/* Card */}
            <div className="flex-1 px-6 overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                {/* Company */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full border mx-auto mb-3 overflow-hidden">
                    {jobDetails.company_photo ? (
                      <img src={jobDetails.company_photo} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold">{jobDetails.company_name[0]}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{jobDetails.company_name}</h2>
                  <p className="text-sm text-gray-600">{jobDetails.tagline}</p>
                  {jobDetails.website && (
                    <p className="text-sm mt-1">
                      <Globe size={14} className="inline mr-1" />
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

                {/* Role */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold">{jobDetails.role}</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm ${
                      jobDetails.job_status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {jobDetails.job_status}
                  </span>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Clock size={16} className="inline mr-1 text-blue-500" />{" "}
                    {jobDetails.employment_type}
                  </div>
                  <div>
                    <DollarSign size={16} className="inline mr-1 text-green-500" />{" "}
                    {jobDetails.salary_range}
                  </div>
                  <div>
                    <User size={16} className="inline mr-1 text-purple-500" />{" "}
                    {jobDetails.req_experience} years
                  </div>
                  <div>
                    <Calendar size={16} className="inline mr-1 text-orange-500" />{" "}
                    {new Date(jobDetails.start_date).toLocaleDateString()}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <MapPin size={16} className="inline mr-1 text-red-500" />{" "}
                  {jobDetails.suburb_city}, {jobDetails.state} {jobDetails.postcode}
                </div>

                {/* Licenses */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Licenses Required</h4>
                  {jobDetails.licenses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {jobDetails.licenses.map((l, i) => (
                        <span key={i} className="px-3 py-1 border rounded-full text-sm">
                          {l}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No licenses required</p>
                  )}
                </div>

                <Button className="w-full bg-[#1E293B] text-white rounded-xl py-3 flex items-center justify-center gap-2">
                  <Heart size={16} /> Heart to Match
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobPreview;
