import React, { useEffect, useState } from "react";
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
  work_experience: any;
  maker_states: string[];
  pref_industries: string[];
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

  const [industriesMap, setIndustriesMap] = useState<Record<number, string>>({});
  const [licensesMap, setLicensesMap] = useState<Record<number, string>>({});

  const resolvePhoto = (val?: string | null) => {
    if (!val) return "/default-avatar.png";
    if (val.startsWith("http")) return val;
    return supabase.storage.from("profile_photo").getPublicUrl(val).data.publicUrl;
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: inds } = await supabase.from("industry").select("industry_id, name");
      setIndustriesMap(
        (inds || []).reduce((acc: Record<number, string>, r: any) => {
          acc[r.industry_id] = r.name;
          return acc;
        }, {})
      );

      const { data: lic } = await supabase.from("license").select("license_id, name");
      setLicensesMap(
        (lic || []).reduce((acc: Record<number, string>, r: any) => {
          acc[r.license_id] = r.name;
          return acc;
        }, {})
      );
    })();
  }, []);

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

  const fetchCandidates = async (filters: any = {}) => {
    if (!employerId || !selectedJobId) return;

    const { data: makers, error } = await (supabase as any).rpc("filter_makers_for_employer", {
      p_emp_id: employerId,
      p_job_id: selectedJobId,
      p_filter_state: filters.p_filter_state || null,
      p_filter_suburb_city_postcode: filters.p_filter_suburb_city_postcode || null,
      p_filter_work_industry_id: filters.p_filter_work_industry_id || null,
      p_filter_work_years_experience: filters.p_filter_work_years_experience || null,
      p_filter_industry_ids: filters.p_filter_industry_ids
        ? [Number(filters.p_filter_industry_ids)]
        : null,
      p_filter_license_ids: filters.p_filter_license_ids
        ? [Number(filters.p_filter_license_ids)]
        : null,
    });

    if (error) {
      console.error("RPC error:", error);
      return;
    }

    const { data: likes } = await supabase
      .from("likes")
      .select("liked_whv_id")
      .eq("liker_id", employerId)
      .eq("liker_type", "employer")
      .eq("liked_job_post_id", selectedJobId);

    const likedIds = likes?.map((l) => l.liked_whv_id) || [];

    const mapped: Candidate[] = (makers || []).map((row: any) => ({
      maker_id: row.maker_id,
      given_name: row.given_name,
      profile_photo: resolvePhoto(row.profile_photo),
      work_experience: row.work_experience || [],
      maker_states: row.maker_states || [],
      pref_industries: row.pref_industries || [],
      licenses: row.licenses || [],
      isLiked: likedIds.includes(row.maker_id),
    }));

    setCandidates(mapped);
    setAllCandidates(mapped);
    setSelectedFilters(filters);
  };

  useEffect(() => {
    if (employerId && selectedJobId) fetchCandidates();
  }, [employerId, selectedJobId]);

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
          c.pref_industries.some((i) => i.toLowerCase().includes(q)) ||
          c.maker_states.some((l) => l.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, allCandidates]);

  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;
    const candidate = candidates.find((c) => c.maker_id === candidateId);
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
          prev.map((c) => (c.maker_id === candidateId ? { ...c, isLiked: false } : c))
        );
        setAllCandidates((prev) =>
          prev.map((c) => (c.maker_id === candidateId ? { ...c, isLiked: false } : c))
        );
      } else {
        await supabase.from("likes").insert({
          liker_id: employerId,
          liker_type: "employer",
          liked_whv_id: candidateId,
          liked_job_post_id: selectedJobId,
        });

        setCandidates((prev) =>
          prev.map((c) => (c.maker_id === candidateId ? { ...c, isLiked: true } : c))
        );
        setAllCandidates((prev) =>
          prev.map((c) => (c.maker_id === candidateId ? { ...c, isLiked: true } : c))
        );

        setLikedCandidateName(candidate.given_name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleApplyFilters = async (filters: any) => {
    await fetchCandidates(filters);
    setShowFilters(false);
  };

  const removeFilter = async (key: string) => {
    const updated = { ...selectedFilters };
    delete updated[key];
    await fetchCandidates(updated);
  };

  const chipLabel = (k: string, v: string) => {
    switch (k) {
      case "p_filter_work_industry_id":
        return `Work Exp Industry: ${industriesMap[Number(v)] || v}`;
      case "p_filter_industry_ids":
        return `Preferred Industry: ${industriesMap[Number(v)] || v}`;
      case "p_filter_license_ids":
        return `License: ${licensesMap[Number(v)] || v}`;
      default:
        return v;
    }
  };

  const dropdownClasses =
    "w-[var(--radix-select-trigger-width)] max-w-full max-h-40 overflow-y-auto text-sm rounded-xl border bg-white shadow-lg";
  const itemClasses = "py-2 px-3 whitespace-normal break-words leading-snug text-sm";

  return (
    <div className="relative min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {showFilters && (
        <div className="absolute inset-0 z-50 bg-white rounded-[48px] overflow-hidden">
          <FilterPage onClose={() => setShowFilters(false)} onApplyFilters={handleApplyFilters} />
        </div>
      )}

      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50" />
          <div className="w-full h-full flex flex-col relative bg-gray-50">
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

            <div className="px-6 mb-4">
              <Select
                onValueChange={(value) => setSelectedJobId(Number(value))}
                value={selectedJobId ? String(selectedJobId) : ""}
              >
                <SelectTrigger className="w-full h-12 border border-gray-300 rounded-xl px-3 bg-white">
                  <SelectValue placeholder="Select an active job post" />
                </SelectTrigger>
                <SelectContent className={dropdownClasses}>
                  {jobPosts.map((job) => (
                    <SelectItem key={job.job_id} value={String(job.job_id)} className={itemClasses}>
                      {job.industry_role?.role || "Unknown Role"} –{" "}
                      {job.description || `Job #${job.job_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative mb-2 px-6">
              <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search for candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white w-full"
              />
              <button
                onClick={() => setShowFilters(true)}
                className="absolute right-9 top-1/2 -translate-y-1/2 z-50 cursor-pointer"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {Object.keys(selectedFilters).length > 0 && (
              <div className="px-6 flex flex-wrap gap-2 mb-3">
                {Object.entries(selectedFilters).map(([k, v]) => {
                  if (!v) return null;
                  const value = String(v);
                  return (
                    <span
                      key={k}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                    >
                      {chipLabel(k, value)}
                      <X size={12} className="cursor-pointer" onClick={() => removeFilter(k)} />
                    </span>
                  );
                })}
                <button
                  onClick={() => {
                    setSelectedFilters({});
                    fetchCandidates({});
                  }}
                  className="text-xs text-blue-600 underline"
                >
                  Clear All
                </button>
              </div>
            )}

            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {!selectedJobId ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>Please select a job post above to view matching candidates.</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No candidates match this job yet.</p>
                </div>
              ) : (
                candidates.map((c) => (
                  <div
                    key={c.maker_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={c.profile_photo}
                        alt={c.given_name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {c.given_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong>{" "}
                          {c.maker_states.join(", ") || "Not specified"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong>{" "}
                          {c.pref_industries.join(", ") || "No preferences"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Licenses:</strong> {c.licenses.join(", ") || "None"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Experience:</strong>{" "}
                          {Array.isArray(c.work_experience)
                            ? c.work_experience
                                .map((we: any) => `${we.industry}: ${we.years}`)
                                .join(", ")
                            : "No experience listed"}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() =>
                              navigate(
                                `/short-candidate-profile/${c.maker_id}?from=browse-candidates`
                              )
                            }
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                          >
                            View Profile
                          </Button>
                          <button
                            onClick={() => handleLikeCandidate(c.maker_id)}
                            className="h-10 w-10 flex-shrink-0 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                          >
                            <Heart
                              size={20}
                              className={
                                c.isLiked
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
