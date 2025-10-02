// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";

interface Employer {
  user_id: string;
  company_name: string;
  tagline?: string;
  suburb_city?: string;
  state?: string;
  postcode?: string;
  profile_photo?: string;
}

interface Job {
  job_id: number;
  description?: string;
  salary_range?: string;
  employment_type?: string;
  state?: string;
  suburb_city?: string;
  postcode?: string;
  start_date?: string;
  user_id?: string;
}

interface Match {
  job_post_id: number;
  matched_at: string;
  employer: Employer | null;
  job: Job | null;
}

interface Recommendation {
  job_id: number;
  match_score: number;
  job: Job | null;
  employer: Employer | null;
}

const WHVMatches: React.FC = () => {
  const [tab, setTab] = useState<"matches" | "recommended">("matches");
  const [whvId, setWhvId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // ✅ Get current WHV user
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

    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("*")
      .eq("whv_id", whvId);

    if (error) {
      console.error("Error fetching matches:", error);
      return;
    }
    if (!matchesData) return;

    const employerIds = matchesData.map((m) => m.employer_id);
    const jobIds = matchesData.map((m) => m.job_post_id);

    const { data: employers } = await supabase
      .from("employer")
      .select("user_id, company_name, tagline, suburb_city, state, postcode, profile_photo")
      .in("user_id", employerIds);

    const { data: jobs } = await supabase
      .from("job")
      .select("job_id, description, salary_range, employment_type, state, suburb_city, postcode, start_date, user_id")
      .in("job_id", jobIds);

    const merged = matchesData.map((m) => ({
      job_post_id: m.job_post_id,
      matched_at: m.matched_at,
      employer: employers?.find((e) => e.user_id === m.employer_id) || null,
      job: jobs?.find((j) => j.job_id === m.job_post_id) || null,
    }));

    setMatches(merged);
  };

  // ✅ Fetch Recommendations
  const fetchRecommendations = async () => {
    if (!whvId) return;

    const { data: recs, error } = await supabase
      .from("matching_score")
      .select("*")
      .eq("whv_id", whvId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recommendations:", error);
      return;
    }
    if (!recs) return;

    const jobIds = recs.map((r) => r.job_id);
    const { data: jobs } = await supabase
      .from("job")
      .select("job_id, description, salary_range, employment_type, state, suburb_city, postcode, start_date, user_id")
      .in("job_id", jobIds);

    const employerIds = jobs?.map((j) => j.user_id) || [];
    const { data: employers } = await supabase
      .from("employer")
      .select("user_id, company_name, tagline, profile_photo")
      .in("user_id", employerIds);

    const merged = recs.map((r) => {
      const job = jobs?.find((j) => j.job_id === r.job_id) || null;
      const employer = job ? employers?.find((e) => e.user_id === job.user_id) || null : null;
      return { ...r, job, employer };
    });

    setRecommendations(merged);
  };

  useEffect(() => {
    fetchMatches();
    fetchRecommendations();
  }, [whvId]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                Explore Matches & Top Recommended Employers
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex px-6 mt-4 mb-2">
              <button
                className={`flex-1 py-2 text-center rounded-full ${
                  tab === "matches" ? "bg-orange-500 text-white font-semibold" : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setTab("matches")}
              >
                Matches
              </button>
              <button
                className={`flex-1 py-2 text-center rounded-full ml-2 ${
                  tab === "recommended" ? "bg-orange-500 text-white font-semibold" : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setTab("recommended")}
              >
                Top Recommended
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {tab === "matches" ? (
                matches.length === 0 ? (
                  <div className="text-center text-gray-600 mt-10">No employers found.</div>
                ) : (
                  matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={m.employer?.profile_photo || "/placeholder.png"}
                          alt={m.employer?.company_name || "Employer"}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-gray-900">
                            {m.employer?.company_name || "Unknown Employer"}
                          </h2>
                          <p className="text-sm text-gray-600">{m.job?.description || "No description"}</p>
                          <p className="text-sm text-gray-500">
                            {m.job?.suburb_city}, {m.job?.state}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Matched on {new Date(m.matched_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : recommendations.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">No recommendations found.</div>
              ) : (
                recommendations.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={r.employer?.profile_photo || "/placeholder.png"}
                        alt={r.employer?.company_name || "Employer"}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">
                          {r.employer?.company_name || "Unknown Employer"}
                        </h2>
                        <p className="text-sm text-gray-600">{r.job?.description || "No description"}</p>
                        <p className="text-sm text-gray-500">
                          {r.job?.suburb_city}, {r.job?.state}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Match Score: {r.match_score.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
