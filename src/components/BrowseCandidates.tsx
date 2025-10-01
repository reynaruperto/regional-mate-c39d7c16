import React, { useEffect, useMemo, useState } from "react";
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
  maker_id: string;
  given_name: string;
  profile_photo: string;
  work_experience: { industry: string; years: string }[];
  state_pref: string[];       // array of state names
  industry_pref: string[];    // array of industry names
  isLiked?: boolean;
}

type Filters = {
  p_filter_state?: string | null;
  p_filter_suburb_city_postcode?: string | null;
  p_filter_work_industry_id?: number | null;   // single industry id
  p_filter_work_years_experience?: string | null; // 'None','<1','1-2','3-4','5-7','8-10','10+'
  p_filter_industry_ids?: number[] | null;     // preferred industry ids
  p_filter_license_ids?: number[] | null;      // license ids
};

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();

  // auth / job
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // data
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);

  // refs to map IDs -> names for chips
  const [industriesRef, setIndustriesRef] = useState<{ id: number; name: string }[]>([]);
  const [licensesRef, setLicensesRef] = useState<{ id: number; name: string }[]>([]);

  // ui
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Filters>({});
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");

  // ---------------------------
  // helpers to map IDs -> names
  // ---------------------------
  const industryNameById = useMemo(
    () => new Map(industriesRef.map((i) => [i.id, i.name])),
    [industriesRef]
  );
  const licenseNameById = useMemo(
    () => new Map(licensesRef.map((l) => [l.id, l.name])),
    [licensesRef]
  );

  const resolveChipValue = (key: keyof Filters, value: number | string) => {
    if (key === "p_filter_industry_ids" || key === "p_filter_work_industry_id") {
      const id = Number(value);
      return industryNameById.get(id) ?? String(value);
    }
    if (key === "p_filter_license_ids") {
      const id = Number(value);
      return licenseNameById.get(id) ?? String(value);
    }
    return String(value);
  };

  // ---------------------------
  // auth + static refs
  // ---------------------------
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  // load job posts for employer (active only)
  useEffect(() => {
    const fetchJobs = async () => {
      if (!employerId) return;
      const { data, error } = await supabase
        .from("job")
        .select("job_id, description, job_status, industry_role(role), suburb_city, state")
        .eq("user_id", employerId)
        .eq("job_status", "active");
      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }
      setJobPosts(data || []);
    };
    fetchJobs();
  }, [employerId]);

  // load industry + license refs for chips
  useEffect(() => {
    const loadRefs = async () => {
      const { data: inds } = await supabase.from("industry").select("industry_id, name");
      if (inds) setIndustriesRef(inds.map((r) => ({ id: r.industry_id, name: r.name })));

      const { data: lic } = await supabase.from("license").select("license_id, name");
      if (lic) setLicensesRef(lic.map((r) => ({ id: r.license_id, name: r.name })));
    };
    loadRefs();
  }, []);

  // ---------------------------
  // fetchers
  // ---------------------------
  const mapRows = (rows: any[]): Candidate[] =>
    rows.map((row: any) => {
      const photo =
        row.profile_photo && row.profile_photo.startsWith("http")
          ? row.profile_photo
          : row.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(row.profile_photo).data.publicUrl
          : "/default-avatar.png";

      return {
        maker_id: row.maker_id,
        given_name: row.given_name,
        profile_photo: photo,
        work_experience: row.work_experience || [],
        state_pref: row.state_pref || row.states || [],            // handle either name used by SQL
        industry_pref: row.industry_pref || row.pref_industries || [],
        isLiked: false,
      };
    });

  const fetchDefaultCandidates = async () => {
    if (!employerId || !selectedJobId) return;
    const { data, error } = await (supabase as any).rpc("view_all_eligible_makers", {
      p_emp_id: employerId,
      p_job_id: selectedJobId,
    });
    if (error) {
      console.error("Error fetching default candidates:", error);
      return;
    }
    const mapped = mapRows(data || []);
    setAllCandidates(mapped);
    setCandidates(mapped);
  };

  const applyFiltersRPC = async (filters: Filters) => {
    if (!employerId || !selectedJobId) return;

    const { data, error } = await (supabase as any).rpc("filter_makers_for_employer", {
      p_emp_id: employerId,
      p_job_id: selectedJobId,
      p_filter_state: filters.p_filter_state ?? null,
      p_filter_suburb_city_postcode: filters.p_filter_suburb_city_postcode ?? null,
      p_filter_work_industry_id: filters.p_filter_work_industry_id ?? null,
      p_filter_work_years_experience: filters.p_filter_work_years_experience ?? null,
      p_filter_industry_ids: filters.p_filter_industry_ids ?? null,
      p_filter_license_ids: filters.p_filter_license_ids ?? null,
    });

    if (error) {
      console.error("Error applying filters:", error);
      return;
    }

    const mapped = mapRows(data || []);
    setCandidates(mapped);
    setAllCandidates(mapped);
  };

  // when job changes, load default list
  useEffect(() => {
    if (selectedJobId) {
      applyFiltersRPC(selectedFilters || {}).catch(() => {});
      if (!selectedFilters || Object.keys(selectedFilters).length === 0) {
        fetchDefaultCandidates();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, employerId]);

  // ---------------------------
  // search (client-side)
  // ---------------------------
  useEffect(() => {
    if (!searchQuery) {
      setCandidates(allCandidates);
      return;
    }
    const q = searchQuery.toLowerCase();
    setCandidates(
      allCandidates.filter(
        (c) =>
          c.given_name.toLowerCase().includes(q) ||
          c.state_pref.join(", ").toLowerCase().includes(q) ||
          c.industry_pref.join(", ").toLowerCase().includes(q) ||
          (c.work_experience || [])
            .map((we) => `${we.industry} ${we.years}`)
            .join(" ")
            .toLowerCase()
            .includes(q)
      )
    );
  }, [searchQuery, allCandidates]);

  // ---------------------------
  // like
  // ---------------------------
  const handleLikeCandidate = async (makerId: string) => {
    if (!employerId || !selectedJobId) return;
    try {
      await supabase.from("likes").insert({
        liker_id: employerId,
        liker_type: "employer",
        liked_whv_id: makerId,
        liked_job_post_id: selectedJobId,
      });
      setCandidates((prev) =>
        prev.map((c) => (c.maker_id === makerId ? { ...c, isLiked: true } : c))
      );
      const cand = candidates.find((c) => c.maker_id === makerId);
      if (cand) {
        setLikedCandidateName(cand.given_name);
        setShowLikeModal(true);
      }
    } catch (e) {
      console.error("Error liking candidate:", e);
    }
  };

  // ---------------------------
  // filter modal handlers
  // ---------------------------
  const openFilters = () => setShowFilters(true);

  const handleApplyFilters = async (filters: Filters) => {
    setSelectedFilters(filters);
    if (Object.keys(filters).length === 0) {
      await fetchDefaultCandidates();
    } else {
      await applyFiltersRPC(filters);
    }
    setShowFilters(false);
  };

  const handleRemoveFilter = async (key: keyof Filters, value?: number | string) => {
    const updated: Filters = { ...selectedFilters };
    if (key === "p_filter_industry_ids" || key === "p_filter_license_ids") {
      const arr = (updated[key] as number[] | null) ?? [];
      if (Array.isArray(arr) && value != null) {
        updated[key] = arr.filter((v) => v !== Number(value));
        if ((updated[key] as number[]).length === 0) updated[key] = null;
      }
    } else if (key === "p_filter_work_industry_id") {
      updated[key] = null;
    } else {
      // strings
      updated[key] = null;
    }

    // remove empty keys
    Object.keys(updated).forEach((k) => {
      const v = (updated as any)[k];
      if (v == null || (Array.isArray(v) && v.length === 0)) delete (updated as any)[k];
    });

    setSelectedFilters(updated);
    if (Object.keys(updated).length === 0) {
      await fetchDefaultCandidates();
    } else {
      await applyFiltersRPC(updated);
    }
  };

  const handleClearAll = async () => {
    setSelectedFilters({});
    await fetchDefaultCandidates();
  };

  const hasAnyFilters = Object.keys(selectedFilters).length > 0;

  // ---------------------------
  // UI
  // ---------------------------
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
          {/* Dynamic Island */}
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
                onValueChange={(val) => setSelectedJobId(Number(val))}
                value={selectedJobId ? String(selectedJobId) : ""}
              >
                <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                  <SelectValue placeholder="Select an active job post" />
                </SelectTrigger>
                <SelectContent>
                  {jobPosts.map((job) => (
                    <SelectItem key={job.job_id} value={String(job.job_id)}>
                      {job.industry_role?.role || "Unknown Role"} –{" "}
                      {job.suburb_city || "Location"} {job.state ? `(${job.state})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={!selectedJobId}
              />
              <button
                onClick={openFilters}
                className="absolute right-9 top-1/2 -translate-y-1/2 disabled:opacity-50"
                disabled={!selectedJobId}
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Applied Filter Chips */}
            {hasAnyFilters && (
              <div className="px-6 mb-3 flex flex-wrap gap-2 items-center">
                {/* p_filter_state */}
                {selectedFilters.p_filter_state && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    State: {selectedFilters.p_filter_state}
                    <button onClick={() => handleRemoveFilter("p_filter_state")}>
                      <X size={14} />
                    </button>
                  </span>
                )}

                {/* p_filter_suburb_city_postcode */}
                {selectedFilters.p_filter_suburb_city_postcode && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    Suburb/Postcode: {selectedFilters.p_filter_suburb_city_postcode}
                    <button onClick={() => handleRemoveFilter("p_filter_suburb_city_postcode")}>
                      <X size={14} />
                    </button>
                  </span>
                )}

                {/* p_filter_work_industry_id */}
                {selectedFilters.p_filter_work_industry_id != null && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    Work Exp Industry:{" "}
                    {resolveChipValue(
                      "p_filter_work_industry_id",
                      selectedFilters.p_filter_work_industry_id
                    )}
                    <button onClick={() => handleRemoveFilter("p_filter_work_industry_id")}>
                      <X size={14} />
                    </button>
                  </span>
                )}

                {/* p_filter_work_years_experience */}
                {selectedFilters.p_filter_work_years_experience && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    Experience: {selectedFilters.p_filter_work_years_experience}
                    <button onClick={() => handleRemoveFilter("p_filter_work_years_experience")}>
                      <X size={14} />
                    </button>
                  </span>
                )}

                {/* p_filter_industry_ids */}
                {selectedFilters.p_filter_industry_ids?.map((id) => (
                  <span
                    key={`ind-${id}`}
                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    Pref Industry: {resolveChipValue("p_filter_industry_ids", id)}
                    <button onClick={() => handleRemoveFilter("p_filter_industry_ids", id)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}

                {/* p_filter_license_ids */}
                {selectedFilters.p_filter_license_ids?.map((id) => (
                  <span
                    key={`lic-${id}`}
                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    License: {resolveChipValue("p_filter_license_ids", id)}
                    <button onClick={() => handleRemoveFilter("p_filter_license_ids", id)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}

                <button
                  onClick={handleClearAll}
                  className="ml-1 text-sm text-gray-600 underline"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>Please select a job post above to view matching candidates.</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No candidates match your filters yet.</p>
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate.maker_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={candidate.profile_photo}
                        alt={candidate.given_name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1 border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {candidate.given_name}
                        </h3>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong>{" "}
                          {candidate.state_pref.length
                            ? candidate.state_pref.join(", ")
                            : "Not specified"}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong>{" "}
                          {candidate.industry_pref.length
                            ? candidate.industry_pref.join(", ")
                            : "No preferences"}
                        </p>

                        {candidate.work_experience?.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <strong>Experience:</strong>{" "}
                            {candidate.work_experience
                              .map((we) => `${we.industry}: ${we.years}`)
                              .join(", ")}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() =>
                              navigate(
                                `/short-candidate-profile/${candidate.maker_id}?from=browse-candidates`
                              )
                            }
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                          >
                            View Profile
                          </Button>
                          <button
                            onClick={() => handleLikeCandidate(candidate.maker_id)}
                            className="h-10 w-10 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={18}
                              className={
                                candidate.isLiked
                                  ? "text-orange-500 fill-orange-500"
                                  : "text-orange-500"
                              }
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

          {/* Bottom Navigation + Modal */}
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
