// src/pages/BrowseCandidates.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Filter, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import FilterPage from "@/components/FilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  id: string;
  name: string;
  profilePhoto: string;
  workExperience: { industry: string; years: string }[];
  preferredLocations: string[];
  preferredIndustries: string[];
  isLiked?: boolean;
}

interface ActiveFilters {
  workIndustry?: string;
  state?: string;
  suburbCityPostcode?: string;
  workYearsExperience?: string;
  preferredIndustries?: string[];
  licenses?: string[];
}

const BrowseCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidate, setLikedCandidate] = useState("");
  const [empId, setEmpId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  // ✅ Get logged-in employer
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmpId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch initial candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!empId) return;

      const { data, error } = await (supabase as any).rpc("filter_makers_for_employer", {
        p_emp_id: empId,
        p_job_id: jobId,
        p_filter_state: null,
        p_filter_suburb_city_postcode: null,
        p_filter_work_industry_id: null,
        p_filter_work_years_experience: null,
        p_filter_industry_ids: null,
        p_filter_license_ids: null,
      });

      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }

      const mapped: Candidate[] = (data || []).map((c: any) => ({
        id: c.maker_id,
        name: c.given_name,
        profilePhoto: c.profile_photo || "/placeholder.png",
        workExperience: c.work_experience || [],
        preferredLocations: c.state_pref || [],
        preferredIndustries: c.industry_pref || [],
      }));

      setCandidates(mapped);
      setAllCandidates(mapped);
    };

    fetchCandidates();
  }, [empId, jobId]);

  // 🔎 Search
  useEffect(() => {
    let list = [...allCandidates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.preferredIndustries.some((i) => i.toLowerCase().includes(q)) ||
          c.preferredLocations.some((l) => l.toLowerCase().includes(q))
      );
    }
    setCandidates(list);
  }, [searchQuery, allCandidates]);

  // ❤️ Like/unlike
  const handleLikeCandidate = async (candidateId: string) => {
    if (!empId || !jobId) return;
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    try {
      if (candidate.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", empId)
          .eq("liker_type", "employer")
          .eq("liked_whv_id", candidateId)
          .eq("liked_job_post_id", jobId);

        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, isLiked: false } : c))
        );
      } else {
        await supabase.from("likes").insert({
          liker_id: empId,
          liker_type: "employer",
          liked_whv_id: candidateId,
          liked_job_post_id: jobId,
        });

        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, isLiked: true } : c))
        );
        setLikedCandidate(candidate.name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error liking candidate:", err);
    }
  };

  // 🔄 Handle filter results from FilterPage
  const handleFilterResults = (data: Candidate[], filters?: ActiveFilters) => {
    setCandidates(data);
    setAllCandidates(data);
    if (filters) setActiveFilters(filters);
  };

  // ❌ Remove individual filter chip
  const removeFilter = (key: keyof ActiveFilters, value?: string) => {
    const updatedFilters = { ...activeFilters };

    if (Array.isArray(updatedFilters[key])) {
      updatedFilters[key] = (updatedFilters[key] as string[]).filter((v) => v !== value);
    } else {
      updatedFilters[key] = undefined;
    }

    setActiveFilters(updatedFilters);
    // ⚠️ Ideally re-run RPC with updatedFilters here
  };

  // ❌ Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    // ⚠️ Ideally re-run RPC with no filters here
  };

  return showFilters ? (
    <FilterPage
      onClose={() => setShowFilters(false)}
      onResults={(data) => handleFilterResults(data, activeFilters)}
      user={{ id: empId || "", jobId: jobId || undefined }}
    />
  ) : (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Candidates</h1>
            </div>

            {/* Search */}
            <div className="relative mb-2 px-6 mt-2">
              <Search
                className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400"
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
                className="absolute right-9 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Filter Chips */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="px-6 flex flex-wrap gap-2 mb-3">
                {Object.entries(activeFilters).map(([key, value]) =>
                  Array.isArray(value) ? (
                    value.map((v) => (
                      <span
                        key={`${key}-${v}`}
                        className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {key}: {v}
                        <X
                          size={14}
                          className="cursor-pointer"
                          onClick={() => removeFilter(key as keyof ActiveFilters, v)}
                        />
                      </span>
                    ))
                  ) : value ? (
                    <span
                      key={key}
                      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                      {key}: {value}
                      <X
                        size={14}
                        className="cursor-pointer"
                        onClick={() => removeFilter(key as keyof ActiveFilters)}
                      />
                    </span>
                  ) : null
                )}

                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-600 underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Candidate List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {candidates.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No candidates found. Try adjusting your filters.</p>
                </div>
              ) : (
                candidates.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={c.profilePhoto}
                        alt={c.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong>{" "}
                          {c.preferredLocations.join(", ") || "Not specified"}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong>{" "}
                          {c.preferredIndustries.join(", ") || "Not specified"}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Experience:</strong>{" "}
                          {c.workExperience.length > 0
                            ? c.workExperience
                                .map((we) => `${we.industry}: ${we.years}`)
                                .join(", ")
                            : "Not specified"}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl">
                            View Profile
                          </Button>
                          <button
                            onClick={() => handleLikeCandidate(c.id)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
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

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          <LikeConfirmationModal
            candidateName={likedCandidate}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default BrowseCandidates;
