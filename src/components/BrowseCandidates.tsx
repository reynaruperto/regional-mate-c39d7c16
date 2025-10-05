import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import FilterPage from "@/components/FilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types"; // if Lovable auto-generated types exist

interface Candidate {
  maker_id: string;
  given_name: string;
  profile_photo: string;
  work_experience: Json;
  maker_states: string[];
  pref_industries: string[];
  licenses: string[];
  isLiked?: boolean;
}

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidate, setLikedCandidate] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Load Employer ID
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  // ✅ Initial fetch of candidates
  useEffect(() => {
    if (userId) fetchCandidates({});
  }, [userId]);

  // ✅ Fetch function (calls the RPC)
  const fetchCandidates = async (appliedFilters: any) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.rpc("filter_makers_for_employer", {
        p_emp_id: userId,
        p_job_id: null,
        p_filter_state: appliedFilters.p_filter_state || null,
        p_filter_suburb_city_postcode:
          appliedFilters.p_filter_suburb_city_postcode || null,
        p_filter_work_industry_id:
          appliedFilters.p_filter_work_industry_id || null,
        p_filter_work_years_experience:
          appliedFilters.p_filter_work_years_experience || null,
        p_filter_industry_ids: appliedFilters.p_filter_industry_ids || null,
        p_filter_license_ids: appliedFilters.p_filter_license_ids || null,
      });

      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }

      setCandidates(data || []);
      setFilteredCandidates(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // ✅ Apply Filters
  const handleApplyFilters = async (selected: any) => {
    setFilters(selected);
    await fetchCandidates(selected);
    setShowFilters(false);
  };

  // ✅ Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCandidates(candidates);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredCandidates(
        candidates.filter(
          (c) =>
            c.given_name?.toLowerCase().includes(lower) ||
            c.maker_states?.some((s) => s.toLowerCase().includes(lower)) ||
            c.pref_industries?.some((i) => i.toLowerCase().includes(lower))
        )
      );
    }
  }, [searchQuery, candidates]);

  // ✅ Like handling
  const handleLike = (makerId: string) => {
    setLikedCandidate(makerId);
    setShowLikeModal(true);
  };

  const confirmLike = async () => {
    if (!likedCandidate || !userId) return;
    try {
      await supabase.from("likes").insert([
        {
          liker_id: userId,
          liked_whv_id: likedCandidate,
          liker_type: "employer",
        },
      ]);
      setShowLikeModal(false);
    } catch (err) {
      console.error("Error liking candidate:", err);
    }
  };

  const clearFilterChip = async (key: string) => {
    const newFilters = { ...filters, [key]: "" };
    setFilters(newFilters);
    await fetchCandidates(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-700"
            >
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-lg font-medium">Browse Candidates</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(true)}
            >
              <Filter size={22} />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input
                placeholder="Search by name, location, or industry..."
                className="pl-9 rounded-xl border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 px-4">
            {Object.entries(filters)
              .filter(([_, value]) => value)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>
                    {key
                      .replace("p_filter_", "")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    :{" "}
                    {Array.isArray(value)
                      ? value.join(", ")
                      : String(value)}
                  </span>
                  <X
                    size={14}
                    className="ml-2 cursor-pointer"
                    onClick={() => clearFilterChip(key)}
                  />
                </div>
              ))}
          </div>

          {/* Candidate List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.maker_id}
                  className="flex items-center justify-between border rounded-xl p-3 bg-white shadow-sm"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() =>
                      navigate(`/employer/candidate/${candidate.maker_id}`)
                    }
                  >
                    <img
                      src={
                        candidate.profile_photo ||
                        "/placeholder-user.jpg"
                      }
                      alt={candidate.given_name}
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {candidate.given_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {candidate.pref_industries?.join(", ") || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {candidate.maker_states?.join(", ") || ""}
                      </p>
                    </div>
                  </div>
                  <Heart
                    size={20}
                    className="text-gray-500 cursor-pointer hover:text-red-500"
                    onClick={() => handleLike(candidate.maker_id)}
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 mt-10">
                No candidates found.
              </p>
            )}
          </div>

          <BottomNavigation />
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <FilterPage
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
        />
      )}

      {/* Like Modal */}
      {showLikeModal && (
        <LikeConfirmationModal
          onClose={() => setShowLikeModal(false)}
          onConfirm={confirmLike}
        />
      )}
    </div>
  );
};

export default BrowseCandidates;
