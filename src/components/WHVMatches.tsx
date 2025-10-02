// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchCard {
  job_id: number;
  emp_id: string;
  company: string;
  profile_photo: string;
  role: string;
  industry: string;
  location: string;
  salary_range?: string;
  job_type?: string;
  description?: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
  start_date?: string;
}

const WHVMatches: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch Matches via RPC
  useEffect(() => {
    if (!whvId) return;

    const fetchMatches = async () => {
      const { data, error } = await supabase.rpc("fetch_whv_matches", {
        p_whv_id: whvId,
      });

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const mapped: MatchCard[] = (data as any[])?.map((m: any) => ({
        job_id: m.job_id,
        emp_id: m.emp_id,
        company: m.company || "Employer not listed",
        profile_photo: m.profile_photo || "/placeholder.png",
        role: m.role || "Role not specified",
        industry: m.industry || "General",
        location: `${m.suburb_city || ""}, ${m.state || ""} ${m.postcode || ""}`,
        salary_range: m.salary_range || "Pay not disclosed",
        job_type: m.job_type || "Employment type not specified",
        description: m.description || "No description provided",
        start_date: m.start_date,
        isMutualMatch: true,
      })) ?? [];

      setMatches(mapped);
    };

    fetchMatches();
  }, [whvId]);

  // ✅ Fetch Top Recommended via RPC
  useEffect(() => {
    if (!whvId) return;

    const fetchTopRecommended = async () => {
      const { data, error } = await supabase.rpc("fetch_whv_recommendations", {
        p_whv_id: whvId,
      });

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      const mapped: MatchCard[] = (data as any[])?.map((r: any) => ({
        job_id: r.job_id,
        emp_id: r.emp_id,
        company: r.company || "Employer not listed",
        profile_photo: r.profile_photo || "/placeholder.png",
        role: r.role || "Role not specified",
        industry: r.industry || "General",
        location: `${r.suburb_city || ""}, ${r.state || ""} ${r.postcode || ""}`,
        salary_range: r.salary_range || "Pay not disclosed",
        job_type: r.job_type || "Employment type not specified",
        description: r.description || "No description provided",
        start_date: r.start_date,
        matchPercentage: Math.round(r.match_score || 0),
      })) ?? [];

      setTopRecommended(mapped);
    };

    fetchTopRecommended();
  }, [whvId]);

  // ✅ Like/unlike employer job
  const handleLikeJob = async (job: MatchCard) => {
    if (!whvId) return;

    setLikedEmployerName(job.company);
    setShowLikeModal(true);

    try {
      await supabase.from("likes").insert({
        liker_id: whvId,
        liker_type: "whv",
        liked_job_post_id: job.job_id,
        liked_whv_id: null,
      });
    } catch (err) {
      console.error("Error liking job:", err);
    }
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedEmployerName("");
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

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
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeTab === "matches" ? "Matches" : "Top Recommended"}
              </h1>
            </div>

            {/* Tabs */}
            <div className="px-6 mt-3">
              <div className="flex bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setActiveTab("matches")}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium ${
                    activeTab === "matches"
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Matches
                </button>
                <button
                  onClick={() => setActiveTab("topRecommended")}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium ${
                    activeTab === "topRecommended"
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Top Recommended
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {currentList.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No employers found.</p>
                </div>
              ) : (
                currentList.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={job.profile_photo}
                        alt={job.company}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">{job.role}</h2>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.industry}
                        </p>
                        <p className="text-sm text-gray-500">{job.location}</p>
                        <p className="text-sm text-gray-500">Start: {job.start_date || "N/A"}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {job.job_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {job.salary_range}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                            {job.isMutualMatch ? "View Full Profile" : "View Profile"}
                          </Button>
                          {!job.isMutualMatch && (
                            <button
                              onClick={() => handleLikeJob(job)}
                              className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                            >
                              <Heart size={20} className="text-orange-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Match % (only for Top Recommended) */}
                      {!job.isMutualMatch && job.matchPercentage && (
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-lg font-bold text-orange-500">
                            {job.matchPercentage}%
                          </div>
                          <div className="text-xs font-semibold text-orange-500">Match</div>
                        </div>
                      )}
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

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={likedEmployerName}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
