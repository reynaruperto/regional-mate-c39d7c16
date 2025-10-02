// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchEmployer {
  id: string;
  name: string;
  company?: string;
  industry?: string;
  location: string;
  employmentType?: string;
  salary?: string;
  profileImage: string;
  description?: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">(
    "matches"
  );
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchEmployer[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged-in WHV id
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch Matches
  useEffect(() => {
    const fetchMatches = async () => {
      if (!whvId) return;
      console.log("🔍 Fetching matches for WHV:", whvId);

      const { data, error } = await supabase
        .from("vw_maker_match_scores")
        .select("*")
        .eq("maker_id", whvId);

      if (error) {
        console.error("❌ Error fetching matches:", error);
        return;
      }
      console.log("📦 Matches raw:", data);

      const formatted =
        data?.map((m: any) => ({
          id: m.emp_id,
          name: m.company,
          company: m.company,
          industry: m.industry,
          location: m.location,
          employmentType: m.employment_type,
          salary: m.salary_range,
          description: m.description,
          profileImage: m.profile_photo || "/placeholder.png",
          isMutualMatch: true,
          matchPercentage: Math.round(m.match_score) || undefined,
        })) ?? [];

      setMatches(formatted);
    };

    fetchMatches();
  }, [whvId]);

  // ✅ Fetch Top Recommended
  useEffect(() => {
    const fetchTopRecommended = async () => {
      if (!whvId) return;
      console.log("🔍 Fetching recommendations for WHV:", whvId);

      const { data, error } = await supabase
        .from("vw_maker_match_scores_top10") // you can also use _top5
        .select("*")
        .eq("maker_id", whvId);

      if (error) {
        console.error("❌ Error fetching recommendations:", error);
        return;
      }
      console.log("📦 Raw recommendations:", data);

      const formatted =
        data?.map((r: any) => ({
          id: r.emp_id,
          name: r.company,
          company: r.company,
          industry: r.industry,
          location: r.location,
          employmentType: r.employment_type,
          salary: r.salary_range,
          description: r.description,
          profileImage: r.profile_photo || "/placeholder.png",
          isMutualMatch: false,
          matchPercentage: Math.round(r.match_score) || undefined,
        })) ?? [];

      setTopRecommended(formatted);
    };

    fetchTopRecommended();
  }, [whvId]);

  // ✅ Like Employer
  const handleLikeEmployer = async (employer: MatchEmployer) => {
    if (!whvId) return;
    setLikedEmployerName(employer.name);
    setShowLikeModal(true);

    try {
      const { error } = await supabase.from("likes").insert([
        {
          liker_id: whvId,
          liker_type: "whv",
          liked_whv_id: null,
          liked_job_post_id: employer.id,
        },
      ]);
      if (error) console.error("❌ Error liking employer:", error);
    } catch (err) {
      console.error("Unexpected error liking employer:", err);
    }
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedEmployerName("");
  };

  const currentEmployers = activeTab === "matches" ? matches : topRecommended;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-4 mb-4"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
            <button onClick={() => navigate("/whv/dashboard")}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-sm font-medium text-gray-700 flex-1 text-center">
              Explore Matches & Top Recommended Employers
            </h1>
          </div>

          {/* Tabs */}
          <div className="px-4 py-4">
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

          {/* Employer Cards */}
          <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
            {currentEmployers.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>No employers found.</p>
              </div>
            ) : (
              currentEmployers.map((e) => (
                <div
                  key={e.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={e.profileImage}
                      alt={e.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(ev) =>
                        (ev.currentTarget.src = "/placeholder.png")
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{e.name}</h3>
                      <p className="text-sm text-gray-600">{e.industry}</p>
                      <p className="text-sm text-gray-600">{e.location}</p>
                      <p className="text-sm text-gray-600">{e.employmentType}</p>
                      <p className="text-sm text-gray-600">{e.salary}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          onClick={() =>
                            navigate(`/whv/employer/profile/${e.id}`)
                          }
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-10 rounded-full"
                        >
                          {e.isMutualMatch
                            ? "View Full Profile"
                            : "View Profile"}
                        </Button>
                        {!e.isMutualMatch && (
                          <button
                            onClick={() => handleLikeEmployer(e)}
                            className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-600"
                          >
                            <Heart size={16} className="text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                    {!e.isMutualMatch && e.matchPercentage && (
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

          {/* Bottom Navigation */}
          <div className="bg-white border-t rounded-b-[48px] flex-shrink-0">
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
