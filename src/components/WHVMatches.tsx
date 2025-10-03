// src/pages/WHVMatches.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchCard {
  job_id: number;
  emp_id: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  profile_photo: string;
  salary_range: string;
  employment_type: string;
  description?: string;
  isMutualMatch?: boolean;
  matchPercentage?: number;
}

const WHVMatches: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"matches" | "topRecommended">("matches");
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [topRecommended, setTopRecommended] = useState<MatchCard[]>([]);
  const [whvId, setWhvId] = useState<string | null>(null);

  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedEmployerName, setLikedEmployerName] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Helper to resolve photo URL
  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/placeholder.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  // Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // Fetch Matches
  useEffect(() => {
    if (!whvId) return;
    const fetchMatches = async () => {
      const { data, error } = await supabase.rpc("fetch_whv_matches", {
        p_whv_id: whvId,
      });
      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }
      const formatted: MatchCard[] =
        data?.map((m: any) => ({
          job_id: m.job_id,
          emp_id: m.emp_id,
          company: m.company,
          role: m.role,
          industry: m.industry,
          location: `${m.suburb_city}, ${m.state} ${m.postcode}`,
          profile_photo: resolvePhoto(m.profile_photo),
          salary_range: m.salary_range,
          employment_type: m.employment_type,
          description: m.description,
          isMutualMatch: true,
        })) ?? [];
      setMatches(formatted);
    };
    fetchMatches();
  }, [whvId]);

  // Fetch Top Recommended
  useEffect(() => {
    if (!whvId) return;
    const fetchTopRecommended = async () => {
      const { data, error } = await supabase.rpc("fetch_whv_recommendations", {
        p_whv_id: whvId,
      });
      if (error) {
        console.error("Error fetching recommendations:", error);
        return;
      }
      const formatted: MatchCard[] =
        data?.map((r: any) => ({
          job_id: r.job_id,
          emp_id: r.emp_id,
          company: r.company,
          role: r.role,
          industry: r.industry,
          location: `${r.suburb_city}, ${r.state} ${r.postcode}`,
          profile_photo: resolvePhoto(r.profile_photo),
          salary_range: r.salary_range,
          employment_type: r.employment_type,
          description: r.description,
          matchPercentage: Math.round(r.match_score),
          isMutualMatch: false,
        })) ?? [];
      setTopRecommended(formatted);
    };
    fetchTopRecommended();
  }, [whvId]);

  const currentEmployers = activeTab === "matches" ? matches : topRecommended;

  const handleLikeEmployer = async (employer: MatchCard) => {
    if (!whvId) return;
    setLikedEmployerName(employer.company);
    setShowLikeModal(true);

    const { error } = await supabase.from("likes").insert({
      liker_id: whvId,
      liker_type: "whv",
      liked_job_post_id: employer.job_id,
      liked_whv_id: null,
    });

    if (error) console.error("Error liking employer:", error);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
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
              Matches & Recommendations
            </h1>
          </div>

          {/* Job Selector */}
          <div className="px-6 mb-3">
            <Select
              onValueChange={(value) => setSelectedJobId(Number(value))}
              value={selectedJobId ? String(selectedJobId) : ""}
            >
              <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white truncate">
                <SelectValue placeholder="Select an active job post" />
              </SelectTrigger>
              <SelectContent
                className="min-w-0 w-full max-w-[360px] max-h-40 overflow-y-auto rounded-xl border bg-white shadow-lg text-sm"
                align="start"
              >
                {matches.concat(topRecommended).map((job) => (
                  <SelectItem
                    key={job.job_id}
                    value={String(job.job_id)}
                    className="py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                  >
                    {job.role} – {job.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 flex bg-gray-100 rounded-full mx-6 my-2">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                activeTab === "matches"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab("topRecommended")}
              className={`flex-1 py-2 rounded-full text-sm font-medium ${
                activeTab === "topRecommended"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Top Recommended
            </button>
          </div>

          {/* List */}
          <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
            {currentEmployers.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">
                <p>
                  {activeTab === "matches"
                    ? "No matches found."
                    : "No recommendations available."}
                </p>
              </div>
            ) : (
              currentEmployers.map((e) => (
                <div
                  key={e.job_id}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={e.profile_photo}
                      alt={e.company}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                      onError={(ev) => {
                        (ev.currentTarget as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900">{e.role}</h2>
                      <p className="text-sm text-gray-600">
                        {e.company} • {e.industry}
                      </p>
                      <p className="text-sm text-gray-500">{e.location}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {e.employment_type}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {e.salary_range}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          className="flex-1 bg-[#1E293B] hover:bg-[#0f172a] text-white h-11 rounded-xl"
                          onClick={() => {
                            if (e.isMutualMatch) {
                              navigate(
                                `/whv/job-full/${e.job_id}?from=whv-matches&tab=${activeTab}`
                              );
                            } else {
                              navigate(`/whv/job/${e.job_id}`, {
                                state: { from: "topRecommended" },
                              });
                            }
                          }}
                        >
                          {e.isMutualMatch ? "View Full Profile" : "View Profile"}
                        </Button>

                        {!e.isMutualMatch && (
                          <button
                            onClick={() => handleLikeEmployer(e)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart size={20} className="text-orange-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Match % badge */}
                    {e.matchPercentage && !e.isMutualMatch && (
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

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
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
