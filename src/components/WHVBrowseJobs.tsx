// src/pages/WHV/BrowseJobs.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import WHVFilterPage from "@/components/WHVFilterPage";

interface Job {
  job_id: number;
  description: string;
  state: string;
  suburb_city: string;
  postcode: string | null;
  employment_type: string;
  salary_range: string | null;
  company_name: string | null;
  profile_photo: string | null;
  role: string | null;
  industry: string | null;
}

const BrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);

      let query = supabase
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
          employer:employer (
            company_name,
            profile_photo
          ),
          industry_role:industry_role (
            role,
            industry:industry (
              name
            )
          )
        `
        )
        .eq("job_status", "active");

      if (searchQuery) {
        query = query.ilike("description", `%${searchQuery}%`);
      }
      if (filters?.state) {
        query = query.eq("state", filters.state);
      }
      if (filters?.interestedIndustry) {
        query = query.eq("industry_role.industry.name", filters.interestedIndustry);
      }
      if (filters?.lookingForJobType) {
        query = query.eq("employment_type", filters.lookingForJobType);
      }
      if (filters?.minPayRate) {
        query = query.gte("salary_range", filters.minPayRate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } else {
        const mapped = data.map((j: any) => ({
          job_id: j.job_id,
          description: j.description,
          state: j.state,
          suburb_city: j.suburb_city,
          postcode: j.postcode,
          employment_type: j.employment_type,
          salary_range: j.salary_range,
          company_name: j.employer?.company_name || "Unknown company",
          profile_photo: j.employer?.profile_photo || null,
          role: j.industry_role?.role || "Unspecified role",
          industry: j.industry_role?.industry?.name || "General",
        }));
        setJobs(mapped);
      }
      setLoading(false);
    };

    fetchJobs();
  }, [searchQuery, filters]);

  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* iPhone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-3"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1"
            >
              <Filter size={16} /> Filter
            </Button>
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
                      <p className="text-sm text-gray-700">
                        {job.role} • {job.industry}
                      </p>
                      <p className="text-sm text-gray-600">
                        {job.suburb_city}, {job.state}{" "}
                        {job.postcode ? `(${job.postcode})` : ""}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">
                        {job.employment_type} • {job.salary_range || "Rate not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <WHVFilterPage
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
        />
      )}
    </div>
  );
};

export default BrowseJobs;
