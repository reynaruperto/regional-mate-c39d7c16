// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";

interface Employer {
  user_id: string;
  company_name: string;
  profile_photo?: string;
  suburb_city?: string;
  state?: string;
}

interface Job {
  job_id: number;
  description: string;
  salary_range?: string;
  employment_type?: string;
  suburb_city?: string;
  state?: string;
}

interface Match {
  job_post_id: number;
  employer_id: string;
  matched_at: string;
  employer?: Employer | null;
  job?: Job | null;
}

interface Recommendation {
  job_id: number;
  match_score: number;
  job?: Job & { employer?: Employer };
}

const WHVMatches: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matches" | "recommended">("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged in WHV user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch Matches
  const fetchMatches = async () => {
    if (!whvId) return;

    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("job_post_id, employer_id, matched_at")
        .eq("whv_id", whvId);

      if (matchesError) {
        console.error("❌ Error fetching matches:", matchesError);
        return;
      }
      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        return;
      }

      const employerIds = matchesData.map((m) => m.employer_id);
      const jobIds = matchesData.map((m) => m.job_post_id);

      const { data: employers } = await supabase
        .from("employer")
        .select("user_id, company_name, profile_photo, suburb_city, state")
        .in("user_id", employerIds);

      const { data: jobs } = await supabase
        .from("job")
        .select("job_id, description, salary_range, employment_type, suburb_city, state")
        .in("job_id", jobIds);

      const merged = matchesData.map((m) => ({
        ...m,
        employer: employers?.find((e) => e.user_id === m.employer_id) || null,
        job: jobs?.find((j) => j.job_id === m.job_post_id) || null,
      }));

      setMatches(merged);
    } catch (err) {
      console.error("Unexpected error fetching matches:", err);
    }
  };

  // ✅ Fetch Top Recommended
  const fetchRecommendations = async () => {
    if (!whvId) return;

    try {
      const { data: recData, error: recError } = await supabase
        .from("matching_score")
        .select("job_id, match_score")
        .eq("whv_id", whvId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (recError) {
        console.error("❌ Error fetching recommendations:", recError);
        return;
      }
      if (!recData || recData.length === 0) {
        setRecommendations([]);
        return;
      }

      const jobIds = recData.map((r) => r.job_id);
      const { data: jobs } = await supabase
        .from("job")
        .select("job_id, description, salary_range, employment_type, suburb_city, state, user_id")
        .in("job_id", jobIds);

      const employerIds = jobs?.map((j) => j.user_id) || [];
      const { data: employers } = await supabase
        .from("employer")
        .select("user_id, company_name, profile_photo, suburb_city, state")
        .in("user_id", employerIds);

      const merged = recData.map((r) => {
        const job = jobs?.find((j) => j.job_id === r.job_id) || null;
        const employer = job ? employers?.find((e) => e.user_id === job.user_id) : null;
        return {
          ...r,
          job: job ? { ...job, employer } : null,
        };
      });

      setRecommendations(merged);
    } catch (err) {
      console.error("Unexpected error fetching recommendations:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "matches") fetchMatches();
    if (activeTab === "recommended") fetchRecommendations();
  }, [activeTab, whvId]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-2 flex items-center">
            <Button variant="ghost" size="icon" className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Explore Matches & Top Recommended Employers
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex px-6 mt-4">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                activeTab === "matches"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab("recommended")}
              className={`flex-1 py-3 rounded-xl text-sm font-medium ml-2 ${
                activeTab === "recommended"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              Top Recommended
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 overflow-y-auto mt-4" style={{ paddingBottom: "100px" }}>
            {activeTab === "matches" ? (
              matches.length === 0 ? (
                <p className="text-center text-gray-600 mt-10">No employers found.</p>
              ) : (
                matches.map((m, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <h2 className="text-lg font-bold text-gray-900">
                      {m.employer?.company_name || "Unknown Employer"}
                    </h2>
                    <p className="text-sm text-gray-600">{m.job?.description || "No job info"}</p>
                    <p className="text-xs text-gray-500">
                      {m.job?.suburb_city}, {m.job?.state}
                    </p>
                    <Button className="mt-3 w-full bg-slate-800 text-white rounded-xl">
                      View Full Profile
                    </Button>
                  </div>
                ))
              )
            ) : recommendations.length === 0 ? (
              <p className="text-center text-gray-600 mt-10">No recommendations found.</p>
            ) : (
              recommendations.map((r, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                >
                  <h2 className="text-lg font-bold text-gray-900">
                    {r.job?.employer?.company_name || "Unknown Employer"}
                  </h2>
                  <p className="text-sm text-gray-600">{r.job?.description || "No job info"}</p>
                  <p className="text-xs text-gray-500">
                    {r.job?.suburb_city}, {r.job?.state}
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    Match Score: {r.match_score}%
                  </p>
                  <Button className="mt-3 w-full bg-slate-800 text-white rounded-xl">
                    View Job
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
