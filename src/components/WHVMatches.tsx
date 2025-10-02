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
  description: string;
  salary_range?: string;
  employment_type?: string;
  start_date?: string;
  suburb_city?: string;
  state?: string;
  postcode?: string;
  user_id: string;
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
  job: (Job & { employer: Employer | null }) | null;
}

const WHVMatches: React.FC = () => {
  const [tab, setTab] = useState<"matches" | "recommended">("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ get logged in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ fetch matches
  const fetchMatches = async () => {
    if (!whvId) return;

    const { data: matchRows, error } = await supabase
      .from("matches")
      .select("job_post_id, employer_id, matched_at")
      .eq("whv_id", whvId)
      .not("matched_at", "is", null);

    if (error) {
      console.error("Error fetching matches:", error);
      return;
    }
    if (!matchRows?.length) {
      setMatches([]);
      return;
    }

    const jobIds = matchRows.map((m) => m.job_post_id);
    const employerIds = matchRows.map((m) => m.employer_id);

    const { data: jobs } = await supabase
      .from("job")
      .select("job_id, description, salary_range, employment_type, start_date, suburb_city, state, postcode, user_id")
      .in("job_id", jobIds);

    const { data: employers } = await supabase
      .from("employer")
      .select("user_id, company_name, tagline, suburb_city, state, postcode, profile_photo")
      .in("user_id", employerIds);

    const mapped = matchRows.map((m) => ({
      job_post_id: m.job_post_id,
      matched_at: m.matched_at,
      job: jobs?.find((j) => j.job_id === m.job_post_id) || null,
      employer: employers?.find((e) => e.user_id === m.employer_id) || null,
    }));

    setMatches(mapped as Match[]);
  };

  // ✅ fetch recommendations
  const fetchRecommendations = async () => {
    if (!whvId) return;

    const { data: recRows, error } = await supabase
      .from("matching_score")
      .select("job_id, match_score")
      .eq("whv_id", whvId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recommendations:", error);
      return;
    }
    if (!recRows?.length) {
      setRecommendations([]);
      return;
    }

    const jobIds = recRows.map((r) => r.job_id);

    const { data: jobs } = await supabase
      .from("job")
      .select("job_id, description, salary_range, employment_type, start_date, suburb_city, state, postcode, user_id")
      .in("job_id", jobIds);

    const employerIds = jobs?.map((j) => j.user_id) || [];

    const { data: employers } = await supabase
      .from("employer")
      .select("user_id, company_name, tagline, profile_photo")
      .in("user_id", employerIds);

    const mapped = recRows.map((r) => {
      const job = jobs?.find((j) => j.job_id === r.job_id) || null;
      const employer = employers?.find((e) => e.user_id === job?.user_id) || null;
      return { ...r, job: job ? { ...job, employer } : null };
    });

    setRecommendations(mapped as Recommendation[]);
  };

  useEffect(() => {
    if (tab === "matches") {
      fetchMatches();
    } else {
      fetchRecommendations();
    }
  }, [tab, whvId]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="w-12 h-12 bg-white rounded-xl shadow-sm">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Explore Matches & Top Recommended Employers
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-4 bg-gray-200 rounded-full">
            <button
              onClick={() => setTab("matches")}
              className={`flex-1 py-2 rounded-full font-medium ${
                tab === "matches" ? "bg-orange-500 text-white" : "text-gray-600"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setTab("recommended")}
              className={`flex-1 py-2 rounded-full font-medium ${
                tab === "recommended" ? "bg-orange-500 text-white" : "text-gray-600"
              }`}
            >
              Top Recommended
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            {tab === "matches" ? (
              matches.length === 0 ? (
                <p className="text-center text-gray-600 mt-10">No employers found.</p>
              ) : (
                matches.map((m, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={m.employer?.profile_photo || "/placeholder.png"}
                        alt={m.employer?.company_name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">
                          {m.employer?.company_name}
                        </h2>
                        <p className="text-sm text-gray-600">{m.job?.description}</p>
                        <p className="text-xs text-gray-500">
                          {m.job?.suburb_city}, {m.job?.state}
                        </p>
                        <Button className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl">
                          View Full Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : recommendations.length === 0 ? (
              <p className="text-center text-gray-600 mt-10">No recommendations found.</p>
            ) : (
              recommendations.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={r.job?.employer?.profile_photo || "/placeholder.png"}
                      alt={r.job?.employer?.company_name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">
                        {r.job?.employer?.company_name}
                      </h2>
                      <p className="text-sm text-gray-600">{r.job?.description}</p>
                      <p className="text-xs text-gray-500">
                        {r.job?.suburb_city}, {r.job?.state}
                      </p>
                      <span className="block mt-2 text-sm font-semibold text-orange-600">
                        Match Score: {r.match_score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;

