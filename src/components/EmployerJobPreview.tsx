// src/pages/employer/EmployerJobPreview.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobDetails {
  job_id: number;
  description: string;
  job_status: string;
}

const EmployerJobPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        console.log("⚠️ No jobId param found");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching job with ID:", jobId);

        const { data, error } = await supabase
          .from("job")
          .select("job_id, description, job_status")
          .eq("job_id", parseInt(jobId))
          .single();

        console.log("Query result:", data, "Error:", error);

        if (error) {
          toast({ title: "Error loading job", description: error.message });
          return;
        }

        if (!data) {
          console.log("⚠️ No job row returned for ID", jobId);
          return;
        }

        setJobDetails({
          job_id: data.job_id,
          description: data.description || "No description available",
          job_status: data.job_status || "unknown",
        });
      } catch (err) {
        console.error("Unexpected error fetching job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <Button onClick={() => navigate("/post-jobs")} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
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
              <h2 className="text-xl font-bold text-gray-900">Job #{jobDetails.job_id}</h2>
              <p className="text-gray-700">{jobDetails.description}</p>
              <p className="text-sm text-gray-500">Status: {jobDetails.job_status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobPreview;
