// src/pages/BrowseCandidates.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  experiences: string;
  licenses: string[];
  preferredLocations: string[]; // e.g. "Sydney, New South Wales 2000"
  isLiked?: boolean;
}

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");

  // Filters coming back from FilterPage
  const [selectedFilters, setSelectedFilters] = useState<{
    preferredState?: string;
    preferredCity?: string;
    preferredPostcode?: string;
    candidateIndustry?: string;
    candidateExperience?: string;
  }>({});

  // Data state
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Raw candidate data (for the selected job)
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);

  // ===== Auth -> Employer id
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  // ===== Load employer's ACTIVE jobs (no auto-select)
  useEffect(() => {
    const fetchJobs = async () => {
      if (!employerId) return;
      const { data, error } = await supabase
        .from("job")
        .select("job_id, description, job_status, industry_role(role)")
        .eq("user_id", employerId)
        .eq("job_status", "active");
      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }
      setJobPosts(data || []);
      setSelectedJobId(null); // Must pick a job explicitly
      setAllCandidates([]);   // Clear old candidates if switching accounts
      setSelectedFilters({});
      setSearchQuery("");
    };
    fetchJobs();
  }, [employerId]);

  // ===== Load candidates only after a job is selected
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!employerId || !selectedJobId) return;

      // 1) Makers
      const { data: makers, error: makersError } = await supabase
        .from("whv_maker")
        .select("user_id, given_name, family_name, state, profile_photo, is_profile_visible");
      if (makersError) {
        console.error("Error fetching whv_maker:", makersError);
        return;
      }
      const visibleMakers = (makers || []).filter((m) => m.is_profile_visible);

      // 2) Related tables
      const { data: industries } = (await supabase
        .from("maker_pref_industry")
        .select("user_id, industry ( name )")) as any;

      const { data: experiences } = (await supabase
        .from("maker_work_experience")
        .select("user_id, position, start_date, end_date, industry ( name )")) as any;

      const { data: locations } = (await supabase
        .from("maker_pref_location")
        .select("user_id, state, suburb_city, postcode")) as any;

      const { data: licenses } = (await supabase
        .from("maker_license")
        .select("user_id, license ( name )")) as any;

      // 3) Likes for this job
      const { data: likes } = await supabase
        .from("likes")
        .select("liked_whv_id")
        .eq("liker_id", employerId)
        .eq("liker_type", "employer")
        .eq("liked_job_post_id", selectedJobId);
      const likedIds: string[] = (likes || []).map((l) => l.liked_whv_id);

      // 4) Merge
      const mapped: Candidate[] = visibleMakers.map((m) => {
        const userId = m.user_id;

        const userIndustries: string[] =
          (industries || [])
            .filter((ind: any) => ind.user_id === userId)
            .map((ind: any) => ind.industry?.name)
            .filter(Boolean);

        const userExps = (experiences || []).filter((e: any) => e.user_id === userId);
        const expSummaries: string[] = userExps
          .map((exp: any) => {
            if (!exp.start_date) return null;
            const start = new Date(exp.start_date);
            const end = exp.end_date ? new Date(exp.end_date) : new Date();
            const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            const duration =
              diffYears < 1
                ? `${Math.round(diffYears * 12)} mos`
                : `${Math.round(diffYears)} yrs`;
            return `${exp.industry?.name || "Unknown"} – ${exp.position || "Role"} (${duration})`;
          })
          .filter(Boolean) as string[];

        const condensedExperience =
          expSummaries.length > 2
            ? `${expSummaries.slice(0, 2).join(", ")} +${expSummaries.length - 2} more`
            : expSummaries.join(", ") || "No work experience added";

        const userLicenses: string[] =
          (licenses || [])
            .filter((l: any) => l.user_id === userId)
            .map((l: any) => l.license?.name)
            .filter(Boolean);

        const userLocations: string[] =
          (locations || [])
            .filter((loc: any) => loc.user_id === userId)
            .map(
              (loc: any) =>
                `${loc.suburb_city}, ${loc.state} ${loc.postcode || ""}`.trim()
            )
            .filter(Boolean);

        const photoUrl = m.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(m.profile_photo).data.publicUrl
          : "/default-avatar.png";

        return {
          user_id: userId,
          name: `${m.given_name} ${m.family_name}`,
          state: m.state,
          profileImage: photoUrl,
          industries: userIndustries,
          experiences: condensedExperience,
          licenses: userLicenses,
          preferredLocations: userLocations,
          isLiked: likedIds.includes(userId),
        };
      });

      setAllCandidates(mapped);
    };

    fetchCandidates();
  }, [employerId, selectedJobId]);

  // ===== Derived: apply filters AND search together
  const displayedCandidates = useMemo(() => {
    let list = [...allCandidates];

    const f = selectedFilters;
    const q = searchQuery.trim().toLowerCase();

    // --- Filters ---
    if (f.preferredState) {
      const state = f.preferredState.toLowerCase();
      list = list.filter((c) =>
        c.preferredLocations.some((loc) => loc.toLowerCase().includes(state))
      );
    }

    if (f.preferredCity) {
      const city = f.preferredCity.toLowerCase();
      list = list.filter((c) =>
        c.preferredLocations.some((loc) => loc.toLowerCase().includes(city))
      );
    }

    if (f.preferredPostcode) {
      const pc = f.preferredPostcode;
      list = list.filter((c) =>
        c.preferredLocations.some((loc) => loc.includes(pc))
      );
    }

    if (f.candidateIndustry) {
      const ind = f.candidateIndustry.toLowerCase();
      list = list.filter((c) =>
        c.industries.some((i) => (i || "").toLowerCase() === ind)
      );
    }

    if (f.candidateExperience) {
      const exp = f.candidateExperience.toLowerCase();
      list = list.filter((c) => (c.experiences || "").toLowerCase().includes(exp));
    }

    // --- Search ---
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industries.some((i) => (i || "").toLowerCase().includes(q)) ||
          c.preferredLocations.some((loc) => (loc || "").toLowerCase().includes(q))
      );
    }

    return list;
  }, [allCandidates, selectedFilters, searchQuery]);

  // ===== Like toggle
  const [likeBusy, setLikeBusy] = useState<string | null>(null);
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;
    const candidate = allCandidates.find((c) => c.user_id === candidateId);
    if (!candidate) return;

    setLikeBusy(candidateId);
    try {
      if (candidate.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liked_whv_id", candidateId)
          .eq("liker_type", "employer")
          .eq("liked_job_post_id", selectedJobId);
      } else {
        await supabase.from("likes").upsert(
          {
            liker_id: employerId,
            liker_type: "employer",
            liked_whv_id: candidateId,
            liked_job_post_id: selectedJobId,
          },
          { onConflict: "liker_id,liked_whv_id,liker_type,liked_job_post_id" }
        );
        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }

      // reflect in allCandidates
      setAllCandidates((prev) =>
        prev.map((c) =>
          c.user_id === candidateId ? { ...c, isLiked: !c.isLiked } : c
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setLikeBusy(null);
    }
  };

  // ===== When user removes a chip
  const removeChip = (key: keyof typeof selectedFilters) => {
    const next = { ...selectedFilters, [key]: "" };
    // Clean empty keys to keep chips tidy
    Object.keys(next).forEach((k) => {
      if (!(next as any)[k]) delete (next as any)[k];
    });
    setSelectedFilters(next);
  };

  // ===== Filter page handlers
  const handleApplyFilters = (filters: any) => {
    // Clean empty values so chips don't show blanks
    const cleaned: typeof selectedFilters = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && String(v).trim() !== "") (cleaned as any)[k] = v;
    });
    setSelectedFilters(cleaned);
    setShowFilters(false);
  };

  // ===== UI
  if (showFilters) {
    return (
      <FilterPage onClose={() => setShowFilters(false)} onApplyFilters={handleApplyFilters} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic island */}
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

            {/* Job selector */}
            <div className="px-6 mb-4">
              <Select
                onValueChange={(value) => setSelectedJobId(Number(value))}
                value={selectedJobId ? String(selectedJobId) : ""}
              >
                <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                  <SelectValue placeholder="Select an active job post" />
                </SelectTrigger>
                <SelectContent>
                  {jobPosts.map((job) => (
                    <SelectItem key={job.job_id} value={String(job.job_id)}>
                      {job.industry_role?.role || "Unknown Role"} – {job.description || `Job #${job.job_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search + Filter + Chips (only after a job is chosen) */}
            {selectedJobId && (
              <div className="px-6 mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search for candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white"
                  />
                  <button
                    onClick={() => setShowFilters(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label="Open filters"
                  >
                    <Filter className="text-gray-400" size={20} />
                  </button>
                </div>

                {/* Active filter chips */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedFilters).map(([key, value]) => (
                    value ? (
                      <div
                        key={key}
                        className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                      >
                        <span className="text-sm text-gray-700">{String(value)}</span>
                        <button
                          onClick={() => removeChip(key as keyof typeof selectedFilters)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label={`Remove ${key} filter`}
                        >
                          ×
                        </button>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* Candidate list */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <p className="text-center text-gray-600 mt-10">
                  Please select a job post above to view matching candidates.
                </p>
              ) : displayedCandidates.length === 0 ? (
                <p className="text-center text-gray-600 mt-10">No candidates match this job yet.</p>
              ) : (
                displayedCandidates.map((c) => (
                  <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={c.profileImage}
                        alt={c.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{c.name}</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Preferred Industries:</span>{" "}
                          {c.industries.length ? c.industries.join(", ") : "No preferences"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Work Experience:</span> {c.experiences}
                        </p>
                        {c.licenses.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Licenses:</span> {c.licenses.join(", ")}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Preferred Locations:</span>{" "}
                          {c.preferredLocations.length ? c.preferredLocations.join(", ") : "No preferences"}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() => navigate(`/short-candidate-profile/${c.user_id}`)}
                            className="flex-1 bg-slate-800 text-white rounded-xl h-11"
                          >
                            View Profile
                          </Button>
                          <button
                            disabled={!selectedJobId || likeBusy === c.user_id}
                            onClick={() => handleLikeCandidate(c.user_id)}
                            className={`h-11 w-11 border-2 rounded-xl flex items-center justify-center ${
                              !selectedJobId
                                ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                                : "bg-white border-orange-200 hover:bg-orange-50"
                            }`}
                            aria-disabled={!selectedJobId}
                            aria-label={c.isLiked ? "Unlike candidate" : "Like candidate"}
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

          {/* Bottom nav + like confirmation */}
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
