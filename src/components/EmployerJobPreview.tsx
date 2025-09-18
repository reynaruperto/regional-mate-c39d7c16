// src/components/EmployerJobPreviewCard.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Calendar, DollarSign, Briefcase, Heart } from "lucide-react";
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
  abn: string | null;
  website: string | null;
  company_photo: string | null;
  licenses: string[];
  facilities: string[];
}

const EmployerJobPreviewCard: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
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
            profile:user_id (
              employer:user_id (
                company_name,
                tagline,
                abn,
                website,
                profile_photo,
                employer_facility (
                  facility:facility_id (name)
                )
              )
            ),
            job_license (
              license:license_id (name)
            )
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
            employment_type: jobData.employment_type || "Not specified",
            salary_range: jobData.salary_range || "Not specified",
            req_experience: jobData.req_experience || "Not specified",
            state: jobData.state || "Not specified",
            suburb_city: jobData.suburb_city || "Not specified",
            postcode: jobData.postcode || "Not specified",
            start_date: jobData.start_date || "Not specified",
            job_status: jobData.job_status || "active",
            role: jobData.industry_role?.role || "Unknown Role",
            company_name: jobData.profile?.employer?.company_name || "Unknown Company",
            tagline: jobData.profile?.employer?.tagline || "No tagline provided",
            abn: jobData.profile?.employer?.abn || null,
            website: jobData.profile?.employer?.website || null,
            company_photo: jobData.profile?.employer?.profile_photo || null,
            licenses: (jobData.job_license || []).map((jl: any) => jl.license?.name),
            facilities: (jobData.profile?.employer?.employer_facility || []).map(
              (f: any) => f.facility?.name
            ),
          });
        }
      } catch (err) {
        console.error("Error fetching job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, toast]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!jobDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Job not found</p>
        <Button onClick={() => navigate("/post-jobs")} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
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

          {/* Job Info */}
          <div className="flex-1 px-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
              {/* Company Logo */}
              {jobDetails.company_photo ? (
                <img
                  src={jobDetails.company_photo}
                  alt={jobDetails.company_name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3" />
              )}

              {/* Company Info */}
              <h2 className="text-xl font-bold text-center">{jobDetails.company_name}</h2>
              <p className="text-sm text-center text-gray-600">{jobDetails.tagline}</p>
              <p className="text-xs text-center text-gray-500">
                ABN: {jobDetails.abn || "Not available"}
              </p>
              <p className="text-xs text-center text-gray-500">
                Website:{" "}
                {jobDetails.website ? (
                  <a href={jobDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {jobDetails.website}
                  </a>
                ) : (
                  "Not available"
                )}
              </p>

              <div className="border-t my-4"></div>

              {/* Job Details */}
              <div className="space-y-2 text-sm">
                <p><Briefcase className="inline w-4 h-4 mr-2 text-gray-500" /> {jobDetails.role}</p>
                <p><Calendar className="inline w-4 h-4 mr-2 text-gray-500" /> Start: {jobDetails.start_date}</p>
                <p><DollarSign className="inline w-4 h-4 mr-2 text-gray-500" /> {jobDetails.salary_range}</p>
                <p>Experience Required: {jobDetails.req_experience}</p>
                <p><MapPin className="inline w-4 h-4 mr-2 text-gray-500" /> {jobDetails.suburb_city}, {jobDetails.state} {jobDetails.postcode}</p>
              </div>

              {/* Licenses Required */}
              {jobDetails.licenses.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Licenses Required</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {jobDetails.licenses.map((license, idx) => (
                      <li key={idx}>{license}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Facilities */}
              {jobDetails.facilities.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Facilities</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {jobDetails.facilities.map((facility, idx) => (
                      <li key={idx}>{facility}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Heart to Match */}
              <div className="mt-6 flex justify-center">
                <Button
                  className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full flex items-center"
                  onClick={() => toast({ title: "Matched!", description: "This job has been added to your matches." })}
                >
                  <Heart className="w-5 h-5 mr-2" /> Match
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobPreviewCard;
