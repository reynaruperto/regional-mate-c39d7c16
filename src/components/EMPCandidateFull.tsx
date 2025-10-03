import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, MapPin, Award, User, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const EMPCandidateFull: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  
  // Profile data states
  const [profileData, setProfileData] = useState<any>(null);
  const [visaData, setVisaData] = useState<any>(null);
  const [industryPrefs, setIndustryPrefs] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!id) return;
      
      setLoading(true);

      // 1. WHV Maker profile
      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo, state, suburb, postcode, birth_date, nationality")
        .eq("user_id", id)
        .maybeSingle();

      // 2. Visa information
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(`
          expiry_date,
          stage_id,
          country_id,
          visa_stage (label),
          country (name)
        `)
        .eq("user_id", id)
        .maybeSingle();

      setVisaData(visa);

      // 3. Availability
      const { data: availabilityRow } = await supabase
        .from("maker_pref_availability")
        .select("available_from")
        .eq("user_id", id)
        .maybeSingle();

      setAvailableFrom(availabilityRow?.available_from || null);

      // 4. Industry Preferences
      const { data: industryRows } = await supabase
        .from("maker_pref_industry")
        .select("industry (name)")
        .eq("user_id", id);
      
      setIndustryPrefs(
        industryRows?.map((i: any) => i.industry?.name).filter(Boolean) || []
      );

      // 5. Location Preferences
      const { data: locationRows } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", id);
      
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

      // 6. Work Experiences
      const { data: expRows } = await supabase
        .from("maker_work_experience")
        .select("position, company, industry(name), location, start_date, end_date, job_description")
        .eq("user_id", id)
        .order("start_date", { ascending: false });

      setWorkExperiences(expRows || []);

      // 7. Licenses
      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name), other")
        .eq("user_id", id);
      
      setLicenses(
        licenseRows?.map((l) => l.other || l.license?.name).filter(Boolean) || []
      );

      // 8. References
      const { data: refRows } = await supabase
        .from("maker_reference")
        .select("name, business_name, email, mobile_num, role")
        .eq("user_id", id);
      
      setReferences(refRows || []);

      // 9. Signed photo URL
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
        tagline: whv?.tagline || "",
        state: whv?.state,
        suburb: whv?.suburb,
        postcode: whv?.postcode,
        birthDate: whv?.birth_date,
        nationality: whv?.nationality,
        profilePhoto: signedPhoto,
      });

      setLoading(false);
    };

    fetchFullProfile();
  }, [id]);

  const handleBack = () => {
    navigate("/employer/matches?tab=matches");
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Candidate not found</p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Main content container */}
          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Scrollable Content */}
            <div className="flex-1 px-6 pt-16 pb-24 overflow-y-auto">
              {/* Profile Card */}
              <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-lg">
                {/* Match Header */}
                <div className="bg-gradient-to-r from-orange-500 to-blue-900 text-white text-center py-4 rounded-2xl mb-6">
                  <h2 className="text-xl font-bold">🎉 IT'S A MATCH! 🎉</h2>
                  <p className="text-sm mt-1">with {profileData.name.toUpperCase()}</p>
                </div>

                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden">
                    {profileData.profilePhoto ? (
                      <img
                        src={profileData.profilePhoto}
                        alt={profileData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tagline/Quote */}
                {profileData.tagline && (
                  <div className="text-center mb-6 bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 text-sm italic leading-relaxed">
                      "{profileData.tagline}"
                    </p>
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex items-start">
                    <Globe className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                    <div>
                      <span className="font-semibold">Nationality:</span>{" "}
                      {profileData.nationality || "N/A"}
                      {profileData.birthDate && (
                        <span className="text-gray-600">
                          {" "}({calculateAge(profileData.birthDate)} years old)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                    <div>
                      <span className="font-semibold">Current Location:</span>{" "}
                      {[profileData.suburb, profileData.state, profileData.postcode]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </div>
                  </div>

                  {visaData && (
                    <div className="flex items-start">
                      <Award className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-semibold">Visa Type & Expiry:</span>{" "}
                        {visaData.visa_stage?.label || "N/A"} - Expires{" "}
                        {visaData.expiry_date
                          ? new Date(visaData.expiry_date).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </div>
                    </div>
                  )}

                  {availableFrom && (
                    <div className="flex items-start">
                      <Calendar className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-semibold">Availability:</span>{" "}
                        {new Date(availableFrom).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Industry Preferences */}
                {industryPrefs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Briefcase className="w-4 h-4 text-orange-500 mr-2" />
                      Industry Preferences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {industryPrefs.map((ind, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Preferences */}
                {locationPreferences.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 text-orange-500 mr-2" />
                      Willing to Work In
                    </h3>
                    <div className="space-y-2">
                      {locationPreferences.map(([state, suburbs]) => (
                        <div key={state} className="bg-gray-50 rounded-xl p-3">
                          <p className="font-medium text-gray-800 mb-1">{state}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(suburbs as string[]).map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 border border-orange-500 text-orange-600 text-xs rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Licenses */}
                {licenses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Award className="w-4 h-4 text-orange-500 mr-2" />
                      Licenses / Certificates
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {licenses.map((l, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {workExperiences.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Work Experience:
                    </h3>
                    <div className="space-y-3 text-xs bg-gray-50 rounded-xl p-3">
                      {workExperiences.map((exp, index) => {
                        const start = new Date(exp.start_date);
                        const end = exp.end_date ? new Date(exp.end_date) : new Date();
                        
                        return (
                          <div key={index} className="text-gray-700 border-b last:border-0 pb-2 last:pb-0">
                            <div className="font-medium text-sm">
                              {formatDate(start)} - {exp.end_date ? formatDate(end) : "Present"}
                            </div>
                            <div className="font-semibold mt-1">
                              {exp.position} - {exp.company}
                            </div>
                            <div className="text-gray-500">
                              {exp.industry?.name} • {exp.location || "N/A"}
                            </div>
                            {exp.job_description && (
                              <div className="text-gray-600 mt-1 text-xs">
                                {exp.job_description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Job References */}
                {references.length > 0 && (
                  <div className="mb-6 bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">
                      Job Reference{references.length > 1 ? "s" : ""}:
                    </h3>
                    <div className="space-y-3">
                      {references.map((ref, i) => (
                        <div key={i} className="text-sm text-blue-800 bg-white/50 rounded-lg p-3">
                          <div className="font-semibold">{ref.name}</div>
                          {ref.role && <div className="text-xs">{ref.role}</div>}
                          {ref.business_name && (
                            <div className="text-xs text-blue-700 mt-1">{ref.business_name}</div>
                          )}
                          {ref.email && <div className="mt-1">{ref.email}</div>}
                          {ref.mobile_num && <div>{ref.mobile_num}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Details - Highlighted */}
                <div className="bg-gradient-to-r from-orange-500 to-blue-900 text-white rounded-2xl p-6 text-center">
                  <h3 className="font-bold text-lg mb-3">
                    🎉 You've Matched! 🎉
                  </h3>
                  <p className="text-sm text-white/90">
                    Contact details and references are now available above. You can reach out to {profileData.name.split(" ")[0]} directly!
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button - Fixed at bottom */}
            <div className="absolute bottom-8 left-6">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-md hover:bg-gray-50"
                onClick={handleBack}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMPCandidateFull;
