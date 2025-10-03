// src/pages/EmployerMatches.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchCandidate {
  id: string;
  name: string;
  profileImage: string;
  preferredLocations: string[];
  preferredIndustries: string[];
  experiences: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
  isLiked?: boolean;
}

const EmployerMatches: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");

  const [employerId, setEmployerId] = useState<string | null>(null);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCandidate[]>([]);

  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/default-avatar.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  // ---------- Auth ----------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

  // ---------- Job posts ----------
  useEffect(() => {
    if (!employerId) return;
    (async () => {
      const { data } = await supabase
        .from("job")
        .select("job_id, description, industry_role(role)")
        .eq("user_id", employerId)
        .eq("job_status", "active");
      if (data) setJobPosts(data);
    })();
  }, [employerId]);

  // ---------- Likes merging ----------
  const mergeLikes = async (list: MatchCandidate[]) => {
    if (!employerId || !selectedJobId) return list;
    const { data: likes } = await supabase
      .from("likes")
      .select("liked_whv_id")
      .eq("liker_id", employerId)
      .eq("liker_type", "employer")
      .eq("liked_job_post_id", selectedJobId);

    const likedIds = likes?.map((l) => l.liked_whv_id) || [];
    return list.map((c) => ({ ...c, isLiked: likedIds.includes(c.id) }));
  };

  // ---------- Fetch Matches ----------
  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_matches", {
        p_job_id: selectedJobId,
      });
      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }
      const formatted = (data || []).map((m: any) => ({
        id: m.maker_id,
        name: m.given_name,
        profileImage: resolvePhoto(m.profile_photo),
        preferredLocations: m.state_pref || [],
        preferredIndustries: m.industry_pref || [],
        experiences: m.work_experience
          ? m.work_experience.map((we: any) => `${we.industry}: ${we.years} yrs`).join(", ")
          : "No experience listed",
        isMutualMatch: true,
      }));
      setMatches(await mergeLikes(formatted));
    })();
  }, [selectedJobId]);

  // ---------- Fetch Recommendations ----------
  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_recommendations", {
        p_job_id: selectedJobId,
      });
      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }
      const formatted = (data || []).map((r: any) => ({
        id: r.maker_id,
        name: r.given_name,
        profileImage: resolvePhoto(r.profile_photo),
        preferredLocations: r.state_pref || [],
        preferredIndustries: r.industry_pref || [],
        experiences: r.work_experience
          ? r.work_experience.map((we: any) => `${we.industry}: ${we.years} yrs`).join(", ")
          : "No experience listed",
        matchPercentage: Math.round(r.match_score),
      }));
      setTopRecommended(await mergeLikes(formatted));
    })();
  }, [selectedJobId]);

  // ---------- Like/Unlike ----------
  const handleLike = async (candidate: MatchCandidate) => {
    if (!employerId || !selectedJobId) return;
    try {
      if (candidate.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liker_type", "employer")
          .eq("liked_whv_id", candidate.id)
          .eq("liked_job_post_id", selectedJobId);

        if (activeTab === "matches") {
          setMatches((prev) =>
            prev.map((c) => (c.id === candidate.id ? { ...c, isLiked: false } : c))
          );
        } else {
          setTopRecommended((prev) =>
            prev.map((c) => (c.id === candidate.id ? { ...c, isLiked: false } : c))
          );
        }
      } else {
        await supabase.from("likes").insert({
          liker_id: employerId,
          liker_type: "employer",
          liked_whv_id: candidate.id,
          liked_job_post_id: selectedJobId,
        });

        if (activeTab === "matches") {
          setMatches((prev) =>
            prev.map((c) => (c.id === candidate.id ? { ...c, isLiked: true } : c))
          );
        } else {
          setTopRecommended((prev) =>
            prev.map((c) => (c.id === candidate.id ? { ...c, isLiked: true } : c))
          );
        }

        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // ---------- View Profile ----------
  const handleViewProfile = (id: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/full-candidate-profile/${id}`
      : `/short-candidate-profile/${id}`;
    navigate(`${route}?from=employer-matches&tab=${activeTab}`);
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

  // ---------- Dropdown Classes ----------
  const dropdownClasses =
    "w-[var(--radix-select-trigger-width)] max-w-full max-h-40 overflow-y-auto text-sm rounded-xl border bg-white shadow-lg";
  const itemClasses =
    "py-2 px-3 whitespace-normal break-words leading-snug text-sm";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl overflow-hidden">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center">
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

          {/* Job Post Selector (identical to BrowseCandidates) */}
          <div className="px-6 mb-4">
            <Select
              onValueChange={(value) => setSelectedJobId(Number(value))}
              value={selectedJobId ? String(selectedJobId) : ""}
            >
              <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                <SelectValue placeholder="Select an active job post" />
              </SelectTrigger>
              <SelectContent className={dropdownClasses}>
                {jobPosts.map((job) => (
                  <SelectItem
                    key={job.job_id}
                    value={String(job.job_id)}
                    className={itemClasses}
                  >
                    {job.industry_role?.role || "Unknown Role"} –{" "}
                    {job.description || `Job #${job.job_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 flex bg-gray-100 rounded-full mx-6 my-2">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                activeTab === "matches"
                  ? "bg-[#1E293B] text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab("topRecommended")}
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                activeTab === "topRecommended"
                  ? "bg-[#1E293B] text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Top Recommended
            </button>
          </div>

          {/* Candidate list */}
          <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
            {!selectedJobId ? (
              <div className="text-center text-gray-600 mt-10">
                <p>Please select a job post above to view candidates.</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>No candidates found for this job yet.</p>
              </div>
            ) : (
              currentList.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                >
                  <div className="flex gap-3 items-start">
                    <img
                      src={c.profileImage}
                      alt={c.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1 border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{c.name}</h3>
                      <p className="text-sm text-gray-600">
                        <strong>Preferred Locations:</strong>{" "}
                        {c.preferredLocations.join(", ") || "Not specified"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Preferred Industries:</strong>{" "}
                        {c.preferredIndustries.join(", ") || "No preferences"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Experience:</strong> {c.experiences}
                      </p>

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
                        <div className="text-xs font-semibold text-orange-500">Match</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t border-gray-200 rounded-b-[48px] flex-shrink-0">
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
