import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  job_id: number;
  description: string;
  state: string;
  suburb_city: string;
  postcode: string;
  employment_type: string;
  salary_range: string;
  user_id: string;            // employer
  industry_role_id: number;   // role
}

interface Employer {
  user_id: string;
  company_name: string;
  profile_photo: string | null;
}

interface IndustryRole {
  industry_role_id: number;
  role: string;
  industry_id: number;
}

interface Industry {
  industry_id: number;
  name: string;
}

const BrowseJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);

      // 1. Get jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("job")
        .select(`
          job_id,
          description,
          state,
          suburb_city,
          postcode,
          employment_type,
          salary_range,
          user_id,
          industry_role_id
        `)
        .eq("job_status", "active");

      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
        setLoading(false);
        return;
      }

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // 2. Get all employers
      const employerIds = [...new Set(jobsData.map((j: Job) => j.user_id))];
      const { data: employers } = await supabase
        .from("employer")
        .select("user_id, company_name, profile_photo")
        .in("user_id", employerIds);

      // 3. Get all roles + industries
      const roleIds = [...new Set(jobsData.map((j: Job) => j.industry_role_id))];
      const { data: roles } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id")
        .in("industry_role_id", roleIds);

      const industryIds = roles?.map((r: IndustryRole) => r.industry_id) || [];
      const { data: industries } = await supabase
        .from("industry")
        .select("industry_id, name")
        .in("industry_id", industryIds);

      // 4. Merge everything
      const decoratedJobs = jobsData.map((job: Job) => {
        const employer = employers?.find((e: Employer) => e.user_id === job.user_id);
        const role = roles?.find((r: IndustryRole) => r.industry_role_id === job.industry_role_id);
        const industry = industries?.find((i: Industry) => i.industry_id === role?.industry_id);

        return {
          ...job,
          employerName: employer?.company_name || "Unknown Employer",
          employerPhoto: employer?.profile_photo || null,
          role: role?.role || "Unknown Role",
          industry: industry?.name || "Unknown Industry",
        };
      });

      setJobs(decoratedJobs);
      setLoading(false);
    };

    fetchJobs();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!jobs.length) return <p>No jobs found</p>;

  return (
    <div className="p-4">
      {jobs.map((job) => (
        <div key={job.job_id} className="border p-3 mb-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            {job.employerPhoto ? (
              <img
                src={job.employerPhoto}
                alt={job.employerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
            <div>
              <h3 className="font-semibold">{job.employerName}</h3>
              <p className="text-sm text-gray-500">{job.role} • {job.industry}</p>
              <p className="text-sm text-gray-500">
                {job.suburb_city}, {job.state} ({job.postcode})
              </p>
              <p className="text-sm text-gray-600">
                {job.employment_type} • {job.salary_range}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BrowseJobs;
