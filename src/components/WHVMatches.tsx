// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface MatchEmployer {
  emp_id: string;
  job_id: number;
  company: string;
  role: string;
  salary_range?: string;
  employment_type?: string;
  description?: string;
  profile_photo?: string;
  match_score?: number; // only for recommended
  isMutualMatch?: boolean;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [recommendations, setRecommendations] = useState<MatchEmployer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // ✅ Matches
      const { data: matchData } = await supabase
        .from("matches")
        .select(`
          whv_id,
          employer_id,
          job_post_id,
          matched_at,
          employer:employer_id (
            company_name,
            profile_photo
          ),
          job:job_post_id (
            role,
            salary_range,
            employment_type,
            description
          )
        `)
        .eq("whv_id", user.id);

      setMatches(
        (matchData || []).map((m: any) => ({
          emp_id: m.employer_id,
          job_id: Number(m.job_post_id),
          company: m.employer?.company_name,
          profile_photo: m.employer?.profile_photo,
          role: m.job?.role,
          salary_range: m.job?.salary_range,
          employment_type: m.job?.employment_type,
          description: m.job?.description,
          isMutualMatch: true,
        }))
      );

      // ✅ Recommendations
      const { data: recData } = await supabase
        .from("vw_maker_match_scores_top5")
        .select("*")
        .eq("maker_id", user.id)
        .order("match_score", { ascending: false });

      setRecommendations(
        (recData || []).map((r: any) => ({
          emp_id: r.emp_id,
          job_id: Number(r.job_id),
          company: r.company,
          profile_photo: r.profile_photo,
          role: r.role,
          salary_range: r.salary_range,
          employment_type: r.employment_type,
          description: r.description,
          match_score: r.match_score,
          isMutualMatch: false,
        }))
      );
    };

    fetchData();
  }, []);

  const handleViewProfile = (empId: string, jobId: number, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/whv/employer/full-profile/${empId}?job=${jobId}`
      : `/whv/employer/profile/${empId}?job=${jobId}`;
    navigate(route);
  };

  const handleLikeEmployer = async (employer: MatchEmployer) => {
    setLikedEmployerName(employer.company);
    setShowLikeModal(true);

    await supabase.from("likes").insert([
      {
        liker_id: (await supabase.auth.getUser()).data.user?.id,
        liker_type: "whv",
        liked_job_post_id: employer.job_id,
      },
    ]);
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedEmployerName("");
  };

  const currentEmployers = activeTab === "matches" ? matches : recommendations;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-4 mb-4"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
            <button onClick={() => navigate("/whv/dashboard")}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-sm font-medium text-gray-700 flex-1 text-center">
              Explore Matches & Top Recommended Employers
            </h1>
          </div>

          {/* Tabs */}
          <div className="px-4 py-4">
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

          {/* Employer List */}
          <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
            {currentEmployers.length === 0 && (
              <p className="text-center text-sm text-gray-500">No employers found.</p>
            )}

            {currentEmployers.map((e, idx) => (
              <div
                key={`${e.emp_id}-${e.job_id}-${idx}`}
                className="bg-white p-4 rounded-2xl shadow-sm border"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={e.profile_photo || "/placeholder.png"}
                    alt={e.company}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{e.company}</h3>
                    <p className="text-sm text-gray-600">{e.role}</p>
                    <p className="text-sm text-gray-600">{e.salary_range}</p>
                    <p className="text-sm text-gray-600">{e.employment_type}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{e.description}</p>

                    {/* Buttons same as Browse Jobs */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        onClick={() => handleViewProfile(e.emp_id, e.job_id, e.isMutualMatch)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-10 rounded-full"
                      >
                        {e.isMutualMatch ? "View Full Profile" : "View Job"}
                      </Button>
                      {!e.isMutualMatch && (
                        <button
                          onClick={() => handleLikeEmployer(e)}
                          className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-600"
                        >
                          <Heart size={16} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* % Match only for Recommended */}
                  {!e.isMutualMatch && e.match_score !== undefined && (
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-lg font-bold text-orange-500">
                        {Math.round(e.match_score)}%
                      </div>
                      <div className="text-xs font-semibold text-orange-500">Match</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t rounded-b-[48px] flex-shrink-0">
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
  );
};

export default WHVMatches;
