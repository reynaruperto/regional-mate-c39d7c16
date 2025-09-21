// src/pages/WHV/BrowseJobs.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  job_id: number;
  description: string;
  state: string;
  suburb_city: string;
  postcode: string | null;
  employment_type: string;
  salary_range: string | null;
  company_name: string;
  profile_photo: string | null;
  industry: string;
}

const BrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("job")
        .select(
          `
          job_id,
          description,
          state,
          suburb_city,
          postcode,
          employment_type,
          salary_range,
          profile:profile (
            user_id,
            employer:employer (
              company_name,
              profile_photo,
              industry:industry (
                name
              )
            )
          )
        `
        )
        .eq("job_status", "active");

      if (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } else {
        const mapped = (data || []).map((j: any) => ({
          job_id: j.job_id,
          description: j.description,
          state: j.state,
          suburb_city: j.suburb_city,
          postcode: j.postcode,
          employment_type: j.employment_type,
          salary_range: j.salary_range,
          company_name: j.profile?.employer?.company_name || "Unknown company",
          profile_photo: j.profile?.employer?.profile_photo || null,
          industry: j.profile?.employer?.industry?.name || "General",
        }));
        setJobs(mapped);
      }

      setLoading(false);
    };

    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* iPhone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-3" />

          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
          </div>

          {/* Job list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-center text-gray-500">No jobs found</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    {job.profile_photo ? (
                      <img
                        src={job.profile_photo}
                        alt={job.company_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                        {job.company_name[0]}
                      </div>
                    )}

                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-900">{job.company_name}</h2>
                      <p className="text-sm text-gray-700">{job.industry}</p>
                      <p className="text-sm text-gray-600">
                        {job.suburb_city}, {job.state}{" "}
                        {job.postcode ? `(${job.postcode})` : ""}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">
                        {job.employment_type} • {job.salary_range || "Rate not specified"}
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500">
                          <Heart size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;
