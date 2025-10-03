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
  industries: string[];
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

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCandidate[]>([]);

  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [employerId, setEmployerId] = useState<string | null>(null);

  // ---------- helpers ----------
  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/default-avatar.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  const buildExperience = (exp: any): string => {
    if (!Array.isArray(exp) || exp.length === 0) return "No experience listed";
    return exp
      .map((e: any) => `${e?.industry || "Unknown"}: ${e?.years || 0} yrs`)
      .join(", ");
  };

  // ---------- auth ----------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

  // ---------- job posts ----------
  useEffect(() => {
    if (!employerId) return;
    (async () => {
      const { data, error } = await supabase
        .from("job")
        .select("job_id, description, industry_role(role)")
        .eq("user_id", employerId)
        .eq("job_status", "active");

      if (!error && data) setJobPosts(data);
    })();
  }, [employerId]);

  // ---------- fetch matches ----------
  useEffect(() => {
    if (!selectedJobId || !employerId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_matches", {
        p_job_id: selectedJobId,
      });

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const formatted: MatchCandidate[] =
        (data || []).map((m: any) => ({
          id: String(m.maker_id || m.whv_id || m.user_id),
          name: m.given_name ?? "Unknown",
          profileImage: resolvePhoto(m.profile_photo as string),
          preferredLocations: Array.isArray(m.state_pref)
            ? (m.state_pref as unknown[]).map((s) => String(s))
            : [],
          industries: Array.isArray(m.industry_pref)
            ? (m.industry_pref as unknown[]).map((s) => String(s))
            : [],
          experiences: buildExperience(m.work_experience),
          isMutualMatch: true,
        })) ?? [];

      setMatches(formatted);
    })();
  }, [selectedJobId, employerId]);

  // ---------- fetch top recommended ----------
  useEffect(() => {
    if (!selectedJobId || !employerId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_recommendations", {
        p_job_id: selectedJobId,
      });

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      // Get all likes for this employer and job
      const { data: likesData } = await supabase
        .from("likes")
        .select("liked_whv_id")
        .eq("liker_id", employerId)
        .eq("liker_type", "employer")
        .eq("liked_job_post_id", selectedJobId);

      const likedIds = new Set(likesData?.map(l => l.liked_whv_id) || []);

      const formatted: MatchCandidate[] =
        (data || []).map((r: any) => ({
          id: String(r.maker_id || r.whv_id || r.user_id),
          name: r.given_name ?? "Unknown",
          profileImage: resolvePhoto(r.profile_photo as string),
          preferredLocations: Array.isArray(r.state_pref)
            ? (r.state_pref as unknown[]).map((s) => String(s))
            : [],
          industries: Array.isArray(r.industry_pref)
            ? (r.industry_pref as unknown[]).map((s) => String(s))
            : [],
          experiences: buildExperience(r.work_experience),
          matchPercentage: r.match_score ? Math.round(Number(r.match_score)) : undefined,
          isLiked: likedIds.has(String(r.maker_id || r.whv_id || r.user_id)),
        })) ?? [];

      setTopRecommended(formatted);
    })();
  }, [selectedJobId, employerId]);

  const handleViewProfile = (id: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/full-candidate-profile/${id}`
      : `/short-candidate-profile/${id}`;
    navigate(`${route}?from=employer-matches&tab=${activeTab}`);
  };

  const handleLike = async (candidate: MatchCandidate) => {
    if (!employerId || !selectedJobId || candidate.isLiked) return;

    setLikedCandidateName(candidate.name);
    setShowLikeModal(true);

    const { error } = await supabase.from("likes").insert({
      liker_id: employerId,
      liker_type: "employer",
      liked_whv_id: candidate.id,
      liked_job_post_id: selectedJobId,
    });

    if (error) {
      console.error("Error liking candidate:", error);
    } else {
      // Update local state to mark as liked
      if (activeTab === "topRecommended") {
        setTopRecommended(prev => 
          prev.map(c => c.id === candidate.id ? { ...c, isLiked: true } : c)
        );
      }
    }
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
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
              Matches & Recommendations
            </h1>
          </div>

          {/* Job Post Selector */}
          <div className="px-4 py-3">
            <Select
              onValueChange={(value) => setSelectedJobId(Number(value))}
              value={selectedJobId ? String(selectedJobId) : ""}
            >
              <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                <SelectValue placeholder="Select an active job post" />
              </SelectTrigger>
              <SelectContent>
                {jobPosts.map((job) => (
                  <SelectItem key={job.job_id} value={String(job.job_id)}>
                    {job.industry_role?.role || "Unknown Role"} –{" "}
                    {job.description || `Job #${job.job_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 flex-shrink-0">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "matches" ? "bg-slate-800 text-white" : "text-gray-600"
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

          {/* Candidate List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
            {!selectedJobId ? (
              <div className="text-center text-gray-600 mt-10">
                <p>Please select a job post above to view matches and recommendations.</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>No candidates found for this job yet.</p>
              </div>
            ) : (
              currentList.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex gap-3 items-start">
                    <img
                      src={c.profileImage}
                      alt={c.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {c.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        <strong>Preferred Locations:</strong>{" "}
                        {c.preferredLocations.length > 0
                          ? c.preferredLocations.join(", ")
                          : "Not specified"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Preferred Industries:</strong>{" "}
                        {c.industries.length > 0 ? c.industries.join(", ") : "No preferences"}
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
                            disabled={c.isLiked}
                            className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${
                              c.isLiked 
                                ? 'bg-orange-500 border-2 border-orange-500 cursor-not-allowed' 
                                : 'bg-white border-2 border-orange-200 hover:bg-orange-50'
                            }`}
                          >
                            <Heart 
                              size={18} 
                              className={c.isLiked ? "text-white fill-white" : "text-orange-500"}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                    {c.matchPercentage && !c.isMutualMatch && (
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
