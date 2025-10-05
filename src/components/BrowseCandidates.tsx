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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Candidate {
  user_id: string;
  name: string;
  profileImage: string;
  industries: string[];
  workExpIndustries: string[];
  experiences: string;
  preferredLocations: string[];
  licenses: string[];
  isLiked?: boolean;
}

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");

  const [selectedFilters, setSelectedFilters] = useState<any>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [employerId, setEmployerId] = useState<string | null>(null);

  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // ---------- helper ----------
  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/default-avatar.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  const mapRowsToCandidates = (rows: any[]): Candidate[] =>
    (rows || []).map((row: any) => {
      const workExp = Array.isArray(row.work_experience) ? row.work_experience : [];
      const workExpIndustries = workExp.map((we: any) => we?.industry).filter(Boolean);
      const experiences =
        workExp.length > 0
          ? workExp.map((we: any) => `${we?.industry}: ${we?.years}`).join(", ")
          : "No experience listed";

      const licenses = Array.isArray(row.licenses)
        ? row.licenses.map((l: any) => l.name)
        : row.license_names
        ? row.license_names.split(",")
        : [];

      return {
        user_id: row.maker_id || row.user_id,
        name: row.given_name,
        profileImage: resolvePhoto(row.profile_photo),
        industries: (row.industry_pref as string[]) || [],
        workExpIndustries,
        experiences,
        preferredLocations: (row.state_pref as string[]) || [],
        licenses,
        isLiked: false,
      };
    });

  // ---------- auth ----------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

  // ---------- job posts ----------
  useEffect(() => {
    if (!employerId) return;
    (async () => {
      const { data, error } = await supabase
        .from("job")
        .select("job_id, description, job_status, industry_role(role)")
        .eq("user_id", employerId)
        .eq("job_status", "active");
      if (!error && data) setJobPosts(data);
    })();
  }, [employerId]);

  // ---------- fetch all candidates ----------
  const fetchCandidates = async () => {
    if (!employerId || !selectedJobId) return;

    const { data: makers, error } = await (supabase as any).rpc("view_all_eligible_makers", {
      p_emp_id: employerId,
      p_job_id: selectedJobId,
    });
    if (error) {
      console.error("Eligible makers RPC error:", error);
      return;
    }

    const { data: likes } = await supabase
      .from("likes")
      .select("liked_whv_id")
      .eq("liker_id", employerId)
      .eq("liker_type", "employer")
      .eq("liked_job_post_id", selectedJobId);

    const likedIds = likes?.map((l) => l.liked_whv_id) || [];
    const mapped = mapRowsToCandidates(makers || []).map((c) => ({
      ...c,
      isLiked: likedIds.includes(c.user_id),
    }));

    setCandidates(mapped);
    setAllCandidates(mapped);
  };

  useEffect(() => {
    if (employerId && selectedJobId) fetchCandidates();
  }, [employerId, selectedJobId]);

  // ---------- search ----------
  const visibleCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.workExpIndustries.some((i) => i.toLowerCase().includes(q)) ||
        c.preferredLocations.some((l) => l.toLowerCase().includes(q)) ||
        c.licenses.some((l) => l.toLowerCase().includes(q))
    );
  }, [searchQuery, candidates]);

  // ---------- like/unlike ----------
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

  // ---------- filter chips ----------
  const filterChips = [
    selectedFilters.workIndustryLabel && { key: "workIndustryLabel", label: selectedFilters.workIndustryLabel },
    selectedFilters.industryLabel && { key: "industryLabel", label: selectedFilters.industryLabel },
    selectedFilters.licenseLabel && { key: "licenseLabel", label: selectedFilters.licenseLabel },
    selectedFilters.state && { key: "state", label: selectedFilters.state },
    selectedFilters.suburbCityPostcode && { key: "suburbCityPostcode", label: selectedFilters.suburbCityPostcode },
    selectedFilters.yearsExperience && { key: "yearsExperience", label: selectedFilters.yearsExperience },
  ].filter(Boolean);

  const handleClearFilters = () => {
    setSelectedFilters({});
    fetchCandidates();
  };

  // ---------- render ----------
  if (showFilters) {
    return (
      <FilterPage
        onClose={() => setShowFilters(false)}
        onResults={(filteredCandidates, appliedFilters) => {
          const mapped = mapRowsToCandidates(filteredCandidates);
          setCandidates(mapped);
          setSelectedFilters(appliedFilters);
          setShowFilters(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50" />

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate("/employer/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Candidates</h1>
            </div>

            {/* Job Post Selector */}
            <div className="px-6 mb-4">
              <Select
                onValueChange={(value) => setSelectedJobId(Number(value))}
                value={selectedJobId ? String(selectedJobId) : ""}
              >
                <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                  <SelectValue placeholder="Select an active job post" />
                </SelectTrigger>
                <SelectContent className="max-h-40 overflow-y-auto text-sm rounded-xl border bg-white shadow-lg">
                  {jobPosts.map((job) => (
                    <SelectItem
                      key={job.job_id}
                      value={String(job.job_id)}
                      className="py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                    >
                      {job.industry_role?.role || "Unknown Role"} – {job.description || `Job #${job.job_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative mb-2 px-6">
              <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search for candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white w-full"
              />
              <button onClick={() => setShowFilters(true)} className="absolute right-9 top-1/2 -translate-y-1/2">
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
                      onClick={() => handleClearFilters()}
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

            {/* Candidates */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>Please select a job post above to view matching candidates.</p>
                </div>
              ) : visibleCandidates.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No candidates match this job yet.</p>
                </div>
              ) : (
                visibleCandidates.map((c) => (
                  <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                    <div className="flex gap-3 items-start">
                      <img
                        src={c.profileImage}
                        alt={c.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">{c.name}</h3>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong> {c.preferredLocations.join(", ") || "Not specified"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong> {c.industries.join(", ") || "No preferences"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Experience:</strong> {c.experiences}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Licenses:</strong> {c.licenses.join(", ") || "None listed"}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() =>
                              navigate(`/short-candidate-profile/${c.user_id}?from=browse-candidates`)
                            }
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
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

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

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
