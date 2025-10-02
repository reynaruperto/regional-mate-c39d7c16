// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";

interface Employer {
  user_id: string;
  company_name: string;
  tagline: string;
  suburb_city: string;
  state: string;
  postcode: string;
  profile_photo: string | null;
}

interface Job {
  job_id: number;
  description: string;
  salary_range: string;
  employment_type: string;
  start_date: string;
  suburb_city: string;
  state: string;
  postcode: string;
  user_id?: string;
}

interface Match {
  job_post_id: number;
  matched_at: string;
  employer: Employer;
  job: Job;
}

interface Recommendation {
  job_id: number;
  match_score: number;
  job: Job & { employer: Employer };
}

const WHVMatches: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matches" | "recommended">("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged in WHV ID
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
    const { data, error } = await supabase
      .from("matches")
      .select(`
        job_post_id,
        matched_at,
        employer:employer_id (
          user_id,
          company_name,
          tagline,
          suburb_city,
          state,
          postcode,
          profile_photo
        ),
        job:job_post_id (
          job_id,
          description,
          salary_range,
          employment_type,
          start_date,
          suburb_city,
          state,
          postcode
        )
      `)
      .eq("whv_id", whvId)
      .not("matched_at", "is", null);

    if (error) {
      console.error("Error fetching matches:", error);
    } else {
      setMatches(data || []);
    }
  };

  // ✅ Fetch Top Recommendations
  const fetchRecommendations = async () => {
    if (!whvId) return;
    const { data, error } = await supabase
      .from("matching_score")
      .select(`
        job_id,
        match_score,
        job:job_id (
          job_id,
          description,
          salary_range,
          employment_type,
          start_date,
          suburb_city,
          state,
          postcode,
          user_id,
          employer:user_id (
            user_id,
            company_name,
            tagline,
            profile_photo
          )
        )
      `)
      .eq("whv_id", whvId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recommendations:", error);
    } else {
      setRecommendations(data || []);
    }
  };

  useEffect(() => {
    if (whvId) {
      fetchMatches();
      fetchRecommendations();
    }
  }, [whvId]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
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
          <div className="flex justify-center mb-4 px-6">
            <div className="flex w-full bg-gray-200 rounded-full p-1">
              <button
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "matches"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("matches")}
              >
                Matches
              </button>
              <button
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "recommended"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("recommended")}
              >
                Top Recommended
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            {activeTab === "matches" ? (
              matches.length === 0 ? (
                <p className="text-center text-gray-600 mt-10">
                  No employers found.
                </p>
              ) : (
                matches.map((m) => (
                  <div
                    key={m.job_post_id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={m.employer?.profile_photo || "/placeholder.png"}
                        alt={m.employer?.company_name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">
                          {m.employer?.company_name}
                        </h2>
                        <p className="text-sm text-gray-600">{m.employer?.tagline}</p>
                        <p className="text-sm text-gray-500">
                          {m.employer?.suburb_city}, {m.employer?.state} {m.employer?.postcode}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                            View Full Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : recommendations.length === 0 ? (
              <p className="text-center text-gray-600 mt-10">
                No recommendations found.
              </p>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.job_id}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={rec.job?.employer?.profile_photo || "/placeholder.png"}
                      alt={rec.job?.employer?.company_name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900">
                        {rec.job?.employer?.company_name}
                      </h2>
                      <p className="text-sm text-gray-600">{rec.job?.description}</p>
                      <p className="text-sm text-gray-500">
                        {rec.job?.suburb_city}, {rec.job?.state} {rec.job?.postcode}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {rec.job?.employment_type}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {rec.job?.salary_range}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                          {rec.match_score}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                          View Job
                        </Button>
                      </div>
                    </div>
                  </div>
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
