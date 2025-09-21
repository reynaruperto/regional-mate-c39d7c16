import React, { useEffect, useState } from "react";
import { ArrowLeft, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import WHVFilterPage from "@/components/WHVFilterPage";

interface Job {
  job_id: number;
  description: string;
  state: string;
  suburb_city: string;
  postcode: string;
  employment_type: string;
  salary_range: string;
  company_name: string;
  profile_photo: string | null;
  role: string;
  industry: string;
}

const BrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<any>({});

  // ===== Fetch jobs from Supabase =====
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select(
          `job_id, description, state, suburb_city, postcode, 
           employment_type, salary_range,
           employer(company_name, profile_photo),
           industry_role(role, industry(name))`
        )
        .eq("job_status", "active");

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      if (data) {
        const jobsData = data.map((j: any) => ({
          job_id: j.job_id,
          description: j.description,
          state: j.state,
          suburb_city: j.suburb_city,
          postcode: j.postcode,
          employment_type: j.employment_type,
          salary_range: j.salary_range,
          company_name: j.employer?.company_name || "Unknown",
          profile_photo: j.employer?.profile_photo || null,
          role: j.industry_role?.role || "",
          industry: j.industry_role?.industry?.name || "",
        }));

        setJobs(jobsData);
        setFilteredJobs(jobsData); // show all by default
      }
    };

    fetchJobs();
  }, []);

  // ===== Apply Filters =====
  const applyFilters = (filters: any) => {
    setActiveFilters(filters);

    let updated = [...jobs];

    if (filters.state) updated = updated.filter((j) => j.state === filters.state);
    if (filters.citySuburb)
      updated = updated.filter((j) =>
        j.suburb_city?.toLowerCase().includes(filters.citySuburb.toLowerCase())
      );
    if (filters.postcode) updated = updated.filter((j) => j.postcode === filters.postcode);
    if (filters.interestedIndustry)
      updated = updated.filter((j) => j.industry === filters.interestedIndustry);
    if (filters.lookingForJobType)
      updated = updated.filter((j) => j.employment_type === filters.lookingForJobType);
    if (filters.minPayRate || filters.maxPayRate) {
      updated = updated.filter((j) => {
        const numeric = parseInt(j.salary_range.replace(/\D/g, ""), 10);
        if (filters.minPayRate && numeric < Number(filters.minPayRate)) return false;
        if (filters.maxPayRate && numeric > Number(filters.maxPayRate)) return false;
        return true;
      });
    }

    setFilteredJobs(updated);
    setShowFilters(false);
  };

  // ===== Search =====
  const searchJobs = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredJobs(jobs);
      return;
    }
    setFilteredJobs(
      jobs.filter(
        (j) =>
          j.role.toLowerCase().includes(query.toLowerCase()) ||
          j.industry.toLowerCase().includes(query.toLowerCase()) ||
          j.company_name.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // ===== Remove Filter (chip close) =====
  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters, [key]: "" };
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setFilteredJobs(jobs);
  };

  // ===== Render =====
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] shadow-2xl p-2">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col relative overflow-hidden">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-4 py-4 border-b flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-2 px-4 py-3">
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => searchJobs(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1"
            >
              <Filter size={18} /> Filter
            </Button>
          </div>

          {/* Active Filters as Chips */}
          {Object.entries(activeFilters).some(([_, v]) => v) && (
            <div className="px-4 flex flex-wrap gap-2 mb-3">
              {Object.entries(activeFilters).map(([key, value]) =>
                value ? (
                  <div
                    key={key}
                    className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                  >
                    <span>
                      {key}: {String(value)}
                    </span>
                    <button onClick={() => removeFilter(key)}>
                      <X size={12} className="text-blue-700" />
                    </button>
                  </div>
                ) : null
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-500 underline"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Job List */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {filteredJobs.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">
                No jobs found matching filters
              </p>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="border rounded-xl p-4 bg-white shadow-sm flex gap-4"
                  >
                    {job.profile_photo ? (
                      <img
                        src={job.profile_photo}
                        alt={job.company_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-sm">🏢</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <h2 className="font-semibold text-gray-900">
                        {job.company_name}
                      </h2>
                      <p className="text-sm text-gray-700">
                        {job.role} • {job.industry}
                      </p>
                      <p className="text-sm text-gray-600">
                        {job.suburb_city}, {job.state} ({job.postcode || "N/A"})
                      </p>
                      <p className="text-sm text-gray-800">
                        {job.employment_type} • {job.salary_range}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <WHVFilterPage
          onClose={() => setShowFilters(false)}
          onApplyFilters={applyFilters}
        />
      )}
    </div>
  );
};

export default BrowseJobs;
