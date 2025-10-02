// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchEmployer {
  job_id: number;
  id: string; // employer id
  role: string;
  company: string;
  industry: string;
  location: string;
  salary_range: string;
  employment_type: string;
  description?: string;
  profileImage: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
  isLiked?: boolean;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchEmployer[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fix Supabase storage image URL
  const getPhotoUrl = (path: string | null) => {
    if (!path) return "/placeholder.png";
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile_photos/${path}`;
  };

  // ✅ Fetch Matches
  useEffect(() => {
    if (!whvId) return;
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          job_id,
          matched_at,
          job:job (
            job_id,
            role,
            industry,
            salary_range,
            employment_type,
            description,
            state,
            suburb_city,
            postcode,
            employer:employer (
              user_id,
              company_name,
              profile_photo
            )
          )
        `)
        .eq("whv_id", whvId)
        .not("matched_at", "is", null);

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const formatted =
        data?.map((m: any) => ({
          job_id: m.job?.job_id,
          id: m.job?.employer?.user_id,
          role: m.job?.role,
          company: m.job?.employer?.company_name,
          industry: m.job?.industry,
          location: `${m.job?.suburb_city}, ${m.job?.state} ${m.job?.postcode}`,
          salary_range: m.job?.salary_range,
          employment_type: m.job?.employment_type,
          description: m.job?.description,
          profileImage: getPhotoUrl(m.job?.employer?.profile_photo),
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
        .from("vw_maker_match_scores_top10") // view you showed earlier
        .select("*")
        .eq("maker_id", whvId)
        .order("match_score", { ascending: false });

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      const formatted =
        data?.map((r: any) => ({
          job_id: r.job_id,
          id: r.emp_id,
          role: r.role,
          company: r.company,
          industry: r.industry,
          location: r.location,
          salary_range: r.salary_range,
          employment_type: r.employment_type,
          description: r.description,
          profileImage: getPhotoUrl(r.profile_photo),
          matchPercentage: Math.round(r.match_score),
        })) ?? [];

      setTopRecommended(formatted);
    };

    fetchTopRecommended();
  }, [whvId]);

  // ✅ Like / Unlike
  const handleLikeJob = async (jobId: number, role: string) => {
    if (!whvId) return;
    try {
      await supabase.from("likes").insert({
        liker_id: whvId,
        liker_type: "whv",
        liked_job_post_id: jobId,
      });
      setLikedJobTitle(role);
      setShowLikeModal(true);
    } catch (err) {
      console.error("Error liking job:", err);
    }
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedJobTitle("");
  };

  const currentEmployers = activeTab === "matches" ? matches : topRecommended;

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
              <h1 className="text-lg font-semibold text-gray-900">Explore Matches</h1>
            </div>

            {/* Tabs */}
            <div className="px-6 mt-2 flex gap-2">
              <Button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 h-10 rounded-full text-sm font-medium ${
                  activeTab === "matches"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Matches
              </Button>
              <Button
                onClick={() => setActiveTab("topRecommended")}
                className={`flex-1 h-10 rounded-full text-sm font-medium ${
                  activeTab === "topRecommended"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Top Recommended
              </Button>
            </div>

            {/* Cards */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {currentEmployers.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No employers found.</p>
                </div>
              ) : (
                currentEmployers.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4 relative"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={job.profileImage}
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
                            {job.employment_type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {job.salary_range}
                          </span>
                        </div>

                        {job.isMutualMatch && (
                          <p className="text-xs text-orange-500 font-medium mt-2">
                            Mutual Match
                          </p>
                        )}

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                            View Details
                          </Button>
                          <button
                            onClick={() => handleLikeJob(job.job_id, job.role)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart size={20} className="text-orange-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Match Score for Top Recommended */}
                    {!job.isMutualMatch && job.matchPercentage && (
                      <span className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                        {job.matchPercentage}% Match
                      </span>
                    )}
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
              onClose={handleCloseLikeModal}
              isVisible={showLikeModal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
