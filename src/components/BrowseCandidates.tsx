// src/pages/BrowseCandidates.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import FilterPage from "@/components/FilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  user_id: string;
  name: string;
  profile_photo: string;
  industries: string[];
  locations: string[];
  experience_summary: string;
  isLiked?: boolean;
}

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/default-avatar.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  // ✅ Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch job posts
  useEffect(() => {
    if (!employerId) return;
    const loadJobs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("job_id, description, industry_role(role)")
        .eq("user_id", employerId)
        .eq("job_status", "active");
      if (!error && data) setJobPosts(data);
    };
    loadJobs();
  }, [employerId]);

  // ✅ Fetch candidates
  const fetchCandidates = async (activeFilters: any = {}) => {
    if (!employerId || !selectedJobId) return;

    const { data: makers, error } = await (supabase as any).rpc("view_all_eligible_makers", {
      p_emp_id: employerId,
      p_job_id: selectedJobId,
      ...activeFilters,
    });
    if (error) {
      console.error("Error fetching candidates:", error);
      return;
    }

    // Likes
    const { data: likes } = await supabase
      .from("likes")
      .select("liked_whv_id")
      .eq("liker_id", employerId)
      .eq("liker_type", "employer")
      .eq("liked_job_post_id", selectedJobId);

    const likedIds = likes?.map((l) => l.liked_whv_id) || [];

    const mapped: Candidate[] = (makers || []).map((m: any) => ({
      user_id: m.user_id || m.maker_id,
      name: m.given_name || "Unnamed",
      profile_photo: resolvePhoto(m.profile_photo),
      industries: m.industry_pref || [],
      locations: m.state_pref || [],
      experience_summary: Array.isArray(m.work_experience)
        ? m.work_experience.map((we: any) => `${we.industry}: ${we.years} yrs`).join(", ")
        : "No experience listed",
      isLiked: likedIds.includes(m.user_id || m.maker_id),
    }));

    setCandidates(mapped);
    setAllCandidates(mapped);
  };

  useEffect(() => {
    if (employerId && selectedJobId) fetchCandidates();
  }, [employerId, selectedJobId]);

  // ✅ Like/unlike
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;
    const candidate = candidates.find((c) => c.user_id === candidateId);
    if (!candidate) return;

    try {
      if (candidate.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liker_type", "employer")
          .eq("liked_whv_id", candidateId)
          .eq("liked_job_post_id", selectedJobId);

        setCandidates((prev) =>
          prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: false } : c))
        );
        setAllCandidates((prev) =>
          prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: false } : c))
        );
      } else {
        await supabase.from("likes").insert({
          liker_id: employerId,
          liker_type: "employer",
          liked_whv_id: candidateId,
          liked_job_post_id: selectedJobId,
        });

        setCandidates((prev) =>
          prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: true } : c))
        );
        setAllCandidates((prev) =>
          prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: true } : c))
        );

        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // ✅ Filter chip logic
  const handleRemoveFilter = (key: string) => {
    const updated = { ...filters, [key]: null, [`${key}Label`]: null };
    const clean = Object.fromEntries(Object.entries(updated).filter(([_, v]) => v));
    setFilters(clean);
    fetchCandidates(clean);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchCandidates({});
  };

  // ✅ Chips
  const filterChips = [
    filters.industryLabel && { key: "industry", label: filters.industryLabel },
    filters.state && { key: "state", label: filters.state },
    filters.suburbCityPostcode && { key: "suburbCityPostcode", label: filters.suburbCityPostcode },
    filters.experience && { key: "experience", label: filters.experience },
    filters.licenseLabel && { key: "license", label: filters.licenseLabel },
  ].filter(Boolean) as { key: string; label: string }[];

  // ✅ Search logic
  const visibleCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter((c) =>
      [c.name, ...c.industries, ...c.locations, c.experience_summary]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [candidates, searchQuery]);

  return showFilters ? (
    <FilterPage
      onClose={() => setShowFilters(false)}
      onApplyFilters={(filtered, appliedFilters) => {
        setCandidates(filtered);
        setAllCandidates(filtered);
        setFilters(appliedFilters);
        setShowFilters(false);
      }}
    />
  ) : (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Candidates</h1>
            </div>

            {/* Job selector */}
            <div className="px-6 mb-3">
              <select
                className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white text-sm"
                value={selectedJobId ?? ""}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
              >
                <option value="">Select active job post</option>
                {jobPosts.map((job) => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.industry_role?.role || "Role"} – {job.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative mb-2 px-6">
              <Search
                className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder="Search for candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white w-full"
              />
              <button
                onClick={() => setShowFilters(true)}
                className="absolute right-9 top-1/2 -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Chips */}
            {filterChips.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 mb-2">
                {filterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs"
                  >
                    {chip.label}
                    <button
                      className="ml-2 text-orange-600 hover:text-orange-900"
                      onClick={() => handleRemoveFilter(chip.key)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-600 underline"
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Candidate cards */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>Select a job post above to view matching candidates.</p>
                </div>
              ) : visibleCandidates.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No candidates found. Try adjusting your search or filters.</p>
                </div>
              ) : (
                visibleCandidates.map((c) => (
                  <div
                    key={c.user_id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={c.profile_photo}
                        alt={c.name}
                        className="w-14 h-14 rounded-lg object-cover border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
                        <p className="text-sm text-gray-600">
                          {c.industries.join(", ") || "No industry preferences"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {c.locations.join(", ") || "No preferred locations"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{c.experience_summary}</p>

                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                            onClick={() =>
                              navigate(`/short-candidate-profile/${c.user_id}?from=browse`)
                            }
                          >
                            View Profile
                          </Button>
                          <button
                            onClick={() => handleLikeCandidate(c.user_id)}
                            className="h-10 w-10 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={c.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                            />
                          </button>
                        </div>
                      </div>
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

          {/* Like modal */}
          <LikeConfirmationModal
            candidateName={likedCandidateName}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default BrowseCandidates;
