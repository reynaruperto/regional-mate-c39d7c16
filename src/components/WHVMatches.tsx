// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchCard {
  emp_id: string;
  job_id: number;
  company: string;
  tagline: string;
  profile_photo: string;
  role: string;
  salary_range: string;
  employment_type: string;
  description: string;
  match_score?: number;
  isLiked?: boolean;
  isMutualMatch?: boolean;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");

  // ✅ get logged-in WHV user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ fetch mutual matches
  useEffect(() => {
    if (!whvId) return;

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          whv_id,
          job_post_id,
          matched_at,
          employer:employer_id (
            user_id,
            company_name,
            tagline,
            profile_photo
          ),
          job:job_post_id (
            job_id,
            role,
            salary_range,
            employment_type,
            description
          )
        `)
        .eq("whv_id", whvId) as any;

      if (error) {
        console.error("❌ Error fetching matches:", error);
        return;
      }

      const formatted = (data || []).map((m: any) => ({
        emp_id: m.employer?.user_id,
        job_id: m.job?.job_id,
        company: m.employer?.company_name || "Unknown Employer",
        tagline: m.employer?.tagline || "",
        profile_photo: m.employer?.profile_photo || "/placeholder.png",
        role: m.job?.role || "Unknown Role",
        salary_range: m.job?.salary_range || "N/A",
        employment_type: m.job?.employment_type || "N/A",
        description: m.job?.description || "",
        isMutualMatch: true,
      }));

      // remove duplicates by job_id
      const unique = Array.from(new Map(formatted.map(f => [f.job_id, f])).values());
      setMatches(unique);
    };

    fetchMatches();
  }, [whvId]);

  // ✅ fetch top recommended
  useEffect(() => {
    if (!whvId) return;

    const fetchRecommended = async () => {
      const { data, error } = await supabase
        .from("vw_maker_match_scores_top10") // ✅ use your VIEW
        .select("*")
        .eq("maker_id", whvId)
        .order("match_score", { ascending: false }) as any;

      if (error) {
        console.error("❌ Error fetching recommendations:", error);
        return;
      }

      const formatted = (data || []).map((r: any) => ({
        emp_id: r.emp_id,
        job_id: r.job_id,
        company: r.company || "Unknown Employer",
        tagline: "",
        profile_photo: r.profile_photo || "/placeholder.png",
        role: r.role || "Unknown Role",
        salary_range: r.salary_range || "N/A",
        employment_type: r.employment_type || "N/A",
        description: r.description || "",
        match_score: r.match_score,
      }));

      // sort highest score on top
      const sorted = formatted.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
      setRecommended(sorted);
    };

    fetchRecommended();
  }, [whvId]);

  // ✅ like/unlike
  const handleLikeJob = async (jobId: number, jobRole: string) => {
    if (!whvId) return;

    const job = [...matches, ...recommended].find((j) => j.job_id === jobId);
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
        setRecommended((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: false } : j)));
      } else {
        await supabase.from("likes").insert({
          liker_id: whvId,
          liker_type: "whv",
          liked_job_post_id: jobId,
        });

        setMatches((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));
        setRecommended((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, isLiked: true } : j)));

        setLikedJobTitle(jobRole);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("❌ Error toggling like:", err);
    }
  };

  const currentList = activeTab === "matches" ? matches : recommended;

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
                Explore Matches & Top Recommended
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex px-6 mb-4">
              <button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "matches" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                Matches
              </button>
              <button
                onClick={() => setActiveTab("topRecommended")}
                className={`flex-1 py-2 rounded-full text-sm font-medium ${
                  activeTab === "topRecommended"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Top Recommended
              </button>
            </div>

            {/* Employer Cards */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {currentList.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No employers found.</p>
                </div>
              ) : (
                currentList.map((job) => (
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
                          {job.company} • {job.employment_type}
                        </p>
                        <p className="text-sm text-gray-500">{job.salary_range}</p>

                        {job.match_score && (
                          <p className="text-sm text-orange-600 font-medium mt-1">
                            Match Score: {job.match_score}%
                          </p>
                        )}

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                          >
                            {job.isMutualMatch ? "View Full Profile" : "View Details"}
                          </Button>
                          <button
                            onClick={() => handleLikeJob(job.job_id, job.role)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={job.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
    </div>
  );
};

export default WHVMatches;
