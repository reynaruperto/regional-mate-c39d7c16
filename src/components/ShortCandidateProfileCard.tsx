// src/pages/ShortCandidateProfileCard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [industryPrefs, setIndustryPrefs] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [employerId, setEmployerId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // ✅ Get logged-in employer ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmployerId(user.id);
    };
    getUser();
  }, []);

  // ✅ Load candidate profile
  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);

      // Candidate profile
      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo, state")
        .eq("user_id", candidateId)
        .maybeSingle();

      // Industry Preferences
      const { data: industryRows } = await supabase
        .from("maker_pref_industry")
        .select("industry ( name )")
        .eq("user_id", candidateId);
      setIndustryPrefs(
        industryRows?.map((i: any) => i.industry?.name).filter(Boolean) || []
      );

      // Location Preferences
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

      // Licenses
      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name)")
        .eq("user_id", candidateId);
      setLicenses(
        licenseRows?.map((l) => l.license?.name).filter(Boolean) || []
      );

      // Signed photo
      let signedPhoto: string | null = null;
      if (whv?.profile_photo) {
        let photoPath = whv.profile_photo;
        if (photoPath.includes("/profile_photo/")) {
          photoPath = photoPath.split("/profile_photo/")[1];
        }
        const { data } = await supabase.storage
          .from("profile_photo")
          .createSignedUrl(photoPath, 3600);
        signedPhoto = data?.signedUrl ?? null;
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

  // ✅ Like candidate (job-specific)
  const handleLikeCandidate = async () => {
    if (!employerId || !selectedJobId) {
      alert("Please select a job post first.");
      return;
    }

    await supabase.from("likes").upsert(
      {
        liker_id: employerId,
        liker_type: "employer",
        liked_whv_id: candidateId,
        job_id: selectedJobId,
      },
      { onConflict: "liker_id,liked_whv_id,liker_type,job_id" }
    );

    setShowLikeModal(true);
  };

  const handleCloseLikeModal = () => setShowLikeModal(false);

  // ✅ Back button logic
  const handleBack = () => {
    const fromPage = searchParams.get("from");
    const tab = searchParams.get("tab");

    if (fromPage === "employer-matches") {
      navigate(`/employer/matches?tab=${tab || "matches"}`);
    } else if (fromPage === "browse-candidates") {
      navigate("/browse-candidates");
    } else {
      navigate("/browse-candidates"); // fallback
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Candidate Profile
            </h1>
            <div className="w-10"></div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-orange-500 overflow-hidden mb-3">
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
                <p className="text-sm text-gray-600 mt-1">
                  {profileData?.tagline}
                </p>
              </div>

              {/* Industry Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <Briefcase size={16} className="text-orange-500 mr-2" />
                  Industry Preferences
                </h3>
                {industryPrefs.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {industryPrefs.map((ind, i) => (
                      <li key={i}>{ind}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No industries set</p>
                )}
              </div>

              {/* Location Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin size={16} className="text-orange-500 mr-2" />
                  Location Preferences
                </h3>
                {locationPreferences.length > 0 ? (
                  <div className="space-y-3">
                    {locationPreferences.map(([state, suburbs]) => (
                      <div key={state}>
                        <p className="font-medium text-gray-800">{state}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(suburbs as string[]).map((s, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No location preferences set
                  </p>
                )}
              </div>

              {/* Licenses */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <Award size={16} className="text-orange-500 mr-2" />
                  Licenses & Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {licenses.length > 0 ? (
                    licenses.map((l, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                      >
                        {l}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No licenses added</p>
                  )}
                </div>
              </div>

              {/* Heart to Match */}
              <Button
                onClick={handleLikeCandidate}
                className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <Heart size={18} className="fill-white" /> Heart to Match
              </Button>
            </div>
          </div>

          <LikeConfirmationModal
            candidateName={profileData?.name}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default ShortCandidateProfileCard;
