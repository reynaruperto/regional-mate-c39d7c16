// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";

interface Employer {
  user_id: string;
  company_name: string;
  profile_photo: string | null;
  suburb_city: string;
  state: string;
  tagline?: string;
}

interface Job {
  job_id: number;
  description: string;
  salary_range: string;
  employment_type: string;
  suburb_city: string;
  state: string;
}

interface Match {
  job_post_id: number;
  employer_id: string;
  matched_at: string;
  employer?: Employer;
  job?: Job;
}

interface Recommendation {
  job_id: number;
  match_score: number;
  job?: Job;
  employer?: Employer;
}

const WHVMatches: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matches" | "recommended">("matches");
  const [whvId, setWhvId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // ✅ Get logged-in WHV ID
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

    // Step 1: raw matches
    const { data: rawMatches, error } = await supabase
      .from("matches")
      .select("job_post_id, employer_id, matched_at")
      .eq("whv_id", whvId);

    if (error) {
      console.error("Error fetching matches:", error);
      return;
    }
    if (!rawMatches || rawMatches.length === 0) {
      setMatches([]);
      return;
    }

    // Step 2: fetch jobs
    const jobIds = rawMatches.map(m => m.job_post_id);
    const { data: jobs } = await supabase
      .from("job")
      .select("job_id, description, salary_range, employment_type, suburb_city, state")
      .in("job_id", jobIds);

    // Step 3: fetch employers
    const employerIds = rawMatches.map(m => m.employer_id);
    const { data: employers } = await supabase
      .from("employer")
      .select("user_id, company_name, profile_photo, suburb_city, state, tagline")
      .in("user_id", employerIds);

    // Step 4: merge
    const merged = rawMatches.map(m => {
      const job = jobs?.find(j => j.job_id === m.job_post_id);
      const employer = employers?.find(e => e.user_id === m.employer_id);
      return { ...m, job, employer };
    });

    setMatches(merged);
  };

  // ✅ Fetch Recommendations
  const fetchRecommendations = async () => {
    if (!whvId) return;

    // Step 1: raw recommendations
    const { data: rawRecs, error } = await supabase
      .from("matching_score")
      .select("job_id, match_score")
      .eq("whv_id", whvId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recommendations:", error);
      return;
    }
    if (!rawRecs || rawRecs.length === 0) {
      setRecommendations([]);
      return;
    }

    // Step 2: fetch jobs
    const jobIds = rawRecs.map(r => r.job_id);
    const { data: jobs } = await supabase
      .from("job")
      .select("job_id, description, salary_range, employment_type, suburb_city, state, user_id")
      .in("job_id", jobIds);

    // Step 3: fetch employers
    const employerIds = jobs?.map(j => j.user_id) || [];
    const { data: employers } = await supabase
      .from("employer")
      .select("user_id, company_name, profile_photo, suburb_city, state, tagline")
      .in("user_id", employerIds);

    // Step 4: merge
    const merged = rawRecs.map(r => {
      const job = jobs?.find(j => j.job_id === r.job_id);
      const employer = employers?.find(e => e.user_id === job?.user_id);
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
            <div className="flex px-6 mt-2">
              <button
                className={`flex-1 py-3 rounded-full text-sm font-medium ${
                  activeTab === "matches"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setActiveTab("matches")}
              >
                Matches
              </button>
              <button
                className={`flex-1 py-3 rounded-full text-sm font-medium ml-2 ${
                  activeTab === "recommended"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setActiveTab("recommended")}
              >
                Top Recommended
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto mt-4" style={{ paddingBottom: "100px" }}>
              {activeTab === "matches" ? (
                matches.length === 0 ? (
                  <div className="text-center text-gray-600 mt-10">
                    <p>No employers found.</p>
                  </div>
                ) : (
                  matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={m.employer?.profile_photo || "/placeholder.png"}
                          alt={m.employer?.company_name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-gray-900">
                            {m.employer?.company_name || "Unknown Employer"}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {m.employer?.tagline || "No tagline"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {m.employer?.suburb_city}, {m.employer?.state}
                          </p>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                            {m.job?.description || "No job description"}
                          </p>
                          <div className="flex items-center gap-3 mt-4">
                            <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                              View Profile
                            </Button>
                            <button className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200">
                              <Heart size={20} className="text-orange-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : recommendations.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No recommendations found.</p>
                </div>
              ) : (
                recommendations.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={r.employer?.profile_photo || "/placeholder.png"}
                        alt={r.employer?.company_name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">
                          {r.employer?.company_name || "Unknown Employer"}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {r.employer?.tagline || "No tagline"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {r.job?.suburb_city}, {r.job?.state}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {r.job?.employment_type || "Unknown type"}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {r.job?.salary_range || "N/A"}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                            {r.match_score}% Match
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {r.job?.description || "No job description"}
                        </p>
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
