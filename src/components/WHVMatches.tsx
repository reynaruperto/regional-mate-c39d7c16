// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

const WHVMatches: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">(
    "matches"
  );
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch matches (mutual likes)
  const fetchMatches = async () => {
    if (!whvId) return;

    const { data, error } = await supabase
      .from("matches")
      .select(`
        job:job_id (
          job_id,
          role,
          industry,
          location,
          salary_range,
          employment_type,
          description,
          profile_photo,
          company
        ),
        employer:employer_id (
          company_name,
          tagline
        ),
        matched_at
      `)
      .eq("whv_id", whvId)
      .not("matched_at", "is", null);

    if (error) {
      console.error("Error fetching matches:", error);
      return;
    }

    // ✅ Likes check
    const { data: likes } = await supabase
      .from("likes")
      .select("liked_job_post_id")
      .eq("liker_id", whvId)
      .eq("liker_type", "whv");

    const likedIds = likes?.map((l) => l.liked_job_post_id) || [];

    const formatted: MatchCard[] =
      data?.map((m: any) => ({
        job_id: m.job?.job_id,
        company: m.employer?.company_name || "Employer not listed",
        profile_photo: m.job?.profile_photo || "/placeholder.png",
        role: m.job?.role || "Role not specified",
        industry: m.job?.industry || "General",
        location: m.job?.location || "Location not specified",
        salary_range: m.job?.salary_range || "Pay not disclosed",
        job_type: m.job?.employment_type || "Employment type not specified",
        description: m.job?.description || "No description provided",
        isLiked: likedIds.includes(m.job?.job_id),
      })) ?? [];

    setMatches(formatted);
  };

  // ✅ Fetch top recommended (sorted by score)
  const fetchTopRecommended = async () => {
    if (!whvId) return;

    const { data, error } = await supabase
      .from("matching_score")
      .select(`
        job:job_id (
          job_id,
          role,
          industry,
          location,
          salary_range,
          employment_type,
          description,
          profile_photo,
          company
        ),
        match_score
      `)
      .eq("whv_id", whvId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching top recommended:", error);
      return;
    }

    const formatted: MatchCard[] =
      data?.map((m: any) => ({
        job_id: m.job?.job_id,
        company: m.job?.company || "Employer not listed",
        profile_photo: m.job?.profile_photo || "/placeholder.png",
        role: m.job?.role || "Role not specified",
        industry: m.job?.industry || "General",
        location: m.job?.location || "Location not specified",
        salary_range: m.job?.salary_range || "Pay not disclosed",
        job_type: m.job?.employment_type || "Employment type not specified",
        description: m.job?.description || "No description provided",
        isLiked: false,
        matchPercentage: Math.round(m.match_score),
      })) ?? [];

    setTopRecommended(formatted);
  };

  useEffect(() => {
    fetchMatches();
    fetchTopRecommended();
  }, [whvId]);

  // ✅ Like/unlike handler
  const handleLikeJob = async (jobId: number) => {
    if (!whvId) return;
    const job = matches.find((j) => j.job_id === jobId) || topRecommended.find((j) => j.job_id === jobId);
    if (!job) return;

    try {
      if (job.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", whvId)
          .eq("liker_type", "whv")
          .eq("liked_job_post_id", jobId);

        setMatches((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j)));
        setTopRecommended((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j)));
      } else {
        await supabase.from("likes").insert({
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: jobId,
        });

        setMatches((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));
        setTopRecommended((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));

        setLikedJobTitle(job.role);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
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
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                Explore Matches & Top Recommended
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex px-6 mt-4">
              <button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 py-2 text-sm font-medium rounded-full ${
                  activeTab === "matches" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                Matches
              </button>
              <button
                onClick={() => setActiveTab("topRecommended")}
                className={`flex-1 py-2 text-sm font-medium rounded-full ml-2 ${
                  activeTab === "topRecommended" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                Top Recommended
              </button>
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
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
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

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                            View Details
                          </Button>
                          <button
                            onClick={() => handleLikeJob(job.job_id)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={job.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Match % for recommendations */}
                      {job.matchPercentage && (
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-lg font-bold text-orange-500">
                            {job.matchPercentage}%
                          </div>
                          <div className="text-xs font-semibold text-orange-500">Match</div>
                        </div>
                      )}
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
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
