import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Briefcase, MapPin, Award, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";
import { supabase } from "@/integrations/supabase/client";

interface ShortCandidateProfileCardProps {
  candidateId: string;
}

const ShortCandidateProfileCard: React.FC<ShortCandidateProfileCardProps> = ({
  candidateId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showLikeModal, setShowLikeModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [industryPrefs, setIndustryPrefs] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [hasAlreadyLiked, setHasAlreadyLiked] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();

    // Get job ID from navigation state or search params
    const jobIdFromState = (location.state as any)?.jobId;
    const jobIdFromParams = searchParams.get("jobId");
    
    if (jobIdFromState) {
      setSelectedJobId(String(jobIdFromState));
    } else if (jobIdFromParams) {
      setSelectedJobId(jobIdFromParams);
    }
  }, [location.state, searchParams]);

  // Check if already liked
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!employerId || !selectedJobId || !candidateId) return;

      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", employerId)
        .eq("liker_type", "employer")
        .eq("liked_whv_id", candidateId)
        .eq("liked_job_post_id", Number(selectedJobId))
        .maybeSingle();

      setHasAlreadyLiked(!!data);
    };

    checkIfLiked();
  }, [employerId, selectedJobId, candidateId]);

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);

      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo, state")
        .eq("user_id", candidateId)
        .maybeSingle();

      const { data: availabilityRow } = await supabase
        .from("maker_pref_availability")
        .select("available_from")
        .eq("user_id", candidateId)
        .maybeSingle();
      if (availabilityRow?.available_from)
        setAvailableFrom(availabilityRow.available_from);

      const { data: industryRows } = await supabase
        .from("maker_pref_industry")
        .select("industry ( name )")
        .eq("user_id", candidateId);
      setIndustryPrefs(
        industryRows?.map((i: any) => i.industry?.name).filter(Boolean) || []
      );

      const { data: locationRows } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", candidateId);
      if (locationRows) {
        const grouped: Record<string, string[]> = {};
        locationRows.forEach((loc) => {
          const state = loc.state;
          const suburb = `${loc.suburb_city} (${loc.postcode})`;
          if (!grouped[state]) grouped[state] = [];
          if (!grouped[state].includes(suburb)) grouped[state].push(suburb);
        });
        setLocationPreferences(Object.entries(grouped));
      }

      const { data: expRows } = await supabase
        .from("maker_work_experience")
        .select("position, company, industry(name), location, start_date, end_date")
        .eq("user_id", candidateId)
        .order("start_date", { ascending: false });
      setWorkExperiences(expRows || []);

      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name)")
        .eq("user_id", candidateId);
      setLicenses(
        licenseRows?.map((l) => l.license?.name).filter(Boolean) || []
      );

      let signedPhoto: string | null = null;
      if (whv?.profile_photo) {
        if (whv.profile_photo.startsWith("http")) {
          signedPhoto = whv.profile_photo;
        } else {
          const { data } = supabase.storage
            .from("profile_photo")
            .getPublicUrl(whv.profile_photo);
          signedPhoto = data.publicUrl;
        }
      }

      setProfileData({
        name: [whv?.given_name, whv?.middle_name, whv?.family_name]
          .filter(Boolean)
          .join(" "),
        tagline: whv?.tagline || "No tagline added",
        state: whv?.state,
        profilePhoto: signedPhoto,
      });

      setLoading(false);
    };

    fetchCandidate();
  }, [candidateId]);

  const handleLikeCandidate = async () => {
    if (hasAlreadyLiked) {
      alert("You've already liked this candidate for this job!");
      return;
    }

    if (!employerId || !selectedJobId) {
      alert("Please select a job post first.");
      return;
    }

    try {
      const { error } = await supabase.from("likes").insert([{
        liker_id: employerId,
        liker_type: "employer",
        liked_whv_id: candidateId,
        liked_job_post_id: Number(selectedJobId),
      }]);

      if (error) {
        if (error.code === "23505") {
          setHasAlreadyLiked(true);
          alert("You've already liked this candidate for this job!");
        } else {
          console.error("Error liking candidate:", error);
          alert("Failed to like candidate. Please try again.");
        }
      } else {
        setHasAlreadyLiked(true);
        setShowLikeModal(true);
      }
    } catch (err) {
      console.error("Error inserting like:", err);
    }
  };

  // ✅ Unified Back Handler
  const handleBack = () => {
    const fromPage = (location.state as any)?.from || searchParams.get("from");

    if (fromPage === "notifications") {
      navigate("/employer/notifications", { state: { refreshCandidates: true } });
    } else if (fromPage === "matches") {
      navigate("/employer/matches", { state: { tab: "matches", refreshMatches: true } });
    } else if (fromPage === "topRecommended") {
      navigate("/employer/matches", { state: { tab: "topRecommended", refreshMatches: true } });
    } else if (fromPage === "browse-candidates") {
      navigate("/browse-candidates", { state: { refreshCandidates: true } });
    } else if (fromPage === "employer-matches") {
      const tab = (location.state as any)?.tab || "matches";
      navigate("/employer/matches", { state: { tab, refreshMatches: true } });
    } else {
      navigate(-1);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold">Candidate Profile</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#EC5823] rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#EC5823] overflow-hidden mb-3">
                  {profileData?.profilePhoto ? (
                    <img
                      src={profileData.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profileData?.name}
                </h2>
                <p className="text-sm text-gray-600">{profileData?.tagline}</p>
                {availableFrom && (
                  <p className="text-sm text-gray-600 mt-1">
                    Available from:{" "}
                    <span className="font-medium text-gray-900">
                      {new Date(availableFrom).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
              </div>

              {/* Industry Preferences */}
              {industryPrefs.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                    <Briefcase
                      size={16}
                      className="mr-2 text-[#EC5823]"
                    />{" "}
                    Industry Preferences
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {industryPrefs.map((ind, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border text-xs rounded-full"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Preferences */}
              {locationPreferences.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                    <MapPin size={16} className="mr-2 text-[#EC5823]" /> Location
                    Preferences
                  </h3>
                  {locationPreferences.map(([state, suburbs]) => (
                    <div key={state} className="mb-2">
                      <p className="font-medium">{state}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(suburbs as string[]).map((s, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 border text-xs rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Work Experience */}
              {workExperiences.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                    <Briefcase
                      size={16}
                      className="mr-2 text-[#EC5823]"
                    />{" "}
                    Work Experience
                  </h3>
                  <div className="space-y-3 text-sm">
                    {workExperiences.slice(0, 2).map((exp, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-3 text-gray-700"
                      >
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-gray-600">
                          {exp.company} • {exp.industry?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(exp.start_date).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          –{" "}
                          {exp.end_date
                            ? new Date(exp.end_date).toLocaleDateString(
                                "en-US",
                                { month: "short", year: "numeric" }
                              )
                            : "Present"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Licenses */}
              {licenses.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                    <Award size={16} className="mr-2 text-[#EC5823]" /> Licenses
                    & Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border text-xs rounded-full"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Heart Button */}
              <Button
                onClick={handleLikeCandidate}
                disabled={hasAlreadyLiked}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md ${
                  hasAlreadyLiked
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#EC5823] hover:bg-orange-600"
                } text-white`}
              >
                <Heart size={18} className="text-white" fill={hasAlreadyLiked ? "white" : "none"} />
                {hasAlreadyLiked ? "Already Liked" : "Heart to Match"}
              </Button>
            </div>
          </div>

          {/* Like Modal */}
          <LikeConfirmationModal
            candidateName={profileData?.name}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default ShortCandidateProfileCard;
