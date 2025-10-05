// src/pages/BrowseCandidates.tsx
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
  user_id: string;
  name: string;
  profileImage: string;
  industries: string[];
  workExpIndustries: string[];
  experiences: string;
  preferredLocations: string[];
  licenses?: string[];
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

  // ---------- helpers ----------
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

      return {
        user_id: row.maker_id || row.user_id,
        name: row.given_name,
        profileImage: resolvePhoto(row.profile_photo),
        industries: row.pref_industries || ["No preferences"],
        workExpIndustries,
        experiences,
        preferredLocations: row.states || ["Not specified"],
        licenses: row.licenses || ["None listed"],
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

  // ---------- lookups ----------
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

  // ---------- fetch candidates ----------
  const fetchCandidates = async (filters: any = {}) => {
    if (!employerId || !selectedJobId) return;

    try {
      // Step 1: Get eligible makers first
      const { data: eligibleMakers, error: err1 } = await (supabase as any).rpc(
        "view_all_eligible_makers",
        {
          p_emp_id: employerId,
          p_job_id: selectedJobId,
        }
      );
      if (err1) throw err1;

      // Step 2: Refine with filter_makers_for_employer (enrich details)
      const { data: enrichedMakers, error: err2 } = await (supabase as any).rpc(
        "filter_makers_for_employer",
        {
          p_emp_id: employerId,
          p_job_id: selectedJobId,
        }
      );
      if (err2) throw err2;

      // Merge enriched data into eligible makers
      const merged = (eligibleMakers || []).map((em: any) => {
        const extra = (enrichedMakers || []).find(
          (fm: any) => fm.maker_id === em.maker_id
        );
        return { ...em, ...extra };
      });

      // Step 3: Fetch likes
      const { data: likes } = await supabase
        .from("likes")
        .select("liked_whv_id")
        .eq("liker_id", employerId)
        .eq("liker_type", "employer")
        .eq("liked_job_post_id", selectedJobId);

      const likedIds = likes?.map((l) => l.liked_whv_id) || [];

      // Step 4: Map and set state
      const mapped = (merged || []).map((row: any) => {
        const c = mapRowsToCandidates([row])[0];
        return { ...c, isLiked: likedIds.includes(c.user_id) };
      });

      setCandidates(mapped);
      setAllCandidates(mapped);
      setSelectedFilters(filters);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
  };

  useEffect(() => {
    if (employerId && selectedJobId) fetchCandidates();
  }, [employerId, selectedJobId]);

  // ---------- search ----------
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
          (c.workExpIndustries as string[]).some((i) => i.toLowerCase().includes(q)) ||
          (c.preferredLocations as string[]).some((l) => l.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, allCandidates]);

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
        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // ---------- render ----------
  if (showFilters) {
    return (
      <FilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={(filters) => fetchCandidates(filters)}
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

            {/* Job Selector */}
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
                      {job.industry_role?.role || "Unknown Role"} – {job.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Candidates */}
            <div className="flex-1 px-6 overflow-y-auto">
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
                  <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                    <div className="flex gap-3 items-start">
                      <img
                        src={c.profileImage}
                        alt={c.name}
                        className="w-14 h-14 rounded-lg object-cover mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {c.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong>{" "}
                          {(c.preferredLocations || []).join(", ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong>{" "}
                          {(c.industries || []).join(", ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Experience:</strong> {c.experiences}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Licenses:</strong>{" "}
                          {(c.licenses || []).join(", ")}
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
                            className="h-10 w-10 bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center hover:bg-orange-50"
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
