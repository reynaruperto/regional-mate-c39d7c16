// src/pages/EmployerMatches.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, X } from "lucide-react";
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
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCandidate[]>([]);

  const [employerId, setEmployerId] = useState<string | null>(null);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // ---------- helpers ----------
  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/default-avatar.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  const mapRowsToCandidates = (rows: any[], isMutualMatch = false): MatchCandidate[] =>
    (rows || []).map((row: any) => {
      const workExp = Array.isArray(row.work_experience) ? row.work_experience : [];
      const experiences =
        workExp.length > 0
          ? workExp.map((we: any) => `${we?.industry}: ${we?.years} yrs`).join(", ")
          : "No experience listed";

      return {
        id: row.maker_id,
        name: row.given_name,
        profileImage: resolvePhoto(row.profile_photo),
        preferredLocations: (row.state_pref as string[]) || [],
        preferredIndustries: (row.industry_pref as string[]) || [],
        experiences,
        isMutualMatch,
        matchPercentage: row.match_score ? Math.round(row.match_score) : undefined,
      };
    });

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
        .select("job_id, description, job_status, industry_role(role)")
        .eq("user_id", employerId)
        .eq("job_status", "active");

      if (!error && data) setJobPosts(data);
    })();
  }, [employerId]);

  // ---------- matches ----------
  useEffect(() => {
    if (!employerId || !selectedJobId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_matches", {
        p_job_id: selectedJobId,
      });
      if (!error && data) setMatches(mapRowsToCandidates(data, true));
    })();
  }, [employerId, selectedJobId]);

  // ---------- recommendations ----------
  useEffect(() => {
    if (!employerId || !selectedJobId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_recommendations", {
        p_job_id: selectedJobId,
      });
      if (!error && data) setTopRecommended(mapRowsToCandidates(data, false));
    })();
  }, [employerId, selectedJobId]);

  const handleViewProfile = (id: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/full-candidate-profile/${id}`
      : `/short-candidate-profile/${id}`;
    navigate(`${route}?from=employer-matches&tab=${activeTab}`);
  };

  const handleLike = async (candidate: MatchCandidate) => {
    if (!employerId || !selectedJobId) return;

    setLikedCandidateName(candidate.name);
    setShowLikeModal(true);

    const { error } = await supabase.from("likes").insert({
      liker_id: employerId,
      liker_type: "employer",
      liked_whv_id: candidate.id,
      liked_job_post_id: selectedJobId,
    });

    if (error) console.error("Error liking candidate:", error);
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-2"></div>

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
            <h1 className="text-lg font-semibold text-gray-900">Matches & Recommendations</h1>
          </div>

          {/* Job Selector */}
          <div className="px-6 mb-4">
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
          <div className="px-6 mb-4">
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
                  activeTab === "topRecommended" ? "bg-slate-800 text-white" : "text-gray-600"
                }`}
              >
                Top Recommended
              </button>
            </div>
          </div>

          {/* Candidate List */}
          <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
            {!selectedJobId ? (
              <div className="text-center text-gray-600 mt-10">
                <p>Please select a job post above to view candidates.</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>No candidates found yet for this job.</p>
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
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
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
                            className="h-10 w-10 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={18}
                              className={
                                c.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"
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
