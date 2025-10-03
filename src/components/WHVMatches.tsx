// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchCard {
  job_id: number;
  emp_id: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  profile_photo: string;
  salary_range: string;
  employment_type: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Preserve tab when navigating back
  const defaultTab = (location.state as any)?.tab || "matches";
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">(defaultTab);

  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch Matches
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
      const formatted: MatchCard[] =
        data?.map((m: any) => ({
          job_id: m.job_id,
          emp_id: m.emp_id,
          company: m.company,
          role: m.role,
          industry: m.industry,
          location: `${m.suburb_city}, ${m.state} ${m.postcode}`,
          profile_photo: m.profile_photo || "/placeholder.png",
          salary_range: m.salary_range,
          employment_type: m.employment_type,
          isMutualMatch: true,
        })) ?? [];
      setMatches(formatted);
    };
    fetchMatches();
  }, [whvId]);

  // ✅ Fetch Top Recommended
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
      const formatted: MatchCard[] =
        data?.map((r: any) => ({
          job_id: r.job_id,
          emp_id: r.emp_id,
          company: r.company,
          role: r.role,
          industry: r.industry,
          location: `${r.suburb_city}, ${r.state} ${r.postcode}`,
          profile_photo: r.profile_photo || "/placeholder.png",
          salary_range: r.salary_range,
          employment_type: r.employment_type,
          matchPercentage: Math.round(r.match_score),
        })) ?? [];
      setTopRecommended(formatted);
    };
    fetchTopRecommended();
  }, [whvId]);

  const currentEmployers = activeTab === "matches" ? matches : topRecommended;

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
              onClick={() => navigate("/whv/dashboard")}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Matches & Recommendations
            </h1>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 flex bg-gray-100 rounded-full mx-6 my-2">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                activeTab === "matches"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab("topRecommended")}
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                activeTab === "topRecommended"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Top Recommended
            </button>
          </div>

          {/* List */}
          <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
            {currentEmployers.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>No employers found.</p>
              </div>
            ) : (
              currentEmployers.map((e) => (
                <div
                  key={e.job_id}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={e.profile_photo}
                      alt={e.company}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      onError={(ev) => {
                        (ev.currentTarget as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900">{e.role}</h2>
                      <p className="text-sm text-gray-600">
                        {e.company} • {e.industry}
                      </p>
                      <p className="text-sm text-gray-500">{e.location}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {e.employment_type}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {e.salary_range}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        {e.isMutualMatch ? (
                          <Button
                            className="flex-1 bg-[#1E293B] hover:bg-[#0f172a] text-white h-11 rounded-xl"
                            onClick={() =>
                              navigate(`/whv/employer-profile/${e.emp_id}`, {
                                state: { from: "matches" },
                              })
                            }
                          >
                            View Full Profile
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 bg-[#1E293B] hover:bg-[#0f172a] text-white h-11 rounded-xl"
                            onClick={() =>
                              navigate(`/whv/job/${e.job_id}`, {
                                state: { from: "topRecommended" },
                              })
                            }
                          >
                            View Profile
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Match % only for recommendations */}
                    {e.matchPercentage && (
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-lg font-bold text-orange-500">
                          {e.matchPercentage}%
                        </div>
                        <div className="text-xs font-semibold text-orange-500">
                          Match
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Modal (still here if needed later) */}
          <LikeConfirmationModal
            candidateName={likedEmployerName}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
