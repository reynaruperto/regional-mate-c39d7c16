// src/pages/EmployerMatches.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, User } from "lucide-react";
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
  country: string;
  profileImage: string | null;
  location: string;
  availability: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
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
  const [loading, setLoading] = useState(false);

  // ---------- auth ----------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

  // ---------- fetch employer’s jobs ----------
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

  // ---------- fetch matches/recs ----------
  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      setLoading(true);
      try {
        // Mutual matches
        const { data: matchRows, error: matchErr } = await (supabase as any).rpc(
          "fetch_job_matches",
          { p_job_id: selectedJobId }
        );
        if (matchErr) console.error(matchErr);
        setMatches(
          (matchRows || []).map((m: any) => ({
            id: m.maker_id,
            name: m.given_name,
            country: m.country,
            profileImage: m.profile_photo,
            location: m.location,
            availability: m.availability,
            isMutualMatch: true,
          }))
        );

        // Recommendations
        const { data: recRows, error: recErr } = await (supabase as any).rpc(
          "fetch_job_recommendations",
          { p_job_id: selectedJobId }
        );
        if (recErr) console.error(recErr);
        setTopRecommended(
          (recRows || []).map((r: any) => ({
            id: r.maker_id,
            name: r.given_name,
            country: r.country,
            profileImage: r.profile_photo,
            location: r.location,
            availability: r.availability,
            matchPercentage: Math.round(r.match_score),
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedJobId]);

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

    await supabase.from("likes").insert({
      liker_id: employerId,
      liker_type: "employer",
      liked_whv_id: candidate.id,
      liked_job_post_id: selectedJobId,
    });
  };

  const currentList = activeTab === "matches" ? matches : topRecommended;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full" />

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
            <h1 className="text-lg font-semibold text-gray-900">Matches</h1>
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
          {selectedJobId && (
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
                    activeTab === "topRecommended" ? "bg-slate-800 text-white" : "text-gray-600"
                  }`}
                >
                  Top Recommended
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
            {!selectedJobId ? (
              <p className="text-center text-gray-600 mt-10">
                Please select a job post above to view matches.
              </p>
            ) : loading ? (
              <p className="text-center text-gray-600 mt-10">Loading...</p>
            ) : currentList.length === 0 ? (
              <p className="text-center text-gray-600 mt-10">No candidates yet.</p>
            ) : (
              currentList.map((c) => (
                <div key={c.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-start gap-3">
                    {c.profileImage ? (
                      <img
                        src={c.profileImage}
                        alt={c.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        <User size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{c.name}</h3>
                      <p className="text-sm text-gray-600">{c.location}</p>
                      <p className="text-sm text-gray-600">{c.availability}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          onClick={() => handleViewProfile(c.id, c.isMutualMatch)}
                          className="flex-1 bg-slate-800 text-white text-sm h-10 rounded-full"
                        >
                          {c.isMutualMatch ? "View Full Profile" : "View Profile"}
                        </Button>
                        {!c.isMutualMatch && (
                          <button
                            onClick={() => handleLike(c)}
                            className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center"
                          >
                            <Heart size={16} className="text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                    {!c.isMutualMatch && c.matchPercentage && (
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-lg font-bold text-orange-500">{c.matchPercentage}%</div>
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
