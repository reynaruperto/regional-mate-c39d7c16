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
  skills?: string[];
  country: string;
  location: string;
  availability: string;
  profileImage: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">(
    "matches"
  );
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchEmployer[]>([]);

  const whvId = "CURRENT_WHV_UUID"; // TODO: replace with logged-in WHV id

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (tab === "matches" || tab === "topRecommended") {
      setActiveTab(tab as "matches" | "topRecommended");
    }
  }, [location.search]);

  // ✅ Fetch mutual matches (frontend filter)
  useEffect(() => {
    const fetchMatches = async () => {
      // Likes made by this WHV
      const { data: whvLikes, error: whvError } = await supabase
        .from("likes")
        .select("liked_employer_id")
        .eq("liker_type", "whv")
        .eq("liker_id", whvId);

      // Likes made by employers towards this WHV
      const { data: employerLikes, error: empError } = await supabase
        .from("likes")
        .select("liker_id")
        .eq("liker_type", "employer")
        .eq("liked_whv_id", whvId);

      if (whvError || empError) {
        console.error("Error fetching likes:", whvError || empError);
        return;
      }

      // Employers who liked me
      const employersWhoLikedMe = new Set(
        employerLikes?.map((l: any) => l.liker_id) || []
      );

      // Mutual = WHV liked them AND they liked me back
      const mutualEmployers =
        whvLikes?.filter((l: any) =>
          employersWhoLikedMe.has(l.liked_employer_id)
        ) || [];

      if (mutualEmployers.length > 0) {
        const { data: employers } = await supabase
          .from("employers")
          .select(`
            user_id,
            company_name,
            tagline,
            state,
            suburb_city,
            postcode,
            start_date,
            profile_photo
          `)
          .in(
            "user_id",
            mutualEmployers.map((m: any) => m.liked_employer_id)
          );

        const formatted =
          employers?.map((e: any) => ({
            id: e.user_id,
            name: e.company_name,
            country: "Australia",
            profileImage: e.profile_photo,
            location: `${e.suburb_city}, ${e.state} ${e.postcode}`,
            availability: `Start Date ${e.start_date}`,
            isMutualMatch: true,
          })) ?? [];

        setMatches(formatted);
      } else {
        setMatches([]);
      }
    };

    fetchMatches();
  }, [whvId]);

  // ✅ Fetch top recommended employers (unchanged)
  useEffect(() => {
    const fetchTopRecommended = async () => {
      const { data, error } = await supabase
        .from("matching_score")
        .select(
          `
          job_id,
          match_score,
          employer:employers (
            user_id,
            company_name,
            tagline,
            state,
            suburb_city,
            postcode,
            start_date,
            profile_photo
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

      const formatted =
        data?.map((r: any) => ({
          id: r.employer?.user_id,
          name: r.employer?.company_name,
          country: "Australia",
          profileImage: r.employer?.profile_photo,
          location: `${r.employer?.suburb_city}, ${r.employer?.state} ${r.employer?.postcode}`,
          availability: `Start Date ${r.employer?.start_date}`,
          matchPercentage: Math.round(r.match_score),
        })) ?? [];

      setTopRecommended(formatted);
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
    setLikedEmployerName(employer.name);
    setShowLikeModal(true);

    // Insert into likes
    const { error } = await supabase.from("likes").insert([
      {
        liker_id: whvId,
        liker_type: "whv",
        liked_employer_id: employer.id, // ✅ FIXED: use employer id
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
              <p className="text-center text-gray-500 mt-8">
                No {activeTab === "matches" ? "mutual matches" : "recommendations"} yet.
              </p>
            ) : (
              currentEmployers.map((e) => (
                <div
                  key={e.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={e.profileImage || "/placeholder.png"}
                      alt={e.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{e.name}</h3>
                      {e.skills && (
                        <p className="text-sm text-gray-600">
                          {e.skills.join(", ")}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">{e.country}</p>
                      <p className="text-sm text-gray-600">{e.location}</p>
                      <p className="text-sm text-gray-600">{e.availability}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          onClick={() =>
                            handleViewProfile(e.id, e.isMutualMatch)
                          }
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-10 rounded-full"
                        >
                          {e.isMutualMatch
                            ? "View Full Profile"
                            : "View Profile"}
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

                    {/* % only for topRecommended */}
                    {!e.isMutualMatch &&
                      e.matchPercentage !== undefined && (
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-lg font-bold text-orange-500">
                            {e.matchPercentage}%
                          </div>
                          <div className="text-xs font-semibold text-orange-500">
                            Match
                          </div>
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
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVMatches;
