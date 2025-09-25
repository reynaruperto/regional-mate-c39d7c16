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

interface WorkExperienceRow {
  user_id: string;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  industry_id: number | null;
}

interface LicenseRow {
  user_id: string;
  license_id: number | null;
}

interface Candidate {
  user_id: string;
  name: string;
  state: string;
  profileImage: string;
  industries: string[];           // from work experience
  experiences: string;            // condensed text
  licenses: string[];
  preferredLocations: string[];
  isLiked?: boolean;
}

// Bucket years into readable categories
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

  // Get employer ID
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

  // Fetch employer job posts
  useEffect(() => {
    (async () => {
      if (!employerId) return;
      const { data, error } = await supabase
        .from("job")
        .select("job_id, description, job_status")
        .eq("user_id", employerId)
        .eq("job_status", "active");
      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }
      setJobPosts(data || []);
      if (data && data.length > 0) setSelectedJobId(data[0].job_id);
    })();
  }, [employerId]);

  // Helper: robust RPC call with fallback to only p_filter_state
  const callFilterMakers = async (args: Record<string, any>) => {
    // first try with full arg set
    let { data, error } = await (supabase as any).rpc("filter_maker_for_employer", args);
    if (error) {
      // if backend doesn’t accept extra args yet, retry with state only
      const looksLikeBadArgs =
        (error as any)?.message?.toLowerCase().includes("named") ||
        (error as any)?.message?.toLowerCase().includes("does not exist") ||
        (error as any)?.details?.toLowerCase().includes("named") ||
        (error as any)?.hint?.toLowerCase().includes("named");
      if (looksLikeBadArgs) {
        const minimal = { p_filter_state: args.p_filter_state ?? null };
        ({ data, error } = await (supabase as any).rpc("filter_maker_for_employer", minimal));
      }
    }
    if (error) throw error;
    return data as { user_id: string }[];
  };

  // Fetch + assemble candidate cards
  const fetchCandidates = async (filters: any = {}) => {
    if (!selectedJobId) return;

    // Parse combined "City (Postcode)" value
    let citySuburb: string | null = null;
    let postcode: string | null = null;
    if (filters.citySuburbPostcode) {
      const m = String(filters.citySuburbPostcode).match(/^(.*)\s\((\d+)\)$/);
      if (m) {
        citySuburb = m[1];
        postcode = m[2];
      }
    }

    // 1) Call backend function to get candidate IDs (with robust fallback)
    let ids: { user_id: string }[] = [];
    try {
      ids = await callFilterMakers({
        p_filter_state: filters.state || null,
        p_city_suburb: citySuburb,
        p_postcode: postcode,
        p_industry: filters.industry || null,
        p_years_experience: filters.yearsExperience || null,
        p_license: filters.license || null,
        // If your function will later take job context, add e.g. p_job_id: selectedJobId
      });
    } catch (err) {
      console.error("filter_maker_for_employer RPC failed:", err);
      setCandidates([]);
      setAllCandidates([]);
      return;
    }

    if (!ids || ids.length === 0) {
      setCandidates([]);
      setAllCandidates([]);
      return;
    }

    const candidateIds = ids.map((r) => r.user_id);

    // 2) Pull raw tables WITHOUT FK-nested selects (more reliable)
    const [{ data: makers }, { data: workExps }, { data: licenseLinks }, { data: prefLocs }] =
      await Promise.all([
        supabase
          .from("whv_maker")
          .select("user_id, given_name, family_name, state, profile_photo, is_profile_visible")
          .in("user_id", candidateIds),
        supabase
          .from("maker_work_experience")
          .select("user_id, position, start_date, end_date, industry_id")
          .in("user_id", candidateIds),
        supabase
          .from("maker_license")
          .select("user_id, license_id")
          .in("user_id", candidateIds),
        supabase
          .from("maker_pref_location")
          .select("user_id, state, suburb_city, postcode")
          .in("user_id", candidateIds),
      ]);

    // Collect referenced IDs to name-map
    const industryIds = Array.from(
      new Set((workExps as WorkExperienceRow[] | null | undefined)?.map((w) => w.industry_id).filter(Boolean) as number[])
    );
    const licenseIds = Array.from(
      new Set((licenseLinks as LicenseRow[] | null | undefined)?.map((l) => l.license_id).filter(Boolean) as number[])
    );

    // Fetch lookup tables (only if needed)
    const [industryRows, licenseRows] = await Promise.all([
      industryIds.length
        ? supabase.from("industry").select("industry_id, name").in("industry_id", industryIds)
        : Promise.resolve({ data: [] as any[] }),
      licenseIds.length
        ? supabase.from("license").select("license_id, name").in("license_id", licenseIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Build maps
    const industryMap = new Map<number, string>(
      (industryRows.data || []).map((r: any) => [r.industry_id as number, r.name as string])
    );
    const licenseMap = new Map<number, string>(
      (licenseRows.data || []).map((r: any) => [r.license_id as number, r.name as string])
    );

    // 3) Merge → Candidate[]
    const mapped: Candidate[] =
      (makers || [])
        .filter((m) => m.is_profile_visible)
        .map((m) => {
          const uid = m.user_id as string;

          // Work experiences for this user
          const expsForUser: WorkExperienceRow[] =
            (workExps || []).filter((w: any) => w.user_id === uid) as WorkExperienceRow[];

          // Industries (deduped)
          const industries = Array.from(
            new Set(
              expsForUser
                .map((w) => (w.industry_id ? industryMap.get(w.industry_id) : undefined))
                .filter(Boolean) as string[]
            )
          );

          // Experience summary lines
          const expLines = expsForUser
            .map((w) => {
              if (!w.start_date) return null;
              const industryName = w.industry_id ? industryMap.get(w.industry_id) : "Unknown";
              const cat = formatYearsCategory(w.start_date, w.end_date);
              return `${industryName || "Unknown"} – ${w.position || "Role"} (${cat})`;
            })
            .filter(Boolean) as string[];

          let experiences = "";
          if (expLines.length > 2) {
            experiences = `${expLines.slice(0, 2).join(", ")} +${expLines.length - 2} more`;
          } else {
            experiences = expLines.join(", ");
          }
          if (!experiences) experiences = "No work experience added";

          // Licenses
          const licenseNames = Array.from(
            new Set(
              (licenseLinks || [])
                .filter((l: any) => l.user_id === uid)
                .map((l: LicenseRow) => (l.license_id ? licenseMap.get(l.license_id) : undefined))
                .filter(Boolean) as string[]
            )
          );

          // Preferred locations
          const preferredLocations = (prefLocs || [])
            .filter((loc: any) => loc.user_id === uid)
            .map((loc: any) => `${loc.suburb_city}, ${loc.state} ${loc.postcode || ""}`);

          // Profile photo
          const photoUrl = m.profile_photo
            ? supabase.storage.from("profile_photo").getPublicUrl(m.profile_photo).data.publicUrl
            : "/default-avatar.png";

          return {
            user_id: uid,
            name: `${m.given_name} ${m.family_name}`,
            state: m.state,
            profileImage: photoUrl,
            industries,
            experiences,
            licenses: licenseNames,
            preferredLocations,
            isLiked: false,
          };
        }) || [];

    setAllCandidates(mapped);
    setCandidates(mapped);
  };

  // Initial fetch (no filters)
  useEffect(() => {
    if (selectedJobId) {
      fetchCandidates({});
    }
  }, [selectedJobId]);

  // Live search
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
          c.preferredLocations.some((l) => l.toLowerCase().includes(q)) ||
          c.experiences.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, allCandidates]);

  // Apply filters from FilterPage
  const handleApplyFilters = (filters: any) => {
    fetchCandidates(filters);
    setShowFilters(false);
  };

  // Simple like toggle (keep local for now)
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) {
      alert("Please select a job post first.");
      return;
    }
    setCandidates((prev) =>
      prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: !c.isLiked } : c))
    );
  };

  if (showFilters) {
    return <FilterPage onClose={() => setShowFilters(false)} onApplyFilters={handleApplyFilters} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50" />

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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white"
              />
              <button
                onClick={() => setShowFilters(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {candidates.map((c) => (
                <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                  <div className="flex items-start gap-4">
                    <img src={c.profileImage} alt={c.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">{c.name}</h3>
                      <p className="text-sm text-gray-600">
                        {c.industries.length ? c.industries.join(", ") : "No industries set"}
                      </p>
                      <p className="text-sm text-gray-600">{c.experiences}</p>
                      <p className="text-sm text-gray-600">
                        Preferred: {c.preferredLocations.length ? c.preferredLocations.join(", ") : "No preferences"}
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
                          <Heart
                            size={20}
                            className={c.isLiked ? "text-orange-500 fill-orange-500" : "text-orange-500"}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!candidates.length && (
                <div className="text-center text-sm text-gray-500 py-12">No candidates match these filters.</div>
              )}
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
