import React, { useEffect, useState } from "react";
import { ArrowLeft, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Job {
  job_id: number;
  description: string;
  state: string;
  suburb_city: string;
  postcode: string;
  employment_type: string;
  salary_range: string;
  job_status: string;
}

const BrowseJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: "",
    employment_type: "",
    salary_range: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);

  // Fetch jobs with filters
  const fetchJobs = async () => {
    setLoading(true);

    let query = supabase
      .from("job")
      .select("job_id, description, state, suburb_city, postcode, employment_type, salary_range, job_status")
      .eq("job_status", "active");

    if (filters.state) query = query.eq("state", filters.state);
    if (filters.employment_type) query = query.eq("employment_type", filters.employment_type);
    if (filters.salary_range) query = query.eq("salary_range", filters.salary_range);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  // Fetch enum values
  const fetchEnums = async () => {
    const { data: stateEnum } = await supabase.rpc("get_enum_values", { enum_name: "state" });
    const { data: jobTypeEnum } = await supabase.rpc("get_enum_values", { enum_name: "job_type_enum" });
    const { data: payRangeEnum } = await supabase.rpc("get_enum_values", { enum_name: "pay_range" });

    if (stateEnum) setStates(stateEnum);
    if (jobTypeEnum) setJobTypes(jobTypeEnum);
    if (payRangeEnum) setPayRanges(payRangeEnum);
  };

  useEffect(() => {
    fetchEnums();
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-4 py-4 flex items-center gap-3 border-b">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
            <h1 className="text-lg font-semibold text-gray-900 flex-1">Browse Jobs</h1>
            <Filter className="w-5 h-5 text-gray-600" />
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b space-y-3 bg-gray-50">
            <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.employment_type} onValueChange={(v) => setFilters({ ...filters, employment_type: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Job Type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map((jt) => (
                  <SelectItem key={jt} value={jt}>
                    {jt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.salary_range} onValueChange={(v) => setFilters({ ...filters, salary_range: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Pay Range" />
              </SelectTrigger>
              <SelectContent>
                {payRanges.map((pr) => (
                  <SelectItem key={pr} value={pr}>
                    {pr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : jobs.length === 0 ? (
              <p className="text-center text-gray-500">No jobs found</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-4 bg-white rounded-2xl shadow-md border space-y-1"
                >
                  <h2 className="font-semibold text-gray-900">{job.description}</h2>
                  <p className="text-sm text-gray-600">
                    {job.suburb_city}, {job.state}{" "}
                    {job.postcode ? `(${job.postcode})` : ""}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {job.employment_type} • {job.salary_range}
                  </p>
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
