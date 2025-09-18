// src/pages/employer/EmployerJobPreview.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Award, Heart } from "lucide-react";
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
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        // 1️⃣ Job
        const { data: job, error: jobError } = await supabase
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
            industry_role(role),
            user_id
          `)
          .eq("job_id", parseInt(jobId))
          .maybeSingle();

        if (jobError || !job) {
          toast({ title: "Error loading job", description: jobError?.message });
          return;
        }

        // 2️⃣ Employer
        const { data: emp } = await supabase
          .from("employer")
          .select("company_name, tagline, profile_photo")
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

        // 3️⃣ Licenses Required
        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", job.job_id);

        const licenses =
          licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || [];

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
          company_name: emp?.company_name || "Unknown Company",
          tagline: emp?.tagline || "",
          company_photo: signedPhoto,
          licenses,
        });
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, toast]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!jobDetails) {
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
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
            <h1 className="text-lg font-semibold text-gray-900">Job Preview</h1>
            <div className="w-10"></div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#1E293B] rounded-2xl p-6 space-y-6">
              {/* Employer */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-[#1E293B] overflow-hidden mb-3">
                  {jobDetails.company_photo ? (
                    <img
                      src={jobDetails.company_photo}
                      alt="Company"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <User size={28} />
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{jobDetails.company_name}</h2>
                <p className="text-sm text-gray-600">{jobDetails.tagline}</p>
              </div>

              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Clock className="w-4 h-4 text-[#1E293B] inline mr-1" />
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium text-gray-900">{jobDetails.employment_type}</p>
                </div>
                <div>
                  <DollarSign className="w-4 h-4 text-[#1E293B] inline mr-1" />
                  <span className="text-gray-600">Salary:</span>
                  <p className="font-medium text-gray-900">{jobDetails.salary_range}</p>
                </div>
                <div>
                  <User className="w-4 h-4 text-[#1E293B] inline mr-1" />
                  <span className="text-gray-600">Experience Required:</span>
                  <p className="font-medium text-gray-900">{jobDetails.req_experience} years</p>
                </div>
                <div>
                  <Calendar className="w-4 h-4 text-[#1E293B] inline mr-1" />
                  <span className="text-gray-600">Start Date:</span>
                  <p className="font-medium text-gray-900">{new Date(jobDetails.start_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Licenses */}
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-2 flex items-center">
                  <Award size={16} className="mr-2" /> Licenses Required
                </h3>
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
                    <p className="text-sm text-gray-500">No licenses required</p>
                  )}
                </div>
              </div>

              {/* Heart Button */}
              <Button className="w-full bg-[#1E293B] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 shadow-md">
                <Heart size={18} className="fill-white" /> Heart to Match
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobPreview;
