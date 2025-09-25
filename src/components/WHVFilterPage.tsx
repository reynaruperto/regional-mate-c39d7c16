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

  // ✅ Initial fetch of all candidates (unfiltered)
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!employerId || !selectedJobId) return;

      // Assume we also have a backend function to fetch all visible candidates
      const { data, error } = await supabase.rpc("search_candidates", {
        job_id: selectedJobId,
        state: null,
        city_suburb: null,
        postcode: null,
        industry: null,
        years_experience: null,
        license: null,
      });

      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }

      setAllCandidates(data || []);
      setCandidates(data || []);
    };

    fetchCandidates();
  }, [employerId, selectedJobId]);

  // 🔎 Live search filter
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
        c.preferredLocations.some((loc) => loc.toLowerCase().includes(query))
    );

    setCandidates(filtered);
  }, [searchQuery, allCandidates]);

  // ✅ Like toggle
  const handleLikeCandidate = async (candidateId: string) => {
    if (!employerId || !selectedJobId) {
      alert("Please select a job post first.");
      return;
    }

    const candidate = candidates.find((c) => c.user_id === candidateId);
    if (!candidate) return;

    try {
      if (candidate.isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", employerId)
          .eq("liked_whv_id", candidateId)
          .eq("liker_type", "employer")
          .eq("liked_job_post_id", selectedJobId);

        setCandidates((prev) =>
          prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: false } : c))
        );
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

        setCandidates((prev) =>
          prev.map((c) => (c.user_id === candidateId ? { ...c, isLiked: true } : c))
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // ✅ Apply filters via backend function
  const handleApplyFilters = async (filters: any) => {
    if (!selectedJobId) {
      alert("Please select a job post first.");
      return;
    }

    const { data, error } = await supabase.rpc("search_candidates", {
      job_id: selectedJobId,
      state: filters.state || null,
      city_suburb: filters.citySuburb || null,
      postcode: filters.citySuburb ? filters.citySuburb.split(", ")[1] : null,
      industry: filters.industry || null,
      years_experience: filters.yearsExperience || null,
      license: filters.license || null,
    });

    if (error) {
      console.error("Error fetching filtered candidates:", error);
      return;
    }

    setCandidates(data || []);
    setAllCandidates(data || []);
    setShowFilters(false);
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

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {/* Search Bar */}
              <div className="relative mb-4">
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
                              {candidate.industries.join(", ") || "No industries set"}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              {candidate.experiences}
                            </p>
                            <p className="text-sm text-gray-600">
                              Preferred Locations:{" "}
                              {candidate.preferredLocations.join(", ") || "No preferences"}
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
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default BrowseCandidates;
