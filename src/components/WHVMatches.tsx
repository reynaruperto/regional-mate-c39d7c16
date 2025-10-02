// src/pages/WHVMatches.tsx
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
  country: string;
  location: string;
  availability: string;
  profileImage: string;
  tagline?: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchEmployer[]>([]);
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
  useEffect(() => {
    if (!whvId) return;

    const fetchMatches = async () => {
      console.log("🔍 Fetching matches for WHV:", whvId);

      const { data: rawMatches, error } = await supabase
        .from("matches")
        .select("*")
        .eq("whv_id", whvId);

      if (error) {
        console.error("❌ Error fetching matches:", error);
        return;
      }

      console.log("📦 Matches raw:", rawMatches);

      if (!rawMatches || rawMatches.length === 0) {
        setMatches([]);
        return;
      }

      const enriched = await Promise.all(
        rawMatches.map(async (m) => {
          // Fetch employer
          const { data: employer } = await supabase
            .from("employer")
            .select("user_id, company_name, tagline, suburb_city, state, postcode, profile_photo")
            .eq("user_id", m.employer_id)
            .single();

          // Fetch job
          const { data: job } = await supabase
            .from("job")
            .select("start_date")
            .eq("job_id", m.job_post_id)
            .single();

          return {
            id: employer?.user_id,
            name: employer?.company_name || "Unknown Employer",
            tagline: employer?.tagline || "",
            country: "Australia",
            profileImage: employer?.profile_photo || "/placeholder.png",
            location: `${employer?.suburb_city || ""}, ${employer?.state || ""} ${employer?.postcode || ""}`,
            availability: job?.start_date ? `Start Date ${job.start_date}` : "No start date",
            isMutualMatch: true,
          };
        })
      );

      setMatches(enriched);
    };

    fetchMatches();
  }, [whvId]);

  // ✅ Fetch Top Recommended (currently empty until matching_score has rows)
  useEffect(() => {
    if (!whvId) return;

    const fetchTopRecommended = async () => {
      console.log("🔍 Fetching recommendations for WHV:", whvId);

      const { data: rawRecs, error } = await supabase
        .from("matching_score")
        .select("*")
        .eq("whv_id", whvId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("❌ Error fetching recommendations:", error);
        return;
      }

      console.log("📦 Raw recommendations:", rawRecs);

      if (!rawRecs || rawRecs.length === 0) {
        setTopRecommended([]);
        return;
      }

      const enriched = await Promise.all(
        rawRecs.map(async (r) => {
          const { data: employer } = await supabase
            .from("employer")
            .select("user_id, company_name, suburb_city, state, postcode, profile_photo")
            .eq("user_id", r.employer_id)
            .single();

          return {
            id: employer?.user_id,
            name: employer?.company_name || "Unknown Employer",
            country: "Australia",
            profileImage: employer?.profile_photo || "/placeholder.png",
            location: `${employer?.suburb_city || ""}, ${employer?.state || ""} ${employer?.postcode || ""}`,
            availability: "N/A",
            matchPercentage: Math.round(r.match_score || 0),
          };
        })
      );

      setTopRecommended(enriched);
    };

    fetchTopRecommended();
  }, [whvId]);

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

          {/* Employer List */}
          <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
            {currentEmployers.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                No employers found.
              </div>
            ) : (
              currentEmployers.map((e) => (
                <div key={e.id} className="bg-white p-4 rounded-2xl shadow-sm border">
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
                      {e.tagline && (
                        <p className="text-sm text-gray-600">{e.tagline}</p>
                      )}
                      <p className="text-sm text-gray-600">{e.location}</p>
                      <p className="text-sm text-gray-600">{e.availability}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          onClick={() => navigate(`/whv/employer/profile/${e.id}`)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-10 rounded-full"
                        >
                          {e.isMutualMatch ? "View Full Profile" : "View Profile"}
                        </Button>
                        {!e.isMutualMatch && (
                          <button
                            onClick={() => {
                              setLikedEmployerName(e.name);
                              setShowLikeModal(true);
                            }}
                            className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-600"
                          >
                            <Heart size={16} className="text-white" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* % only for topRecommended */}
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
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
