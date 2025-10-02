// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchCard {
  job_id: number;
  company: string;
  profile_photo: string;
  role: string;
  industry: string;
  location: string;
  salary_range: string;
  job_type: string;
  description?: string;
  isLiked?: boolean;
  matchPercentage?: number;
  isMutualMatch?: boolean;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged-in WHV ID
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
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          job_id,
          matched_at,
          job:job_id (
            job_id,
            role,
            industry,
            salary_range,
            job_type,
            description,
            employer:employer!job_user_id_fkey (
              company_name,
              profile_photo,
              suburb_city,
              state,
              postcode,
              start_date
            )
          )
        `
        )
        .eq("whv_id", whvId)
        .not("matched_at", "is", null);

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const formatted: MatchCard[] =
        data?.map((m: any) => ({
          job_id: m.job?.job_id,
          company: m.job?.employer?.company_name || "Employer not listed",
          profile_photo: m.job?.employer?.profile_photo || "/placeholder.png",
          role: m.job?.role || "Role not specified",
          industry: m.job?.industry || "General",
          location: `${m.job?.employer?.suburb_city || ""}, ${m.job?.employer?.state || ""} ${m.job?.employer?.postcode || ""}`,
          salary_range: m.job?.salary_range || "Pay not disclosed",
          job_type: m.job?.job_type || "Employment type not specified",
          description: m.job?.description || "No description provided",
          isMutualMatch: true,
        })) ?? [];

      setMatches(formatted);
    };

    fetchMatches();
  }, [whvId]);

  // ✅ Fetch Top Recommended
  useEffect(() => {
    if (!whvId) return;

    const fetchTopRecommended = async () => {
      const { data, error } = await supabase
        .from("matching_score")
        .select(
          `
          job_id,
          match_score,
          job:job_id (
            job_id,
            role,
            industry,
            salary_range,
            job_type,
            description,
            employer:employer!job_user_id_fkey (
              company_name,
              profile_photo,
              suburb_city,
              state,
              postcode,
              start_date
            )
          )
        `
        )
        .eq("whv_id", whvId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      const formatted: MatchCard[] =
        data?.map((r: any) => ({
          job_id: r.job?.job_id,
          company: r.job?.employer?.company_name || "Employer not listed",
          profile_photo: r.job?.employer?.profile_photo || "/placeholder.png",
          role: r.job?.role || "Role not specified",
          industry: r.job?.industry || "General",
          location: `${r.job?.employer?.suburb_city || ""}, ${r.job?.employer?.state || ""} ${r.job?.employer?.postcode || ""}`,
          salary_range: r.job?.salary_range || "Pay not disclosed",
          job_type: r.job?.job_type || "Employment type not specified",
          description: r.job?.description || "No description provided",
          matchPercentage: Math.round(r.match_score),
          isMutualMatch: false,
        })) ?? [];

      setTopRecommended(formatted);
    };

    fetchTopRecommended();
  }, [whvId]);

  // ✅ Like Job
  const handleLikeJob = async (job: MatchCard) => {
    if (!whvId) return;

    try {
      if (job.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", job.job_id);

        setTopRecommended((prev) =>
          prev.map((j) => (j.job_id === job.job_id ? { ...j, isLiked: false } : j))
        );
      } else {
        await supabase.from("likes").insert({
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: job.job_id,
          liked_whv_id: null,
        });

        setTopRecommended((prev) =>
          prev.map((j) => (j.job_id === job.job_id ? { ...j, isLiked: true } : j))
        );

        setLikedJobTitle(job.role);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedJobTitle("");
  };

  const currentJobs = activeTab === "matches" ? matches : topRecommended;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate("/whv/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeTab === "matches" ? "Your Matches" : "Top Recommended"}
              </h1>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4">
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

            {/* Jobs */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {currentJobs.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No jobs found.</p>
                </div>
              ) : (
                currentJobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4 relative"
                  >
                    {/* Match Score (Top Recommended only) */}
                    {!job.isMutualMatch && job.matchPercentage && (
                      <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                        {job.matchPercentage}% Match
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <img
                        src={job.profile_photo}
                        alt={job.company}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">{job.role}</h2>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.industry}
                        </p>
                        <p className="text-sm text-gray-500">{job.location}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {job.job_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {job.salary_range}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                          >
                            {job.isMutualMatch ? "View Full Profile" : "View Details"}
                          </Button>
                          {!job.isMutualMatch && (
                            <button
                              onClick={() => handleLikeJob(job)}
                              className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                            >
                              <Heart
                                size={20}
                                className={job.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                              />
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

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={likedJobTitle}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
