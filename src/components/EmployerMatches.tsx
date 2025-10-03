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

  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCandidate[]>([]);
  const [employerId, setEmployerId] = useState<string | null>(null);

  const currentJobId = 1; // TODO: make dynamic

  // ✅ Get logged-in employer UUID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  // ✅ Pick tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (tab === "matches" || tab === "topRecommended") {
      setActiveTab(tab as "matches" | "topRecommended");
    }
  }, [location.search]);

  // ✅ Fetch mutual matches for this employer + job
  useEffect(() => {
    if (!employerId) return;

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
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
        `)
        .eq("employer_id", employerId)
        .eq("job_post_id", currentJobId)   // ✅ only for this job
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

      setMatches(formatted);
    };

    fetchMatches();
  }, [employerId, currentJobId]);

  // ✅ Fetch top recommended + preload liked state
  useEffect(() => {
    if (!employerId) return;

    const fetchTopRecommended = async () => {
      const { data: recs, error } = await supabase
        .from("matching_score")
        .select(`
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
        `)
        .eq("job_id", currentJobId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (error || !recs) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      // employer likes
      const { data: likes } = await supabase
        .from("likes")
        .select("liked_whv_id")
        .eq("liker_id", employerId)
        .eq("liker_type", "employer")
        .eq("liked_job_post_id", currentJobId);

      const likedIds = likes?.map((l) => l.liked_whv_id) || [];

      const formatted: MatchCandidate[] = recs.map((r: any) => ({
        id: r.whv?.user_id,
        name: r.whv?.given_name,
        country: r.whv?.nationality,
        profileImage: r.whv?.profile_photo,
        location: r.whv?.current_location,
        availability: r.whv?.availability,
        matchPercentage: Math.round(r.match_score),
        isLiked: likedIds.includes(r.whv?.user_id || r.whv_id), // ✅ preload
      }));

      setTopRecommended(formatted);
    };

    fetchTopRecommended();
  }, [currentJobId, employerId]);

  // ✅ Toggle like/unlike
  const handleLike = async (candidate: MatchCandidate) => {
    if (!candidate.id || !employerId) return;

    try {
      if (candidate.isLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liker_type", "employer")
          .eq("liked_whv_id", candidate.id)
          .eq("liked_job_post_id", currentJobId);

        setTopRecommended((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, isLiked: false } : c))
        );
      } else {
        // Like
        await supabase.from("likes").insert({
          liker_id: employerId,
          liker_type: "employer",
          liked_whv_id: candidate.id,
          liked_job_post_id: currentJobId,
        });

        setTopRecommended((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, isLiked: true } : c))
        );

        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleViewProfile = (id: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/full-candidate-profile/${id}`
      : `/short-candidate-profile/${id}`;
    navigate(`${route}?from=employer-matches&tab=${activeTab}`);
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-2"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0">
            <button onClick={() => navigate("/employer/dashboard")}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-sm font-medium text-gray-700 flex-1 text-center">
              Matches & Top Recommended WHV Candidates
            </h1>
          </div>

          {/* Tabs */}
          <div className="px-4 py-4 flex-shrink-0">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "matches"
                    ? "bg-slate-800 text-white"
                    : "text-gray-600"
                }`}
              >
                Matches
              </button>
              <button
                onClick={() => setActiveTab("topRecommended")}
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "topRecommended"
                    ? "bg-slate-800 text-white"
                    : "text-gray-600"
                }`}
              >
                Top Recommended
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
            {currentList.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg p-4 shadow-sm border"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={c.profileImage}
                    alt={c.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    {c.skills && (
                      <p className="text-sm text-gray-600">
                        {c.skills.join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">{c.location}</p>
                    <p className="text-sm text-gray-600">{c.availability}</p>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        onClick={() => handleViewProfile(c.id, c.isMutualMatch)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm h-10 rounded-full"
                      >
                        {c.isMutualMatch ? "View Full Profile" : "View Profile"}
                      </Button>
                      {!c.isMutualMatch && (
                        <button
                          onClick={() => handleLike(c)}
                          className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700"
                        >
                          <Heart
                            size={16}
                            strokeWidth={2}
                            className={c.isLiked ? "text-red-500" : "text-white"}
                            fill={c.isLiked ? "currentColor" : "none"} // ✅ proper fill inside
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
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t rounded-b-[48px] flex-shrink-0">
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
