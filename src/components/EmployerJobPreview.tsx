import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Award, Globe } from "lucide-react";
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
}

const EmployerJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        const { data, error } = await supabase
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
            employer(company_name, tagline, website)
          `)
          .eq("job_id", parseInt(jobId))
          .single();

        if (error) {
          toast({ title: "Error loading job", description: error.message });
          return;
        }

        if (data) {
          const jobData = data as any;
          setJobDetails({
            job_id: jobData.job_id,
            description: jobData.description || "No description available",
            employment_type: jobData.employment_type || "Full-time",
            salary_range: jobData.salary_range || "$25-30",
            req_experience: jobData.req_experience || "1-2",
            state: jobData.state,
            suburb_city: jobData.suburb_city,
            postcode: jobData.postcode,
            start_date: jobData.start_date,
            job_status: jobData.job_status,
            role: jobData.industry_role?.role || "Unknown Role",
            company_name: jobData.employer?.company_name || "Unknown Company",
            tagline: jobData.employer?.tagline || "",
            website: jobData.employer?.website || "",
          });
        }

        // Licenses
        const { data: licenseRows } = await supabase
          .from("job_license")
          .select("license(name)")
          .eq("job_id", jobId);

        setLicenses(licenseRows?.map((l) => l.license?.name) || []);
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, toast]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading job details...</div>;
  }

  if (!jobDetails) {
    return <div className="flex items-center justify-center min-h-screen">Job not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
                <div className="w-20 h-20 bg-[#1E293B] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {jobDetails.company_name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{jobDetails.company_name}</h2>
                <p className="text-gray-600 text-sm">{jobDetails.tagline}</p>
                {jobDetails.website && (
                  <p className="text-sm mt-2">
                    <Globe size={14} className="inline mr-1 text-[#1E293B]" />
                    <a
                      href={jobDetails.website.startsWith("http") ? jobDetails.website : `https://${jobDetails.website}`}
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{jobDetails.role}</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    jobDetails.job_status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {jobDetails.job_status.charAt(0).toUpperCase() + jobDetails.job_status.slice(1)}
                </span>
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <Clock className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-gray-900 font-semibold">{jobDetails.employment_type}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <DollarSign className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="text-gray-900 font-semibold">{jobDetails.salary_range}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <User className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-sm text-gray-600">Experience Required</p>
                  <p className="text-gray-900 font-semibold">{jobDetails.req_experience} years</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <Calendar className="w-5 h-5 text-orange-500 mb-2" />
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(jobDetails.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <MapPin className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-gray-900 font-semibold">
                  {jobDetails.suburb_city}, {jobDetails.state} {jobDetails.postcode}
                </p>
              </div>

              {/* Licenses Required */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Award size={18} className="text-[#1E293B] mr-2" /> Licenses Required
                </h4>
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
                    <p className="text-sm text-gray-500">No licenses required</p>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
                <p className="text-gray-700 leading-relaxed">{jobDetails.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobPreview;
