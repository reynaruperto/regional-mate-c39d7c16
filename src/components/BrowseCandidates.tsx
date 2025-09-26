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
  state: string;
  profileImage: string;
  industries: string[];
  workExpIndustries: string[];
  experiences: string;
  licenses: string[];
  preferredLocations: string[];
  isLiked?: boolean;
  totalExperienceMonths: number;
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
        setSelectedJobId(null);
      }
    };
    fetchJobs();
  }, [employerId]);

  // ✅ Fetch candidates scoped to job
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!employerId || !selectedJobId) return;

      const { data: makers, error: makersError } = await supabase
        .from("whv_maker")
        .select("user_id, given_name, family_name, state, profile_photo, is_profile_visible");

      if (makersError) {
        console.error("Error fetching whv_maker:", makersError);
        return;
      }

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

        // Preferences
        const userIndustries: string[] =
          (industries as any[])
            ?.filter((ind) => ind.user_id === userId)
            .map((ind) => ind.industry?.name as string | undefined)
            .filter((n): n is string => Boolean(n)) || [];

        // Work Experiences
        const userExps = (experiences as any[])?.filter((e) => e.user_id === userId) || [];
        let totalMonths = 0;
        const workExpIndustries: string[] = [];

        userExps.forEach((exp) => {
          if (!exp.start_date) return;
          const start = new Date(exp.start_date);
          const end = exp.end_date ? new Date(exp.end_date) : new Date();
          const diffMonths = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
          totalMonths += Math.round(diffMonths);

          if (exp.industry?.name && !workExpIndustries.includes(exp.industry.name)) {
            workExpIndustries.push(exp.industry.name);
          }
        });

        // Licenses
        const userLicenses: string[] =
          (licenses as any[])
            ?.filter((l) => l.user_id === userId)
            .map((l) => l.license?.name as string | undefined)
            .filter((n): n is string => Boolean(n)) || [];

        // Locations (state only)
        const userLocations: string[] =
          (locations as any[])
            ?.filter((loc) => loc.user_id === userId)
            .map((loc) => `${loc.state}`)
            .filter((n): n is string => Boolean(n)) || [];

        const photoUrl = m.profile_photo
          ? supabase.storage.from("profile_photo").getPublicUrl(m.profile_photo).data.publicUrl
          : "/default-avatar.png";

        return {
          user_id: userId,
          name: `${m.given_name} ${m.family_name}`,
          state: m.state,
          profileImage: photoUrl,
          industries: userIndustries,
          workExpIndustries,
          experiences: "",
          licenses: userLicenses,
          preferredLocations: userLocations,
          isLiked: likedIds.includes(userId),
          totalExperienceMonths: totalMonths,
        };
      });

      setAllCandidates(mapped);
      setCandidates(mapped);
    };

    fetchCandidates();
  }, [employerId, selectedJobId]);

  // 🔎 Search filter
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

  // ✅ Handle liking a candidate
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) return;

    try {
      await supabase.from("likes").insert({
        liker_id: employerId,
        liker_type: "employer",
        liked_whv_id: candidateId,
        liked_job_post_id: selectedJobId,
      });

      const updatedCandidates = candidates.map((c) =>
        c.user_id === candidateId ? { ...c, isLiked: true } : c
      );
      setCandidates(updatedCandidates);

      const updatedAllCandidates = allCandidates.map((c) =>
        c.user_id === candidateId ? { ...c, isLiked: true } : c
      );
      setAllCandidates(updatedAllCandidates);

      const candidate = candidates.find((c) => c.user_id === candidateId);
      if (candidate) {
        setLikedCandidateName(candidate.name);
        setShowLikeModal(true);
      }
    } catch (error) {
      console.error("Error liking candidate:", error);
    }
  };

  // ✅ Apply filters
  const applyFilters = (f: any) => {
    let list = [...allCandidates];

    if (f.workExpIndustry) {
      list = list.filter((c) =>
        c.workExpIndustries.some(
          (ind) => ind.toLowerCase() === f.workExpIndustry.toLowerCase()
        )
      );
    }

    if (f.state) {
      list = list.filter((c) => c.state.toLowerCase() === f.state.toLowerCase());
    }

    if (f.suburbPostcode) {
      list = list.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(f.suburbPostcode.toLowerCase())
        )
      );
    }

    if (f.license) {
      list = list.filter((c) =>
        c.licenses.some((lic) => lic.toLowerCase() === f.license.toLowerCase())
      );
    }

    if (f.candidateExperience) {
      list = list.filter((c) => {
        const months = c.totalExperienceMonths || 0;
        switch (f.candidateExperience) {
          case "Less than 1 Year":
            return months < 12;
          case "1-2 Years":
            return months >= 12 && months < 36;
          case "3-5 Years":
            return months >= 36 && months <= 60;
          case "5+ Years":
            return months > 60;
          default:
            return true;
        }
      });
    }

    setCandidates(list);
    setSelectedFilters(f);
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
          {/* Dynamic Island */}
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

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mb-6 px-6">
              {Object.entries(selectedFilters)
                .filter(([_, value]) => value && value !== "")
                .map(([key, value]) => {
                  let label = "";
                  switch (key) {
                    case "workExpIndustry":
                      label = `Work Experience Industry: ${value}`;
                      break;
                    case "state":
                      label = `Preferred Work Location: ${value}`;
                      break;
                    case "suburbPostcode":
                      label = `Location: ${value}`;
                      break;
                    case "license":
                      label = `License: ${value}`;
                      break;
                    case "candidateExperience":
                      label = `Candidate Experience: ${value}`;
                      break;
                    case "industries":
                      label = `Preferred Work Industries: ${value}`;
                      break;
                    default:
                      label = String(value);
                  }

                  return (
                    <div
                      key={`filter-${key}`}
                      className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm text-gray-700">{label}</span>
                      <button
                        onClick={() =>
                          applyFilters({ ...selectedFilters, [key]: "" })
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Candidates List */}
            <div
              className="flex-1 px-6 overflow-y-auto"
              style={{ paddingBottom: "100px" }}
            >
              {!selectedJobId ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>Please select a job post above to view matching candidates.</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No candidates match this job yet.</p>
                </div>
              ) : (
                candidates.map((candidate) => {
                  // Truncate preferred industries
                  const industriesPreview =
                    candidate.industries.length > 2
                      ? `${candidate.industries
                          .slice(0, 2)
                          .join(", ")} +${candidate.industries.length - 2} more`
                      : candidate.industries.join(", ") || "No preferences";

                  return (
                    <div
                      key={candidate.user_id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Profile photo */}
                        <img
                          src={candidate.profileImage}
                          alt={candidate.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />

                        {/* Candidate info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {candidate.name}
                          </h3>

                          {/* Work Exp Industry + Years */}
                          <p className="text-sm text-gray-600">
                            <strong>Work Experience Industry:</strong>{" "}
                            {candidate.workExpIndustries.join(", ") ||
                              "No industry experience listed"}{" "}
                            •{" "}
                            {candidate.totalExperienceMonths >= 12
                              ? `${Math.floor(
                                  candidate.totalExperienceMonths / 12
                                )} years`
                              : `${candidate.totalExperienceMonths} months`}
                          </p>

                          {/* Preferred Location (State only) */}
                          <p className="text-sm text-gray-600">
                            <strong>Preferred Work Location:</strong>{" "}
                            {candidate.state || "Not specified"}
                          </p>

                          {/* Preferred Work Industries */}
                          <p className="text-sm text-gray-600">
                            <strong>Preferred Work Industries:</strong>{" "}
                            {industriesPreview}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-3">
                            <Button
                              onClick={() =>
                                navigate(
                                  `/short-candidate-profile/${candidate.user_id}?from=browse-candidates`
                                )
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
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
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
