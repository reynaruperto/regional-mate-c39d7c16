// src/pages/BrowseJobs.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";

interface JobCard {
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
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [likes, setLikes] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  // ---------- Fetch Jobs ----------
  const fetchJobs = async (filters?: any) => {
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
        industry_role:industry_role(role, industry:industry(name)),
        employer:employer(company_name, profile_photo)
      `
      )
      .eq("job_status", "active");

    // Apply filters only if provided
    if (filters?.state) query = query.eq("state", filters.state);
    if (filters?.citySuburb)
      query = query.ilike("suburb_city", `%${filters.citySuburb}%`);
    if (filters?.postcode) query = query.eq("postcode", filters.postcode);
    if (filters?.interestedIndustry)
      query = query.ilike(
        "industry_role.industry.name",
        `%${filters.interestedIndustry}%`
      );
    if (filters?.lookingForJobType)
      query = query.eq("employment_type", filters.lookingForJobType);
    if (filters?.minPayRate)
      query = query.gte("salary_range", filters.minPayRate);
    if (filters?.maxPayRate)
      query = query.lte("salary_range", filters.maxPayRate);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      return;
    }

    if (data) {
      const formatted: JobCard[] = data.map((j: any) => ({
        job_id: j.job_id,
        description: j.description,
        state: j.state,
        suburb_city: j.suburb_city,
        postcode: j.postcode,
        employment_type: j.employment_type,
        salary_range: j.salary_range,
        company_name: j.employer?.company_name || "Unknown",
        profile_photo: j.employer?.profile_photo || null,
        role: j.industry_role?.role || "Unspecified",
        industry: j.industry_role?.industry?.name || "Unspecified",
      }));
      setJobs(formatted);
    }
  };

  // ---------- Fetch Likes ----------
  const fetchLikes = async () => {
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
      setLikes(new Set(data.map((l) => l.liked_job_post_id)));
    }
  };

  // ---------- Toggle Like ----------
  const toggleLike = async (jobId: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (likes.has(jobId)) {
      await supabase
        .from("likes")
        .delete()
        .eq("liker_id", user.id)
        .eq("liked_job_post_id", jobId);
      setLikes((prev) => {
        const updated = new Set(prev);
        updated.delete(jobId);
        return updated;
      });
    } else {
      await supabase.from("likes").insert({
        liker_id: user.id,
        liker_type: "whv",
        liked_job_post_id: jobId,
      });
      setLikes((prev) => new Set(prev).add(jobId));
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    fetchJobs(activeFilters);
    fetchLikes();
  }, [activeFilters]);

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 border-b flex items-center justify-between">
            <button
              onClick={() => setShowFilters(true)}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
            <div className="w-12" />
          </div>

          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {jobs.length === 0 ? (
              <p className="text-center text-gray-500">No jobs found</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="border rounded-2xl p-4 flex items-start gap-4 bg-white shadow-sm"
                >
                  {job.profile_photo ? (
                    <img
                      src={job.profile_photo}
                      alt={job.company_name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Img</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {job.company_name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {job.role} • {job.industry}
                    </p>
                    <p className="text-sm text-gray-600">
                      {job.suburb_city}, {job.state} {job.postcode}
                    </p>
                    <p className="text-sm text-gray-600">
                      {job.employment_type} • {job.salary_range}
                    </p>
                  </div>
                  <button onClick={() => toggleLike(job.job_id)}>
                    <Heart
                      className={`w-6 h-6 ${
                        likes.has(job.job_id)
                          ? "text-blue-900 fill-blue-900"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Nav */}
          <BottomNavigation />
        </div>
      </div>

      {/* Filter Page */}
      {showFilters && (
        <WHVFilterPage
          onClose={() => setShowFilters(false)}
          onApplyFilters={(filters) => {
            setActiveFilters(filters);
          }}
        />
      )}
    </div>
  );
};

export default BrowseJobs;
