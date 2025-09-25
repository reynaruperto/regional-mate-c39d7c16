// src/components/WHVBrowseJobs.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";

import { supabase } from "@/integrations/supabase/client";

interface JobCard {
  job_id: number;
  company_name: string;
  profile_photo: string;
  role: string;
  industry: string;
  state: string;
  suburb_city: string;
  postcode: string | number;
  salary_range: string;
  employment_type: string;
  start_date?: string;
  description?: string;
  facilities: string[];
  isLiked?: boolean;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = (url: string) => {
    window.location.href = url;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [allJobs, setAllJobs] = useState<JobCard[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [whvId, setWhvId] = useState<string | null>(null);

  const [nationality, setNationality] = useState<string>("");
  const [visaStage, setVisaStage] = useState<string>("");

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch nationality, visa stage, and jobs filtered by eligibility
  useEffect(() => {
    const fetchJobs = async () => {
      if (!whvId) return;

      // 1️⃣ Get WHV nationality
      const { data: maker } = await supabase
        .from("whv_maker")
        .select("nationality, user_id")
        .eq("user_id", whvId)
        .single();

      if (!maker) return;
      setNationality(maker.nationality);

      // 2️⃣ Get latest visa_stage via maker_visa → visa_stage join
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(`
          stage_id,
          created_at,
          visa_stage:visa_stage(stage)
        `)
        .eq("user_id", whvId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setVisaStage(String(visa?.visa_stage?.stage || "")); // ✅ force string

      console.log("➡️ WHV Nationality:", maker.nationality);
      console.log("➡️ Visa Stage ID:", visa?.stage_id);
      console.log("➡️ Visa Stage Label:", visa?.visa_stage?.stage);

      // 3️⃣ Get eligible industry IDs (match country + stage_id)
      const { data: eligibility, error: eligError } = await supabase
        .from("mvw_eligibility_visa_country_stage_industry")
        .select("industry_id")
        .eq("country", maker.nationality)
        .eq("stage_id", visa?.stage_id);

      if (eligError) {
        console.error("❌ Error fetching eligibility:", eligError);
      }

      console.log("➡️ Eligibility Results:", eligibility);

      const eligibleIds = eligibility?.map((e) => e.industry_id) || [];
      if (eligibleIds.length === 0) {
        console.warn("⚠️ No eligible industries for:", maker.nationality, visa?.stage_id);
        setJobs([]);
        setAllJobs([]);
        return;
      }

      console.log("✅ Eligible Industry IDs:", eligibleIds);

      // 4️⃣ Fetch jobs in eligible industries (cast select as any to avoid TS2589)
      const { data: jobsData, error: jobsError } = await supabase
        .from("job")
        .select(
          `
          job_id,
          state,
          suburb_city,
          postcode,
          salary_range,
          employment_type,
          start_date,
          description,
          industry_role (
            industry_id,
            role,
            industry ( name )
          ),
          employer (
            company_name,
            profile_photo
          )
        ` as any
        )
        .filter("job_status", "eq", "active")
        .in("industry_role.industry_id", eligibleIds as any);

      if (jobsError) {
        console.error("❌ Error fetching jobs:", jobsError);
      }

      console.log("➡️ Jobs fetched from DB:", jobsData);

      const mapped: JobCard[] = (jobsData || []).map((job: any) => {
        const photoUrl = job.employer?.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(job.employer.profile_photo).data.publicUrl
          : "/placeholder.png";

        return {
          job_id: job.job_id,
          company_name: job.employer?.company_name || "Unknown Employer",
          profile_photo: photoUrl,
          role: job.industry_role?.role || "Unknown Role",
          industry: job.industry_role?.industry?.name || "Unknown Industry",
          state: job.state,
          suburb_city: job.suburb_city,
          postcode: job.postcode,
          salary_range: job.salary_range || "Rate not specified",
          employment_type: job.employment_type || "N/A",
          start_date: job.start_date,
          description: job.description || "",
          facilities: [],
          isLiked: false,
        };
      });

      console.log("✅ Jobs mapped to frontend:", mapped);

      setJobs(mapped);
      setAllJobs(mapped);
    };

    fetchJobs();
  }, [whvId]);

  // 🔎 Search + Filters
  useEffect(() => {
    let list = [...allJobs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.role.toLowerCase().includes(query) ||
          j.industry.toLowerCase().includes(query) ||
          j.company_name.toLowerCase().includes(query) ||
          j.state.toLowerCase().includes(query) ||
          j.suburb_city.toLowerCase().includes(query) ||
          String(j.postcode).includes(query)
      );
    }

    if (filters.state) {
      list = list.filter((j) => j.state?.toLowerCase() === filters.state.toLowerCase());
    }

    if (filters.facility) {
      list = list.filter((j) =>
        j.facilities?.some((f) => f.toLowerCase() === filters.facility.toLowerCase())
      );
    }

    setJobs(list);
  }, [searchQuery, filters, allJobs]);

  // ✅ Like/unlike
  const handleLikeJob = async (jobId: number) => {
    if (!whvId) return;
    const job = jobs.find((j) => j.job_id === jobId);
    if (!job) return;

    try {
      if (job.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liked_job_post_id", jobId)
          .eq("liker_type", "whv");

        setJobs((prev) => prev.map((j) => j.job_id === jobId ? { ...j, isLiked: false } : j));
        setAllJobs((prev) => prev.map((j) => j.job_id === jobId ? { ...j, isLiked: false } : j));
      } else {
        await supabase.from("likes").upsert(
          { liker_id: whvId, liker_type: "whv", liked_job_post_id: jobId },
          { onConflict: "liker_id,liked_job_post_id,liker_type" }
        );

        setJobs((prev) => prev.map((j) => j.job_id === jobId ? { ...j, isLiked: true } : j));
        setAllJobs((prev) => prev.map((j) => j.job_id === jobId ? { ...j, isLiked: true } : j));

        setLikedJobTitle(job.role);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  return showFilters ? (
    <WHVFilterPage
      onClose={() => setShowFilters(false)}
      onApplyFilters={(f) => setFilters(f)}
    />
  ) : (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header + Visa Info Banner */}
            <div className="px-6 pt-16 pb-2 flex flex-col gap-2">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                  onClick={() => navigate("/whv/dashboard")}
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
              </div>

              {nationality && visaStage && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-sm text-orange-800">
                  <p>
                    <strong>{nationality}</strong> • {visaStage} WHV
                  </p>
                  <p className="text-xs text-orange-700">
                    Only jobs eligible for your visa will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-4 px-6">
              <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white w-full"
              />
              <button
                onClick={() => setShowFilters(true)}
                className="absolute right-9 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Jobs List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {jobs.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No eligible jobs found for your visa stage and nationality.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.job_id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4">
                    <div className="flex items-start gap-4">
                      <img src={job.profile_photo} alt={job.company_name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">{job.role}</h2>
                        <p className="text-sm text-gray-600">{job.company_name} • {job.industry}</p>
                        <p className="text-sm text-gray-500">{job.suburb_city}, {job.state} {job.postcode}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {job.employment_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            💰 {job.salary_range}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description || "No description provided"}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            onClick={() => navigate(`/whv/job/${job.job_id}`)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                          >
                            View Details
                          </Button>
                          <button
                            onClick={() => handleLikeJob(job.job_id)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart size={20} className={job.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          <LikeConfirmationModal
            candidateName={likedJobTitle}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
