// src/pages/BrowseCandidates.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import FilterPage from "@/components/FilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  user_id: string;
  name: string;
  state: string;
  profileImage: string;
  industries: string[];
  roles: string[];
  experiences: string;
  licenses: string[];
  preferredLocations: string[];
  isLiked?: boolean; // 🔑 Added flag for heart toggle
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

  // ✅ Get logged-in employer ID once
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      // 1️⃣ Fetch all WHV makers
      const { data: makers, error: makersError } = await supabase
        .from("whv_maker")
        .select("user_id, given_name, family_name, state, profile_photo, is_profile_visible");

      if (makersError) {
        console.error("Error fetching whv_maker:", makersError);
        return;
      }

      const visibleMakers = makers?.filter((m) => m.is_profile_visible) || [];

      // 2️⃣ Fetch related tables
      const { data: preferences } = await supabase
        .from("maker_pref_industry_role")
        .select("user_id, industry_role_id, industry_role ( role, industry ( name ) )");

      // Skip work experience for now due to type issues
      const experiences: any[] = [];

      const { data: locations } = await supabase
        .from("maker_pref_location")
        .select("user_id, state, suburb_city, postcode");

      const { data: licenses } = await supabase
        .from("maker_license")
        .select("user_id, license ( name )");

      // 3️⃣ Fetch existing likes by employer
      let likedIds: string[] = [];
      if (employerId) {
        const { data: likes } = await supabase
          .from("likes")
          .select("liked_whv_id")
          .eq("liker_id", employerId)
          .eq("liker_type", "employer");
        likedIds = likes?.map((l) => l.liked_whv_id) || [];
      }

      // 4️⃣ Merge into candidates
      const mapped: Candidate[] = visibleMakers.map((m) => {
        const userId = m.user_id;

        // Industries & Roles
        const userPrefs =
          preferences?.filter((p) => p.user_id === userId) || [];
        const industries = [
          ...new Set(
            userPrefs.map((p) => p.industry_role?.industry?.name).filter(Boolean)
          ),
        ];
        const roles = [
          ...new Set(userPrefs.map((p) => p.industry_role?.role).filter(Boolean)),
        ];

        // Work Experiences
        const userExps = experiences?.filter((e) => e.user_id === userId) || [];
        const expSummaries = userExps
          .map((exp) => {
            if (!exp.start_date) return null;
            const start = new Date(exp.start_date);
            const end = exp.end_date ? new Date(exp.end_date) : new Date();
            const diffYears =
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            const duration =
              diffYears < 1
                ? `${Math.round(diffYears * 12)} mos`
                : `${Math.round(diffYears)} yrs`;
            return `${exp.industry?.name || "Unknown"} – ${
              exp.position || "Role"
            } (${duration})`;
          })
          .filter(Boolean);

        let condensedExperience = "";
        if (expSummaries.length > 2) {
          condensedExperience = `${expSummaries
            .slice(0, 2)
            .join(", ")} +${expSummaries.length - 2} more`;
        } else {
          condensedExperience = expSummaries.join(", ");
        }

        // Licenses
        const userLicenses =
          licenses
            ?.filter((l) => l.user_id === userId)
            .map((l) => l.license?.name) || [];

        // Locations
        const userLocations =
          locations
            ?.filter((loc) => loc.user_id === userId)
            .map(
              (loc) => `${loc.suburb_city}, ${loc.state} ${loc.postcode || ""}`
            ) || [];

        // Profile photo
        const photoUrl = m.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(m.profile_photo).data.publicUrl
          : "/default-avatar.png";

        return {
          user_id: userId,
          name: `${m.given_name} ${m.family_name}`,
          state: m.state,
          profileImage: photoUrl,
          industries,
          roles,
          experiences: condensedExperience || "No work experience added",
          licenses: userLicenses,
          preferredLocations: userLocations,
          isLiked: likedIds.includes(userId), // ✅ Persist like state
        };
      });

      setAllCandidates(mapped);
      setCandidates(mapped);
    };

    if (employerId) fetchCandidates();
  }, [employerId]);

  // ✅ Toggle like persistence
  const handleLikeCandidate = async (candidateId: string) => {
    const candidate = candidates.find((c) => c.user_id === candidateId);
    if (!candidate || !employerId) return;

    try {
      if (candidate.isLiked) {
        // 🔄 Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liked_whv_id", candidateId)
          .eq("liker_type", "employer");

        setCandidates((prev) =>
          prev.map((c) =>
            c.user_id === candidateId ? { ...c, isLiked: false } : c
          )
        );
      } else {
        // ❤️ Like
        await supabase.from("likes").upsert(
          {
            liker_id: employerId,
            liker_type: "employer",
            liked_whv_id: candidateId,
          },
          { onConflict: "liker_id,liked_whv_id,liker_type" }
        );

        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);

        setCandidates((prev) =>
          prev.map((c) =>
            c.user_id === candidateId ? { ...c, isLiked: true } : c
          )
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const removeFilter = (filterValue: string) => {
    const newFilters = { ...selectedFilters };
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === filterValue) {
        delete newFilters[key];
      }
    });
    setSelectedFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleViewProfile = (candidateId: string) => {
    navigate(`/short-candidate-profile/${candidateId}?from=browse-candidates`);
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedCandidateName("");
  };

  const applyFilters = (filters: any) => {
    let filtered = [...allCandidates];

    if (filters.preferredLocation) {
      filtered = filtered.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(filters.preferredLocation.toLowerCase())
        )
      );
    }

    if (filters.preferredIndustry) {
      filtered = filtered.filter((c) =>
        c.industries.includes(filters.preferredIndustry)
      );
    }

    if (filters.preferredRole) {
      filtered = filtered.filter((c) =>
        c.roles.includes(filters.preferredRole)
      );
    }

    if (filters.experienceIndustry) {
      filtered = filtered.filter((c) =>
        c.experiences.toLowerCase().includes(filters.experienceIndustry.toLowerCase())
      );
    }

    if (filters.licenseRequired) {
      filtered = filtered.filter((c) =>
        c.licenses.includes(filters.licenseRequired)
      );
    }

    setCandidates(filtered);
    setSelectedFilters(filters);
  };

  const handleApplyFilters = (filters: any) => {
    applyFilters(filters);
    setShowFilters(false);
  };

  if (showFilters) {
    return (
      <FilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                  onClick={() => navigate("/employer/dashboard")}
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">
                  Browse Candidates
                </h1>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  placeholder="Search for candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white"
                />
                <button
                  onClick={() => setShowFilters(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <Filter className="text-gray-400" size={20} />
                </button>
              </div>

              {/* Active Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.values(selectedFilters).map((filter, index) => (
                  <div
                    key={`filter-${index}`}
                    className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">{String(filter)}</span>
                    <button
                      onClick={() => removeFilter(String(filter))}
                      className="text-gray-500 hover:text-gray-700 text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Candidates List */}
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.user_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={candidate.profileImage}
                        alt={candidate.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {candidate.industries.join(", ") || "No preferences"}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              {candidate.experiences}
                            </p>
                            <p className="text-sm text-gray-600">
                              Preferred State: {candidate.state}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            onClick={() => handleViewProfile(candidate.user_id)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                          >
                            View Profile
                          </Button>
                          <button
                            onClick={() => handleLikeCandidate(candidate.user_id)}
                            className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={candidate.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          <LikeConfirmationModal
            candidateName={likedCandidateName}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default BrowseCandidates;
