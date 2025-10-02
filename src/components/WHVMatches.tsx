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
  country: string;
  location: string;
  availability: string;
  profileImage: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
  jobId?: number;
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

  // Logged in WHV
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // maintain tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (tab === "matches" || tab === "topRecommended") {
      setActiveTab(tab as "matches" | "topRecommended");
    }
  }, [location.search]);

  const safeLocation = (suburb?: string, state?: string, postcode?: string) => {
    const part1 = [suburb, state].filter(Boolean).join(", ");
    return [part1, postcode].filter(Boolean).join(" ");
  };

  // Fetch Matches
  useEffect(() => {
    if (!whvId) return;

    const fetchMatches = async () => {
      const { data: matchRows, error } = await supabase
        .from("matches")
        .select("job_post_id, employer_id, matched_at")
        .eq("whv_id", whvId)
        .not("matched_at", "is", null);

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }
      if (!matchRows?.length) {
        setMatches([]);
        return;
      }

      // Fetch related jobs
      const jobIds = [...new Set(matchRows.map((r) => r.job_post_id))];
      const { data: jobs } = await supabase
        .from("job")
        .select("job_id, start_date, user_id, suburb_city, state, postcode")
        .in("job_id", jobIds);

      // Fetch employers
      const empIds = [...new Set(matchRows.map((r) => r.employer_id))];
      const { data: employers } = await supabase
        .from("employer")
        .select("user_id, company_name, profile_photo, suburb_city, state, postcode")
        .in("user_id", empIds);

      const merged = matchRows.map((r) => {
        const job = jobs?.find((j) => j.job_id === r.job_post_id);
        const emp = employers?.find((e) => e.user_id === r.employer_id);
        return {
          id: emp?.user_id || "",
          name: emp?.company_name || "Employer",
          country: "Australia",
          profileImage: emp?.profile_photo || "/placeholder.png",
          location: safeLocation(emp?.suburb_city, emp?.state, emp?.postcode),
          availability: job?.start_date ? `Start Date ${job.start_date}` : "Start Date TBA",
          isMutualMatch: true,
          jobId: job?.job_id,
        };
      });

      setMatches(merged);
    };

    fetchMatches();
  }, [whvId]);

  // Fetch Top Recommended
  useEffect(() => {
    if (!whvId) return;

    const fetchTopRecommended = async () => {
      const { data: recRows, error } = await supabase
        .from("matching_score")
        .select("job_id, match_score")
        .eq("whv_id", whvId)
        .order("match_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }
      if (!recRows?.length) {
        setTopRecommended([]);
        return;
      }

      const jobIds = recRows.map((r) => r.job_id);
      const { data: jobs } = await supabase
        .from("job")
        .select("job_id, user_id, start_date, suburb_city, state, postcode")
        .in("job_id", jobIds);

      const empIds = jobs?.map((j) => j.user_id) || [];
      const { data: employers } = await supabase
        .from("employer")
        .select("user_id, company_name, profile_photo, suburb_city, state, postcode")
        .in("user_id", empIds);

      const merged = recRows.map((r) => {
        const job = jobs?.find((j) => j.job_id === r.job_id);
        const emp = employers?.find((e) => e.user_id === job?.user_id);
        return {
          id: emp?.user_id || "",
          name: emp?.company_name || "Employer",
          country: "Australia",
          profileImage: emp?.profile_photo || "/placeholder.png",
          location: safeLocation(emp?.suburb_city, emp?.state, emp?.postcode),
          availability: job?.start_date ? `Start Date ${job.start_date}` : "Start Date TBA",
          matchPercentage: Math.round(r.match_score ?? 0),
          jobId: job?.job_id,
        };
      });

      setTopRecommended(merged);
    };

    fetchTopRecommended();
  }, [whvId]);

  const handleViewProfile = (employerId: string, isMutualMatch?: boolean) => {
    const route = isMutualMatch
      ? `/whv/employer/full-profile/${employerId}`
      : `/whv/employer/profile/${employerId}`;
    navigate(`${route}?from=whv-matches&tab=${activeTab}`);
  };

  const handleLikeEmployer = async (employer: MatchEmployer) => {
    if (!whvId || !employer.jobId) return;
    setLikedEmployerName(employer.name);
    setShowLikeModal(true);

    await supabase.from("likes").insert([
      {
        liker_id: whvId,
        liker_type: "whv",
        liked_job_post_id: employer.jobId,
        liked_whv_id: null,
      },
    ]);
  };

  const currentEmployers = activeTab === "matches" ? matches : topRecommended;

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
            {currentEmployers.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                {activeTab === "matches" ? "No employers found." : "No recommendations found."}
              </div>
            ) : (
              currentEmployers.map((e) => (
                <div key={`${e.id}-${e.jobId ?? "x"}`} className="bg-white p-4 rounded-2xl shadow-sm border">
                  <div className="flex items-start gap-3">
                    <img
                      src={e.profileImage}
                      alt={e.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = "/placeholder.png")}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{e.name}</h3>
                      <p className="text-sm text-gray-600">{e.country}</p>
                      <p className="text-sm text-gray-600">{e.location}</p>
                      <p className="text-sm text-gray-600">{e.availability}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          onClick={() => handleViewProfile(e.id, e.isMutualMatch)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-10 rounded-full"
                        >
                          {e.isMutualMatch ? "View Full Profile" : "View Profile"}
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

                    {!e.isMutualMatch && e.matchPercentage !== undefined && (
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-lg font-bold text-orange-500">{e.matchPercentage}%</div>
                        <div className="text-xs font-semibold text-orange-500">Match</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t rounded-b-[48px] flex-shrink-0">
            <BottomNavigation />
          </div>

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={likedEmployerName}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
