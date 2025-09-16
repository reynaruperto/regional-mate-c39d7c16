import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import FilterPage from "@/components/FilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  user_id: string;
  name: string;
  state: string;
  profileImage: string | null;
  industries: string[];
}

const BrowseCandidates: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedCandidateName, setLikedCandidateName] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch candidates from Supabase
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data, error } = await supabase
          .from("whv_maker")
          .select(
            `
            user_id,
            given_name,
            family_name,
            state,
            profile_photo,
            maker_preference (
              industry_role (
                industry (
                  name
                )
              )
            )
          `
          )
          .eq("is_profile_visible", true);

        if (error) throw error;

        const mapped: Candidate[] =
          data?.map((c: any) => ({
            user_id: c.user_id,
            name: `${c.given_name} ${c.family_name}`,
            state: c.state,
            profileImage: c.profile_photo
              ? supabase.storage.from("profile_photo").getPublicUrl(c.profile_photo).data
                  .publicUrl
              : null,
            industries:
              c.maker_preference?.map(
                (p: any) => p.industry_role?.industry?.name
              ) || [],
          })) || [];

        setCandidates(mapped);
      } catch (err: any) {
        toast({
          title: "Error loading candidates",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [toast]);

  const handleLikeCandidate = (candidate: Candidate) => {
    setLikedCandidateName(candidate.name);
    setShowLikeModal(true);
  };

  const handleViewProfile = (candidateId: string) => {
    navigate(`/short-candidate-profile/${candidateId}?from=browse-candidates`);
  };

  if (showFilters) {
    return (
      <FilterPage
        onClose={() => setShowFilters(false)}
        onApplyFilters={(filters: any) => setSelectedFilters(filters)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone frame */}
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
              <h1 className="text-lg font-semibold text-gray-900">
                Browse Candidates
              </h1>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
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

              {/* Candidates */}
              {loading ? (
                <p className="text-center text-gray-500 mt-10">Loading...</p>
              ) : candidates.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No candidates available.
                </p>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.user_id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            candidate.profileImage ||
                            "/placeholder-profile.png"
                          }
                          alt={candidate.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {candidate.industries.join(", ") || "No preferences"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Preferred State: {candidate.state || "Not set"}
                          </p>

                          <div className="flex items-center gap-3 mt-4">
                            <Button
                              onClick={() => handleViewProfile(candidate.user_id)}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                            >
                              View Profile
                            </Button>
                            <button
                              onClick={() => handleLikeCandidate(candidate)}
                              className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all"
                            >
                              <Heart size={20} className="text-orange-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Modal */}
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
