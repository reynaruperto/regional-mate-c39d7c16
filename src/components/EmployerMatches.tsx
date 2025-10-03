// src/components/EmployerMatches.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface MatchMaker {
  maker_id: string;
  job_id: number;
  given_name: string;
  profile_photo: string | null;
  country: string;
  location: string;
  availability: string;
  match_score: number;
  work_experience_score: number;
  license_score: number;
  location_score: number;
  industry_score: number;
  matching_rank: number;
}

const EmployerMatches: React.FC<{ jobId: number }> = ({ jobId }) => {
  const [matches, setMatches] = useState<MatchMaker[]>([]);
  const [recommendations, setRecommendations] = useState<MatchMaker[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // fetch mutual matches
      const { data: matchData, error: matchError } = await supabase.rpc(
        "fetch_job_matches",
        { p_job_id: jobId }
      );
      if (matchError) console.error("Error fetching matches:", matchError);
      else setMatches(matchData || []);

      // fetch recommendations
      const { data: recData, error: recError } = await supabase.rpc(
        "fetch_job_recommendations",
        { p_job_id: jobId }
      );
      if (recError) console.error("Error fetching recommendations:", recError);
      else setRecommendations(recData || []);
    };

    fetchData();
  }, [jobId]);

  return (
    <div className="p-4 space-y-8">
      {/* Matches Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Mutual Matches</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500">No mutual matches found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <Card key={m.maker_id}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <img
                    src={
                      m.profile_photo
                        ? `https://<your-supabase-bucket-url>/${m.profile_photo}`
                        : "/placeholder.png"
                    }
                    alt={m.given_name}
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                  <h3 className="text-lg font-semibold">{m.given_name}</h3>
                  <p className="text-sm text-gray-500">{m.location}</p>
                  <p className="text-sm text-gray-500">
                    Availability: {m.availability}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    Match Score: {m.match_score}%
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() =>
                      console.log("View full profile for maker", m.maker_id)
                    }
                  >
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Top Recommended Makers</h2>
        {recommendations.length === 0 ? (
          <p className="text-gray-500">No recommendations available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((m) => (
              <Card key={m.maker_id}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <img
                    src={
                      m.profile_photo
                        ? `https://<your-supabase-bucket-url>/${m.profile_photo}`
                        : "/placeholder.png"
                    }
                    alt={m.given_name}
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                  <h3 className="text-lg font-semibold">{m.given_name}</h3>
                  <p className="text-sm text-gray-500">{m.location}</p>
                  <p className="text-sm text-gray-500">
                    Availability: {m.availability}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    Match Score: {m.match_score}%
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() =>
                      console.log("View profile recommendation", m.maker_id)
                    }
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerMatches;
