// src/pages/EmployerMatches.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import CandidateCard from "@/components/CandidateCard"; // ✅ shared card
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
  profileImage: string;
  location: string;
  availability: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const EmployerMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCandidate[]>([]);

  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const employerId = "CURRENT_EMPLOYER_UUID"; // TODO: replace with logged-in employer’s id

  // 🔹 Fetch employer job posts
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

  // 🔹 Fetch matches
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
      setMatches(
        (data || []).map((m: any) => ({
          id: m.maker_id,
          name: m.given_name,
          country: m.country,
          profileImage: m.profile_photo,
          location: m.location,
          availability: m.availability,
          isMutualMatch: true,
        }))
      );
    })();
  }, [selectedJobId]);

  // 🔹 Fetch top recommended
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
      setTopRecommended(
        (data || []).map((r: any) => ({
          id: r.maker_id,
          name: r.given_name,
          country: r.country,
          profileImage: r.profile_photo,
          location: r.location,
          availability: r.availability,
          matchPercentage: Math.round(r.match_score),
        }))
      );
    })();
  }, [selectedJobId]);

  const handleViewProfile = (id: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/full-candidate-profile/${id}`
      : `/short-candidate-profile/${id}`;
    navigate(`${route}?from=employer-matches&tab=${activeTab}`);
  };

  const handleLike = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;

    const candidate = [...matches, ...topRecommended].find((c) => c.id === candidateId);
    if (!candidate) return;

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
              Matches & Recommendations
            </h1>
          </div>

          {/* Job Selector */}
          <div className="px-4 py-4">
            <Select
              onValueChange={(value) => setSelectedJobId(Number(value))}
              value={selectedJobId ? String(selectedJobId) : ""}
            >
              <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                <SelectValue placeholder="Select a job post" />
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
                  activeTab === "topRecommended" ? "bg-slate-800 text-white" : "text-gray-600"
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
                <p>Please select a job post above to view candidates.</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>No candidates yet for this job.</p>
              </div>
            ) : (
              currentList.map((c) => (
                <CandidateCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  profileImage={c.profileImage}
                  location={c.location}
                  availability={c.availability}
                  isMutualMatch={c.isMutualMatch}
                  matchPercentage={c.matchPercentage}
                  onViewProfile={handleViewProfile}
                  onLike={handleLike}
                />
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
