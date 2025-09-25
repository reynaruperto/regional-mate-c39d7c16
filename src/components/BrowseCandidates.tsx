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

interface WorkExperience {
  industry?: { name: string };
  position?: string;
  start_date?: string;
  end_date?: string | null;
}

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

// ✅ Helper: bucket years into readable categories
const formatYearsCategory = (startDate: string, endDate?: string | null): string => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (years < 1) return "<1 yr";
  if (years < 3) return "1–2 yrs";
  if (years < 5) return "3–4 yrs";
  if (years < 8) return "5–7 yrs";
  if (years < 11) return "8–10 yrs";
  return "10+ yrs";
};

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");
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
        .select("job_id, description, job_status")
        .eq("user_id", employerId)
        .eq("job_status", "active");

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobPosts(data || []);
        if (data && data.length > 0) setSelectedJobId(data[0].job_id);
      }
    };
    fetchJobs();
  }, [employerId]);

  // ✅ Fetch candidates using backend function
  const fetchCandidates = async (filterState: string | null = null) => {
    if (!selectedJobId) return;

    // 1. Call backend function to get candidate IDs
    const { data: ids, error } = await supabase.rpc("filter_maker_for_employer", {
      p_filter_state: filterState,
    });

    if (error) {
      console.error("Error filtering candidates:", error);
      return;
    }
    if (!ids || ids.length === 0) {
      setCandidates([]);
      setAllCandidates([]);
      return;
    }

    const candidateIds = ids.map((row: any) => row.user_id);

    // 2. Fetch details for those candidates
    const { data: makers } = await supabase
      .from("whv_maker")
      .select("user_id, given_name, family_name, state, profile_photo, is_profile_visible")
      .in("user_id", candidateIds);

    const { data: workExps } = await supabase
      .from("maker_work_experience")
      .select("user_id, position, start_date, end_date, industry(name)")
      .in("user_id", candidateIds);

    const { data: licenses } = await supabase
      .from("maker_license")
      .select("user_id, license(name)")
      .in("user_id", candidateIds);

    const { data: locations } = await supabase
      .from("maker_pref_location")
      .select("user_id, state, suburb_city, postcode")
      .in("user_id", candidateIds);

    // 3. Merge into Candidate objects
    const mapped: Candidate[] =
      makers?.filter((m) => m.is_profile_visible).map((m) => {
        const userId = m.user_id;

        // Work experience
        const exps = workExps?.filter((e) => e.user_id === userId) || [];
        const industries = exps.map((e) => e.industry?.name).filter(Boolean);
        const expSummaries = exps
          .map((exp) => {
            if (!exp.start_date) return null;
            const category = formatYearsCategory(exp.start_date, exp.end_date);
            return `${exp.industry?.name || "Unknown"} – ${exp.position || "Role"} (${category})`;
          })
          .filter(Boolean);

        let condensedExperience = "";
        if (expSummaries.length > 2) {
          condensedExperience = `${expSummaries.slice(0, 2).join(", ")} +${
            expSummaries.length - 2
          } more`;
        } else {
          condensedExperience = expSummaries.join(", ");
        }

        // Licenses
        const userLicenses =
          licenses?.filter((l) => l.user_id === userId).map((l) => l.license?.name) || [];

        // Locations
        const userLocations =
          locations
            ?.filter((loc) => loc.user_id === userId)
            .map((loc) => `${loc.suburb_city}, ${loc.state} ${loc.postcode || ""}`) || [];

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
          experiences: condensedExperience || "No work experience added",
          licenses: userLicenses,
          preferredLocations: userLocations,
          isLiked: false, // We can fetch likes later if needed
        };
      }) || [];

    setAllCandidates(mapped);
    setCandidates(mapped);
  };

  // ✅ Initial fetch
  useEffect(() => {
    if (selectedJobId) {
      fetchCandidates(null);
    }
  }, [selectedJobId]);

  // 🔎 Live search
  useEffect(() => {
    if (!searchQuery) {
      setCandidates(allCandidates);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.industries.some((ind) => ind.toLowerCase().includes(query)) ||
        c.preferredLocations.some((loc) => loc.toLowerCase().includes(query)) ||
        c.experiences.toLowerCase().includes(query)
    );
    setCandidates(filtered);
  }, [searchQuery, allCandidates]);

  // ✅ Apply filters
  const handleApplyFilters = (filters: any) => {
    fetchCandidates(filters.state || null);
    setShowFilters(false);
  };

  // ✅ Like toggle (same as before)
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) {
      alert("Please select a job post first.");
      return;
    }
    setCandidates((prev) =>
      prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: !c.isLiked } : c))
    );
    // Later we persist with supabase.from("likes")
  };

  if (showFilters) {
    return <FilterPage onClose={() => setShowFilters(false)} onApplyFilters={handleApplyFilters} />;
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
                <h1 className="text-lg font-semibold text-gray-900">Browse Candidates</h1>
              </div>
            </div>

            {/* Job Post Selector */}
            <div className="px-6 mb-4">
              <select
                value={selectedJobId ?? ""}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                className="w-full h-12 border border-gray-300 rounded-xl px-3"
              >
                <option value="" disabled>
                  Select job post
                </option>
                {jobPosts.map((job) => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.description || `Job #${job.job_id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="px-6 mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search candidates..."
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

            {/* Candidate List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {candidates.map((c) => (
                <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                  <div className="flex items-start gap-4">
                    <img src={c.profileImage} alt={c.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">{c.name}</h3>
                      <p className="text-sm text-gray-600">{c.industries.join(", ") || "No industries set"}</p>
                      <p className="text-sm text-gray-600">{c.experiences}</p>
                      <p className="text-sm text-gray-600">
                        Preferred: {c.preferredLocations.join(", ") || "No preferences"}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <Button
                          onClick={() => navigate(`/short-candidate-profile/${c.user_id}?from=browse-candidates`)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                        >
                          View Profile
                        </Button>
                        <button
                          onClick={() => handleLikeCandidate(c.user_id)}
                          className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50"
                        >
                          <Heart size={20} className={c.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
