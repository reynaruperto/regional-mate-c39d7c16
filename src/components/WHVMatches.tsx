// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchEmployer {
  id: string;
  name: string;
  tagline?: string;
  country: string;
  location: string;
  availability: string;
  profileImage: string;
  salary?: string;
  jobType?: string;
  description?: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchEmployer[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  // ✅ Get logged-in WHV user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Tab switch from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (tab === "matches" || tab === "topRecommended") {
      setActiveTab(tab as "matches" | "topRecommended");
    }
  }, [location.search]);

  // ✅ Fetch Matches
  useEffect(() => {
    if (!whvId) return;

    const fetchMatches = async () => {
      const { data, error } = await (supabase as any)
        .from("matches")
        .select(`
          job_id,
          matched_at,
          job:job (
            job_id,
            description,
            salary_range,
            employment_type,
            suburb_city,
            state,
            start_date,
            employer:employer!job_user_id_fkey (
              user_id,
              company_name,
              tagline,
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
          id: m.job?.employer?.user_id,
          name: m.job?.employer?.company_name,
          tagline: m.job?.employer?.tagline,
          profileImage: m.job?.employer?.profile_photo || "/placeholder.png",
          location: `${m.job?.suburb_city || ""}, ${m.job?.state || ""}`,
          availability: `Start Date ${m.job?.start_date || "TBA"}`,
          salary: m.job?.salary_range,
          jobType: m.job?.employment_type,
          description: m.job?.description,
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
      const { data, error } = await (supabase as any)
        .from("matching_score")
        .select(`
          job_id,
          match_score,
          job:job (
            job_id,
            description,
            salary_range,
            employment_type,
            suburb_city,
            state,
            start_date,
            employer:employer!job_user_id_fkey (
              user_id,
              company_name,
              tagline,
              profile_photo
            )
          )
        `)
        .eq("whv_id", whvId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }

      const formatted =
        data?.map((r: any) => ({
          id: r.job?.employer?.user_id,
          name: r.job?.employer?.company_name,
          tagline: r.job?.employer?.tagline,
          profileImage: r.job?.employer?.profile_photo || "/placeholder.png",
          location: `${r.job?.suburb_city || ""}, ${r.job?.state || ""}`,
          availability: `Start Date ${r.job?.start_date || "TBA"}`,
          salary: r.job?.salary_range,
          jobType: r.job?.employment_type,
          description: r.job?.description,
          matchPercentage: Math.round(r.match_score),
        })) ?? [];

      setTopRecommended(formatted);
    };

    fetchTopRecommended();
  }, [whvId]);

  // ✅ Like handler
  const handleLikeEmployer = async (employer: MatchEmployer) => {
    if (!whvId) return;
    setLikedEmployerName(employer.name);
    setShowLikeModal(true);

    const { error } = await supabase.from("likes").insert([
      {
        liker_id: whvId,
        liker_type: "whv",
        liked_job_post_id: employer.id, // use job id for consistency
      },
    ]);

    if (error) console.error("Error liking employer:", error);
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedEmployerName("");
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
              <h1 className="text-lg font-semibold text-gray-900">
                Explore Matches & Top Recommended
              </h1>
            </div>

            {/* Tabs */}
            <div className="px-6 py-2 flex gap-2">
              <Button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 ${
                  activeTab === "matches"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 border"
                }`}
              >
                Matches
              </Button>
              <Button
                onClick={() => setActiveTab("topRecommended")}
                className={`flex-1 ${
                  activeTab === "topRecommended"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 border"
                }`}
              >
                Top Recommended
              </Button>
            </div>

            {/* Employers list */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {currentEmployers.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No employers found for this tab.</p>
                </div>
              ) : (
                currentEmployers.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4 relative"
                  >
                    {/* Match % top right */}
                    {!e.isMutualMatch && e.matchPercentage && (
                      <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold">
                        {e.matchPercentage}% Match
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <img
                        src={e.profileImage}
                        alt={e.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        onError={(ev) => {
                          (ev.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900">{e.name}</h2>
                        <p className="text-sm text-gray-600">
                          {e.tagline || ""} • {e.jobType || ""}
                        </p>
                        <p className="text-sm text-gray-500">{e.salary || ""}</p>
                        <p className="text-sm text-gray-500">{e.location}</p>

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {e.description || ""}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                            View Details
                          </Button>
                          <button
                            onClick={() => handleLikeEmployer(e)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart size={20} className="text-orange-500" />
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
              candidateName={likedEmployerName}
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
