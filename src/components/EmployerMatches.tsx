// src/components/EmployerMatches.tsx
import React, { useEffect, useMemo, useState } from "react";
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

type Tab = "matches" | "topRecommended";

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

const resolvePhoto = (val?: string | null) => {
  if (!val) return "/default-avatar.png";
  if (val.startsWith("http")) return val;
  return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
};

const buildExperience = (workExp: any): string => {
  const arr: any[] = Array.isArray(workExp) ? workExp : [];
  if (!arr.length) return "No experience listed";
  return arr
    .map((we: any) => {
      const ind = we?.industry ?? "Industry";
      const yrs = Number(we?.years ?? 0);
      return `${ind}: ${yrs} ${yrs === 1 ? "year" : "years"}`;
    })
    .join(", ");
};

async function hydrateCandidateFacts(ids: string[]) {
  if (!ids.length) return new Map<string, any>();
  const { data, error } = await supabase
    .from("whv_maker")
    .select("user_id, given_name, profile_photo, state_pref, industry_pref, work_experience")
    .in("user_id", ids);

  if (error || !data) return new Map<string, any>();
  const map = new Map<string, any>();
  data.forEach((r: any) => map.set(r.user_id as string, r));
  return map;
}

const EmployerMatches: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("matches");
  const [employerId, setEmployerId] = useState<string | null>(null);

  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [recommended, setRecommended] = useState<MatchCandidate[]>([]);

  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

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

  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_matches", {
        p_job_id: selectedJobId,
      });
      if (error) {
        console.error("fetch_job_matches error:", error);
        setMatches([]);
        return;
      }

      const ids = Array.from(
        new Set(
          (data || []).map((r: any) => String(r.maker_id || r.whv_id || r.user_id)).filter(Boolean)
        )
      );

      const facts = await hydrateCandidateFacts(ids);

      const formatted: MatchCandidate[] = ids.map((id) => {
        const f = facts.get(id) || {};
        return {
          id,
          name: (f.given_name as string) ?? "Unknown",
          profileImage: resolvePhoto(f.profile_photo as string),
          preferredLocations: Array.isArray(f.state_pref)
            ? (f.state_pref as string[])
            : [],
          industries: Array.isArray(f.industry_pref)
            ? (f.industry_pref as string[])
            : [],
          experiences: buildExperience(f.work_experience),
          isMutualMatch: true,
        };
      });

      setMatches(formatted);
    })();
  }, [selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc("fetch_job_recommendations", {
        p_job_id: selectedJobId,
      });
      if (error) {
        console.error("fetch_job_recommendations error:", error);
        setRecommended([]);
        return;
      }

      const rows = data || [];
      const ids = Array.from(
        new Set(rows.map((r: any) => String(r.maker_id || r.whv_id || r.user_id)).filter(Boolean))
      );

      const facts = await hydrateCandidateFacts(ids);

      const formatted: MatchCandidate[] = rows.map((r: any) => {
        const id = String(r.maker_id || r.whv_id || r.user_id);
        const f = facts.get(id) || {};
        return {
          id,
          name: (f.given_name as string) ?? "Unknown",
          profileImage: resolvePhoto(f.profile_photo as string),
          preferredLocations: Array.isArray(f.state_pref)
            ? (f.state_pref as string[])
            : [],
          industries: Array.isArray(f.industry_pref)
            ? (f.industry_pref as string[])
            : [],
          experiences: buildExperience(f.work_experience),
          matchPercentage: r.match_score ? Math.round(Number(r.match_score)) : undefined,
        };
      });

      setRecommended(formatted);
    })();
  }, [selectedJobId]);

  const handleLike = async (c: MatchCandidate) => {
    if (!employerId || !selectedJobId) return;
    try {
      await supabase.from("likes").insert({
        liker_id: employerId,
        liker_type: "employer",
        liked_whv_id: c.id,
        liked_job_post_id: selectedJobId,
      });
      setLikedCandidateName(c.name);
      setShowLikeModal(true);
    } catch (e) {
      console.error("like error:", e);
    }
  };

  const list = useMemo(
    () => (activeTab === "matches" ? matches : recommended),
    [activeTab, matches, recommended]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50" />
          <div className="w-full h-full flex flex-col relative bg-gray-50">
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

            {/* Job selector */}
            <div className="px-6 mb-4">
              <Select
                onValueChange={(v) => setSelectedJobId(Number(v))}
                value={selectedJobId ? String(selectedJobId) : ""}
              >
                <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                  <SelectValue placeholder="Select an active job post" />
                </SelectTrigger>
                <SelectContent>
                  {jobPosts.map((job) => (
                    <SelectItem key={job.job_id} value={String(job.job_id)}>
                      {job.industry_role?.role || "Role"} —{" "}
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

            {/* Candidate list */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <div className="text-center text-gray-600 mt-10">
                  Please select a job post above to view candidates.
                </div>
              ) : list.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  No candidates found for this job.
                </div>
              ) : (
                list.map((c) => (
                  <div
                    key={c.id}
                    className="relative bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    {/* % badge only for top recommended */}
                    {activeTab === "topRecommended" && c.matchPercentage !== undefined && (
                      <div className="absolute right-4 top-4 text-right">
                        <div className="text-lg font-bold text-orange-500">
                          {c.matchPercentage}%
                        </div>
                        <div className="text-xs font-semibold text-orange-500">Match</div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <img
                        src={c.profileImage}
                        alt={c.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong>{" "}
                          {c.preferredLocations.length
                            ? c.preferredLocations.join(", ")
                            : "Not specified"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong>{" "}
                          {c.industries.length
                            ? c.industries.join(", ")
                            : "No preferences"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Experience:</strong> {c.experiences}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() =>
                              navigate(
                                `${
                                  c.isMutualMatch
                                    ? `/full-candidate-profile/${c.id}`
                                    : `/short-candidate-profile/${c.id}`
                                }?from=employer-matches&tab=${activeTab}`
                              )
                            }
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                          >
                            {c.isMutualMatch ? "View Full Profile" : "View Profile"}
                          </Button>
                          {!c.isMutualMatch && (
                            <button
                              onClick={() => handleLike(c)}
                              className="h-10 w-10 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                            >
                              <Heart size={18} className="text-orange-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
