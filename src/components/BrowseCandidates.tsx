// src/pages/BrowseCandidates.tsx
import React, { useEffect, useState } from "react";
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
  preferredLocations: string[];
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

  // ✅ Get employer ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch employer job posts
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
      } else {
        setJobPosts(data || []);
        setSelectedJobId(null); // no auto-select
      }
    };
    fetchJobs();
  }, [employerId]);

  // ✅ Fetch candidates scoped to job
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!employerId || !selectedJobId) return;

      const { data: makers } = await supabase
        .from("whv_maker")
        .select("user_id, given_name, family_name, state, profile_photo, is_profile_visible");

      const visibleMakers = makers?.filter((m) => m.is_profile_visible) || [];

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

      const { data: likes } = await supabase
        .from("likes")
        .select("liked_whv_id")
        .eq("liker_id", employerId)
        .eq("liker_type", "employer")
        .eq("liked_job_post_id", selectedJobId);

      const likedIds = likes?.map((l) => l.liked_whv_id) || [];

      const mapped: Candidate[] = visibleMakers.map((m) => {
        const userId = m.user_id;

        const userIndustries =
          industries?.filter((ind) => ind.user_id === userId).map((i) => i.industry?.name) || [];

        const userExps = experiences?.filter((e) => e.user_id === userId) || [];
        const expSummaries = userExps
          .map((exp) => {
            if (!exp.start_date) return null;
            const start = new Date(exp.start_date);
            const end = exp.end_date ? new Date(exp.end_date) : new Date();
            const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            const duration = diffYears < 1 ? `${Math.round(diffYears * 12)} mos` : `${Math.round(diffYears)} yrs`;
            return `${exp.industry?.name || "Unknown"} – ${exp.position || "Role"} (${duration})`;
          })
          .filter(Boolean);

        const condensedExperience =
          expSummaries.length > 2
            ? `${expSummaries.slice(0, 2).join(", ")} +${expSummaries.length - 2} more`
            : expSummaries.join(", ") || "No work experience added";

        const userLicenses =
          licenses?.filter((l) => l.user_id === userId).map((l) => l.license?.name) || [];

        const userLocations =
          locations
            ?.filter((loc) => loc.user_id === userId)
            .map((loc) => `${loc.suburb_city}, ${loc.state} ${loc.postcode || ""}`) || [];

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
      setCandidates(mapped);
    };

    fetchCandidates();
  }, [employerId, selectedJobId]);

  // 🔎 Live search filter
  useEffect(() => {
    if (!searchQuery) {
      setCandidates(allCandidates);
      return;
    }
    const q = searchQuery.toLowerCase();
    setCandidates(
      allCandidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industries.some((i) => i.toLowerCase().includes(q)) ||
          c.preferredLocations.some((loc) => loc.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, allCandidates]);

  // ✅ Apply filters
  const applyFilters = (filters: any) => {
    let filtered = [...allCandidates];

    if (filters.preferredState) {
      filtered = filtered.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(filters.preferredState.toLowerCase())
        )
      );
    }

    if (filters.preferredCity) {
      filtered = filtered.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(filters.preferredCity.toLowerCase())
        )
      );
    }

    if (filters.preferredPostcode) {
      filtered = filtered.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.includes(filters.preferredPostcode)
        )
      );
    }

    if (filters.candidateIndustry) {
      filtered = filtered.filter((c) =>
        c.industries.some(
          (ind) => ind.toLowerCase() === filters.candidateIndustry.toLowerCase()
        )
      );
    }

    if (filters.candidateExperience) {
      filtered = filtered.filter((c) =>
        c.experiences.toLowerCase().includes(filters.candidateExperience.toLowerCase())
      );
    }

    setCandidates(filtered);
    setSelectedFilters(filters);
  };

  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;
    // ... like/unlike logic ...
  };

  if (showFilters) {
    return (
      <FilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={(filters) => {
          applyFilters(filters);
          setShowFilters(false);
        }}
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
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button variant="ghost" size="icon" className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4" onClick={() => navigate("/employer/dashboard")}>
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
                <SelectContent>
                  {jobPosts.map((job) => (
                    <SelectItem key={job.job_id} value={String(job.job_id)}>
                      {job.industry_role?.role || "Unknown Role"} –{" "}
                      {job.description || `Job #${job.job_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search + Filter + Active Filters */}
            {selectedJobId && (
              <div className="px-6 mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedFilters)
                    .filter(([_, value]) => value && value !== "")
                    .map(([key, value]) => (
                      <div
                        key={`filter-${key}`}
                        className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                      >
                        <span className="text-sm text-gray-700">{String(value)}</span>
                        <button
                          onClick={() => {
                            const newFilters = { ...selectedFilters, [key]: "" };
                            applyFilters(newFilters);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Candidate List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <p className="text-center text-gray-600 mt-10">
                  Please select a job post above to view matching candidates.
                </p>
              ) : candidates.length === 0 ? (
                <p className="text-center text-gray-600 mt-10">
                  No candidates match this job yet.
                </p>
              ) : (
                candidates.map((c) => (
                  <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                    <div className="flex items-start gap-4">
                      <img src={c.profileImage} alt={c.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{c.name}</h3>
                        <p className="text-sm text-gray-600"><span className="font-medium">Preferred Industries:</span> {c.industries.join(", ") || "No preferences"}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Work Experience:</span> {c.experiences}</p>
                        {c.licenses.length > 0 && <p className="text-sm text-gray-600"><span className="font-medium">Licenses:</span> {c.licenses.join(", ")}</p>}
                        <p className="text-sm text-gray-600"><span className="font-medium">Preferred Locations:</span> {c.preferredLocations.join(", ") || "No preferences"}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button onClick={() => navigate(`/short-candidate-profile/${c.user_id}`)} className="flex-1 bg-slate-800 text-white rounded-xl h-11">View Profile</Button>
                          <button
                            disabled={!selectedJobId}
                            onClick={() => handleLikeCandidate(c.user_id)}
                            className={`h-11 w-11 border-2 rounded-xl flex items-center justify-center ${
                              !selectedJobId ? "bg-gray-100 border-gray-200 cursor-not-allowed" : "bg-white border-orange-200 hover:bg-orange-50"
                            }`}
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

          <LikeConfirmationModal candidateName={likedCandidateName} onClose={() => setShowLikeModal(false)} isVisible={showLikeModal} />
        </div>
      </div>
    </div>
  );
};

export default BrowseCandidates;
