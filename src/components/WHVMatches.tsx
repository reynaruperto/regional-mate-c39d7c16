// src/components/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";

interface MatchEmployer {
  id: string;
  name: string;
  tagline?: string;
  profileImage: string;
  location: string;
  jobTitle?: string;
  salary?: string;
  startDate?: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"matches" | "recommended">("matches");
  const [matches, setMatches] = useState<MatchEmployer[]>([]);
  const [recommended, setRecommended] = useState<MatchEmployer[]>([]);

  // --------------------
  // Fetch Matches (mutual likes)
  // --------------------
  const fetchMatches = async (whvId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        job_post_id,
        matched_at,
        employer:employer_id (
          user_id,
          company_name,
          tagline,
          suburb_city,
          state,
          postcode,
          profile_photo
        ),
        job:job_post_id (
          job_id,
          description,
          salary_range,
          employment_type,
          start_date,
          suburb_city,
          state,
          postcode
        )
      `)
      .eq("whv_id", whvId)
      .not("matched_at", "is", null);

    if (error) {
      console.error("Error fetching matches:", error);
      return [];
    }

    return (
      data?.map((m: any) => ({
        id: m.employer?.user_id,
        name: m.employer?.company_name || "Employer",
        tagline: m.employer?.tagline,
        profileImage: m.employer?.profile_photo || "/placeholder.png",
        location: `${m.employer?.suburb_city ?? ""}, ${m.employer?.state ?? ""} ${m.employer?.postcode ?? ""}`,
        jobTitle: m.job?.description,
        salary: m.job?.salary_range,
        startDate: m.job?.start_date,
        isMutualMatch: true,
      })) ?? []
    );
  };

  // --------------------
  // Fetch Recommendations (Top Recommended)
  // --------------------
  const fetchRecommendations = async (whvId: string) => {
    const { data, error } = await supabase
      .from("matching_score")
      .select(`
        job_id,
        match_score,
        job:job_id (
          job_id,
          description,
          salary_range,
          employment_type,
          start_date,
          suburb_city,
          state,
          postcode
        ),
        employer:employer_id (
          user_id,
          company_name,
          tagline,
          profile_photo
        )
      `)
      .eq("whv_id", whvId)
      .order("match_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recommendations:", error);
      return [];
    }

    return (
      data?.map((m: any) => ({
        id: m.employer?.user_id,
        name: m.employer?.company_name || "Employer",
        tagline: m.employer?.tagline,
        profileImage: m.employer?.profile_photo || "/placeholder.png",
        location: `${m.job?.suburb_city ?? ""}, ${m.job?.state ?? ""} ${m.job?.postcode ?? ""}`,
        jobTitle: m.job?.description,
        salary: m.job?.salary_range,
        startDate: m.job?.start_date,
        matchPercentage: m.match_score,
      })) ?? []
    );
  };

  // --------------------
  // Load Data on Mount
  // --------------------
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const matchesData = await fetchMatches(user.id);
      const recommendedData = await fetchRecommendations(user.id);

      setMatches(matchesData);
      setRecommended(recommendedData);
    };

    loadData();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <ArrowLeft className="mr-2" onClick={() => navigate(-1)} />
        <h1 className="text-lg font-semibold">
          Explore Matches & Top Recommended Employers
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mt-2 mb-4">
        <Button
          variant={activeTab === "matches" ? "default" : "outline"}
          onClick={() => setActiveTab("matches")}
          className="w-1/2"
        >
          Matches
        </Button>
        <Button
          variant={activeTab === "recommended" ? "default" : "outline"}
          onClick={() => setActiveTab("recommended")}
          className="w-1/2"
        >
          Top Recommended
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "matches" &&
          (matches.length > 0 ? (
            matches.map((emp) => (
              <div
                key={emp.id}
                className="p-4 mb-4 border rounded-lg shadow-sm flex items-center"
              >
                <img
                  src={emp.profileImage}
                  alt={emp.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{emp.name}</h2>
                  <p className="text-sm text-gray-500">{emp.tagline}</p>
                  <p className="text-sm">{emp.jobTitle}</p>
                  <p className="text-xs text-gray-400">{emp.location}</p>
                </div>
                <Button onClick={() => navigate(`/employer/${emp.id}`)}>
                  View Full Profile
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No employers found.</p>
          ))}

        {activeTab === "recommended" &&
          (recommended.length > 0 ? (
            recommended.map((emp) => (
              <div
                key={emp.id}
                className="p-4 mb-4 border rounded-lg shadow-sm flex items-center"
              >
                <img
                  src={emp.profileImage}
                  alt={emp.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{emp.name}</h2>
                  <p className="text-sm text-gray-500">{emp.tagline}</p>
                  <p className="text-sm">{emp.jobTitle}</p>
                  <p className="text-xs text-gray-400">{emp.location}</p>
                  {emp.matchPercentage !== undefined && (
                    <p className="text-xs font-medium text-green-600">
                      Match Score: {emp.matchPercentage}%
                    </p>
                  )}
                </div>
                <Heart className="text-red-500" />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No recommendations found.</p>
          ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default WHVMatches;
