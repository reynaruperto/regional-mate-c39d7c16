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

      if (!error && data) {
        setJobPosts(data);
      }
    };
    fetchJobs();
  }, [employerId]);

  // ✅ Fetch eligible candidates initially
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!employerId || !selectedJobId) return;

      const { data, error } = await (supabase as any).rpc(
        "view_all_eligible_makers",
        { p_emp_id: employerId, p_job_id: selectedJobId }
      );

      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }

      const mapped: Candidate[] = (data || []).map((row: any) => ({
        user_id: row.maker_id,
        name: row.given_name,
        profileImage: row.profile_photo || "/default-avatar.png",
        industries: row.industry_pref || [],
        workExpIndustries: row.work_experience?.map((we: any) => we.industry) || [],
        experiences:
          row.work_experience
            ?.map((we: any) => `${we.industry}: ${we.years}`)
            .join(", ") || "No experience listed",
        preferredLocations: row.state_pref || [],
        isLiked: false,
      }));

      setAllCandidates(mapped);
      setCandidates(mapped);
    };

    fetchCandidates();
  }, [employerId, selectedJobId]);

  // 🔎 Local search filter
  useEffect(() => {
    if (!searchQuery) {
      setCandidates(allCandidates);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.workExpIndustries.some((ind) => ind.toLowerCase().includes(query)) ||
        c.preferredLocations.some((loc) => loc.toLowerCase().includes(query))
    );

    setCandidates(filtered);
  }, [searchQuery, allCandidates]);

  // ✅ Handle liking
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;

    try {
      await supabase.from("likes").insert({
        liker_id: employerId,
        liker_type: "employer",
        liked_whv_id: candidateId,
        liked_job_post_id: selectedJobId,
      });

      setCandidates((prev) =>
        prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: true } : c))
      );
      setAllCandidates((prev) =>
        prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: true } : c))
      );

      const candidate = candidates.find((c) => c.user_id === candidateId);
      if (candidate) {
        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (error) {
      console.error("Error liking candidate:", error);
    }
  };

  // ✅ Apply filters via DB function
  const handleApplyFilters = async (filters: any) => {
    if (!employerId || !selectedJobId) return;

    try {
      const { data, error } = await (supabase as any).rpc(
        "filter_makers_for_employer",
        {
          p_emp_id: employerId,
          p_job_id: selectedJobId,
          p_filter_state: filters.p_filter_state || null,
          p_filter_suburb_city_postcode: filters.p_filter_suburb_city_postcode || null,
          p_filter_work_industry_id: filters.p_filter_work_industry_id
            ? Number(filters.p_filter_work_industry_id)
            : null,
          p_filter_work_years_experience: filters.p_filter_work_years_experience || null,
          p_filter_industry_ids: filters.p_filter_industry_ids?.map(Number) || null,
          p_filter_license_ids: filters.p_filter_license_ids?.map(Number) || null,
        }
      );

      if (error) {
        console.error("Error applying filters:", error);
        return;
      }

      const mapped: Candidate[] = (data || []).map((row: any) => ({
        user_id: row.maker_id,
        name: row.given_name,
        profileImage: row.profile_photo || "/default-avatar.png",
        industries: row.industry_pref || [],
        workExpIndustries: row.work_experience?.map((we: any) => we.industry) || [],
        experiences:
          row.work_experience
            ?.map((we: any) => `${we.industry}: ${we.years}`)
            .join(", ") || "No experience listed",
        preferredLocations: row.state_pref || [],
        isLiked: false,
      }));

      setCandidates(mapped);
      setAllCandidates(mapped);
      setSelectedFilters(filters);
    } catch (err) {
      console.error("Filter RPC failed:", err);
    }

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

            {/* Search Bar */}
            <div className="relative mb-4 px-6">
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

            {/* Candidates List */}
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
                candidates.map((candidate) => (
                  <div
                    key={candidate.user_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={candidate.profileImage}
                        alt={candidate.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {candidate.name}
                        </h3>

                        <p className="text-sm text-gray-600">
                          <strong>Work Experience:</strong>{" "}
                          {candidate.experiences}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Locations:</strong>{" "}
                          {candidate.preferredLocations.join(", ") || "Not specified"}
                        </p>

                        <p className="text-sm text-gray-600">
                          <strong>Preferred Industries:</strong>{" "}
                          {candidate.industries.join(", ") || "No preferences"}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            onClick={() =>
                              navigate(`/short-candidate-profile/${candidate.user_id}?from=browse-candidates`)
                            }
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-10 rounded-xl"
                          >
                            View Profile
                          </Button>
                          <button
                            onClick={() => handleLikeCandidate(candidate.user_id)}
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
