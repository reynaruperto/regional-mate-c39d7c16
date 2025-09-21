import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import { supabase } from "@/integrations/supabase/client";

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

const WHVBrowseJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [likedJobs, setLikedJobs] = useState<number[]>([]);

  // ✅ Load all jobs once
  useEffect(() => {
    const fetchJobs = async () => {
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
          employer:employer(company_name, profile_photo),
          industry_role:industry_role(role, industry(name))
        `
        )
        .eq("job_status", "active");

      if (error) {
        console.error("Error fetching jobs:", error);
      } else if (data) {
        const formatted: Job[] = data.map((j: any) => ({
          job_id: j.job_id,
          description: j.description,
          state: j.state,
          suburb_city: j.suburb_city,
          postcode: j.postcode,
          employment_type: j.employment_type,
          salary_range: j.salary_range,
          company_name: j.employer?.company_name || "Unknown Employer",
          profile_photo: j.employer?.profile_photo || null,
          role: j.industry_role?.role || "",
          industry: j.industry_role?.industry?.name || "",
        }));
        setJobs(formatted);
        setAllJobs(formatted);
      }
    };

    fetchJobs();
    fetchLikedJobs();
  }, []);

  // ✅ Load liked jobs for current user
  const fetchLikedJobs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("likes")
      .select("liked_job_post_id")
      .eq("liker_id", user.id)
      .eq("liker_type", "whv");

    if (!error && data) {
      setLikedJobs(data.map((l) => l.liked_job_post_id));
    }
  };

  // ✅ Handle like/unlike
  const toggleLike = async (jobId: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (likedJobs.includes(jobId)) {
      // Unlike
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("liker_id", user.id)
        .eq("liker_type", "whv")
        .eq("liked_job_post_id", jobId);

      if (!error) {
        setLikedJobs(likedJobs.filter((id) => id !== jobId));
      }
    } else {
      // Like
      const { error } = await supabase.from("likes").insert({
        liker_id: user.id,
        liker_type: "whv",
        liked_job_post_id: jobId,
      });

      if (!error) {
        setLikedJobs([...likedJobs, jobId]);
      }
    }
  };

  // ✅ Apply filters + search
  const applyFilters = (filters: any, query: string = searchQuery) => {
    setSelectedFilters(filters);

    let filtered = [...allJobs];

    if (filters.state) {
      const cleanState = filters.state.replace(/\s*\(.*?\)\s*/g, "");
      filtered = filtered.filter((j) => j.state === cleanState);
    }
    if (filters.citySuburb) {
      filtered = filtered.filter((j) =>
        j.suburb_city.toLowerCase().includes(filters.citySuburb.toLowerCase())
      );
    }
    if (filters.postcode) {
      filtered = filtered.filter((j) => j.postcode === filters.postcode);
    }
    if (filters.interestedIndustry) {
      filtered = filtered.filter(
        (j) => j.industry.toLowerCase() === filters.interestedIndustry.toLowerCase()
      );
    }
    if (filters.lookingForJobType) {
      filtered = filtered.filter(
        (j) => j.employment_type === filters.lookingForJobType
      );
    }
    if (filters.minPayRate || filters.maxPayRate) {
      filtered = filtered.filter((j) => {
        if (!j.salary_range) return false;
        const match = j.salary_range.match(/\$(\d+)/g);
        if (!match) return false;
        const numbers = match.map((m) => parseInt(m.replace("$", ""), 10));
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        if (filters.minPayRate && min < parseInt(filters.minPayRate, 10)) return false;
        if (filters.maxPayRate && max > parseInt(filters.maxPayRate, 10)) return false;
        return true;
      });
    }

    if (query.trim()) {
      filtered = filtered.filter(
        (j) =>
          j.company_name.toLowerCase().includes(query.toLowerCase()) ||
          j.role.toLowerCase().includes(query.toLowerCase()) ||
          j.industry.toLowerCase().includes(query.toLowerCase()) ||
          j.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    setJobs(filtered);
    setShowFilters(false);
  };

  // ✅ Remove a single filter
  const removeFilter = (key: string) => {
    const updated = { ...selectedFilters, [key]: "" };
    applyFilters(updated);
  };

  if (showFilters) {
    return (
      <WHVFilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={(filters) => applyFilters(filters)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0"></div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => window.history.back()}>
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Browse Jobs</h1>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  applyFilters(selectedFilters, e.target.value);
                }}
                className="pl-10 pr-12 h-10 rounded-xl border-gray-200 bg-white"
              />
              <button
                onClick={() => setShowFilters(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(selectedFilters).map(([key, val]) => {
                if (!val || val === false) return null;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span className="text-xs text-gray-700">
                      {key}: {String(val)}
                    </span>
                    <button
                      onClick={() => removeFilter(key)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Job List */}
            {jobs.length > 0 ? (
              <div className="space-y-4 pb-20">
                {jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={job.profile_photo || "/placeholder.png"}
                        alt={job.company_name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {job.company_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">{job.role}</p>
                        <p className="text-sm text-gray-600 mb-1">{job.industry}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          {job.suburb_city}, {job.state} {job.postcode}
                        </p>
                        <p className="text-sm text-gray-600">{job.employment_type}</p>
                      </div>
                      <button onClick={() => toggleLike(job.job_id)}>
                        <Heart
                          className={`${
                            likedJobs.includes(job.job_id)
                              ? "text-blue-900 fill-blue-900"
                              : "text-gray-400"
                          }`}
                          size={20}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No jobs found matching filters</p>
            )}
          </div>

          <div className="bg-white border-t flex-shrink-0 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
