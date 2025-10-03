// src/pages/EmployerMatches.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchCandidate {
  id: string;
  name: string;
  country: string;
  profileImage: string;
  location: string;
  availability: string;
  skills?: string[];
  isMutualMatch?: boolean;
  matchPercentage?: number;
  isLiked?: boolean;
}

const EmployerMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">(
    "matches"
  );
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCandidate[]>([]);

  const employerId = "CURRENT_EMPLOYER_UUID"; // TODO: replace with logged-in employer’s id
  const currentJobId = 1; // TODO: replace with context or selected job

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (tab === "matches" || tab === "topRecommended") {
      setActiveTab(tab as "matches" | "topRecommended");
    }
  }, [location.search]);

  // Merge likes into candidates
  const mergeLikes = async (list: MatchCandidate[]) => {
    const { data: likes } = await supabase
      .from("likes")
      .select("liked_whv_id")
      .eq("liker_id", employerId)
      .eq("liker_type", "employer")
      .eq("liked_job_post_id", currentJobId);

    const likedIds = likes?.map((l) => l.liked_whv_id) || [];
    return list.map((c) => ({ ...c, isLiked: likedIds.includes(c.id) }));
  };

  // Fetch mutual matches
  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          whv_id,
          job_post_id,
          matched_at,
          whv:whv_maker (
            user_id,
            given_name,
            nationality,
            profile_photo,
            current_location,
            availability
          )
        `
        )
        .eq("employer_id", employerId)
        .not("matched_at", "is", null);

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const formatted =
        data?.map((m: any) => ({
          id: m.whv?.user_id,
          name: m.whv?.given_name,
          country: m.whv?.nationality,
          profileImage: m.whv?.profile_photo,
          location: m.whv?.current_location,
          availability: m.whv?.availability,
          isMutualMatch: true,
        })) ?? [];

      setMatches(await mergeLikes(formatted));
    };

    fetchMatches();
  }, [employerId]);

  // Fetch top recommended
  useEffect(() => {
    const fetchTopRecommended = async () => {
      const { data, error } = await supabase
        .from("matching_score")
        .select(
          `
          whv_id,
          job_id,
          match_score,
          whv:whv_maker (
            user_id,
            given_name,
            nationality,
            profile_photo,
            current_location,
            availability
          )
        `
        )
        .eq("job_id", currentJobId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      const formatted =
        data?.map((r: any) => ({
          id: r.whv?.user_id,
          name: r.whv?.given_name,
          country: r.whv?.nationality,
          profileImage: r.whv?.profile_photo,
          location: r.whv?.current_location,
          availability: r.whv?.availability,
          matchPercentage: Math.round(r.match_score),
        })) ?? [];

      setTopRecommended(await mergeLikes(formatted));
    };

    fetchTopRecommended();
  }, [currentJobId]);

  const handleViewProfile = (id: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/full-candidate-profile/${id}`
      : `/short-candidate-profile/${id}`;
    navigate(`${route}?from=employer-matches&tab=${activeTab}`);
  };

  const handleLike = async (candidate: MatchCandidate) => {
    try {
      if (candidate.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liker_type", "employer")
          .eq("liked_whv_id", candidate.id)
          .eq("liked_job_post_id", currentJobId);

        if (activeTab === "matches") {
          setMatches((prev) =>
            prev.map((c) =>
              c.id === candidate.id ? { ...c, isLiked: false } : c
            )
          );
        } else {
          setTopRecommended((prev) =>
            prev.map((c) =>
              c.id === candidate.id ? { ...c, isLiked: false } : c
            )
          );
        }
      } else {
        await supabase.from("likes").insert({
          liker_id: employerId,
          liker_type: "employer",
          liked_whv_id: candidate.id,
          liked_job_post_id: currentJobId,
        });

        if (activeTab === "matches") {
          setMatches((prev) =>
            prev.map((c) =>
              c.id === candidate.id ? { ...c, isLiked: true } : c
            )
          );
        } else {
          setTopRecommended((prev) =>
            prev.map((c) =>
              c.id === candidate.id ? { ...c, isLiked: true } : c
            )
          );
        }

        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

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
              onClick={() => navigate("/employer/dashboard")}
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

          {/* Candidate List */}
          <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
            {currentList.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>
                  {activeTab === "matches"
                    ? "No matches found."
                    : "No recommendations available."}
                </p>
              </div>
            ) : (
              currentList.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={c.profileImage}
                      alt={c.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
                      <p className="text-sm text-gray-600">{c.location}</p>
                      <p className="text-sm text-gray-600">{c.availability}</p>

                      <div className="flex items-center gap-3 mt-3">
                        <Button
                          onClick={() => handleViewProfile(c.id, c.isMutualMatch)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                        >
                          {c.isMutualMatch ? "View Full Profile" : "View Profile"}
                        </Button>
                        {!c.isMutualMatch && (
                          <button
                            onClick={() => handleLike(c)}
                            className="h-10 w-10 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={
                                c.isLiked
                                  ? "text-orange-500 fill-orange-500"
                                  : "text-orange-500"
                              }
                            />
                          </button>
                        )}
                      </div>
                    </div>
                    {!c.isMutualMatch && c.matchPercentage && (
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-lg font-bold text-orange-500">
                          {c.matchPercentage}%
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
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          <LikeConfirmationModal
            candidateName={likedCandidateName}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployerMatches;
