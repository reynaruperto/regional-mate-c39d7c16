// src/pages/EMPCandidateFull.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Award,
  User,
  Calendar,
  FileText,
  Phone,
  Mail,
} from "lucide-react";
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

      // 1. Candidate profile
      const { data: whv } = await supabase
        .from("whv_maker")
        .select(
          "given_name, middle_name, family_name, tagline, profile_photo, state, suburb, postcode, birth_date, nationality, mobile_num"
        )
        .eq("user_id", id)
        .maybeSingle();

      // 2. Visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          "expiry_date, stage_id, country_id, visa_stage (label), country (name)"
        )
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
        .select(
          "position, company, industry(name), location, start_date, end_date, job_description"
        )
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

      // 9. Candidate email from profile table
      const { data: profileRow } = await supabase
        .from("profile")
        .select("email")
        .eq("user_id", id)
        .maybeSingle();

      // 10. Signed profile photo
      let signedPhoto: string | null = null;
      if (whv?.profile_photo) {
        let path = whv.profile_photo;
        if (path.includes("/profile_photo/")) {
          path = path.split("/profile_photo/")[1];
        }
        const { data } = await supabase.storage
          .from("profile_photo")
          .createSignedUrl(path, 3600);
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
        phone: whv?.mobile_num || "",
        email: profileRow?.email || "",
      });

      setLoading(false);
    };

    fetchFullProfile();
  }, [id]);

  const handleBack = () => {
    navigate("/employer/matches?tab=matches");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Loading profile...</p>
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
      {/* Phone Frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50" />

          {/* Header */}
          <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between flex-shrink-0">
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
            <div className="w-10" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-orange-500 overflow-hidden mb-3">
                  {profileData.profilePhoto ? (
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
                  {profileData.name}
                </h2>
                <p className="text-sm text-gray-600">{profileData.tagline}</p>
                <p className="text-xs text-gray-500">{profileData.nationality}</p>
                {profileData.birthDate && (
                  <p className="text-xs text-gray-500">
                    {calculateAge(profileData.birthDate)} years old
                  </p>
                )}
              </div>

              {/* Contact Info */}
              {(profileData.phone || profileData.email) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-orange-600 mb-2">
                    Contact Information
                  </h3>
                  {profileData.phone && (
                    <p className="text-sm text-gray-700 flex items-center">
                      <Phone size={14} className="mr-2 text-orange-500" />{" "}
                      {profileData.phone}
                    </p>
                  )}
                  {profileData.email && (
                    <p className="text-sm text-gray-700 flex items-center">
                      <Mail size={14} className="mr-2 text-orange-500" />{" "}
                      {profileData.email}
                    </p>
                  )}
                </div>
              )}

              {/* Industry Preferences */}
              {industryPrefs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">
                    Industry Preferences
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {industryPrefs.map((ind, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Preferences */}
              {locationPreferences.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">
                    Location Preferences
                  </h3>
                  {locationPreferences.map(([state, suburbs]) => (
                    <div key={state} className="mb-2">
                      <p className="font-medium">{state}</p>
                      <div className="flex flex-wrap gap-2">
                        {(suburbs as string[]).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
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
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">
                    Work Experience
                  </h3>
                  <div className="space-y-3 text-sm">
                    {workExperiences.map((exp, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-3 text-gray-700"
                      >
                        <p className="font-medium">
                          {exp.position} - {exp.company}
                        </p>
                        <p className="text-gray-600">
                          {exp.industry?.name} • {exp.location}
                        </p>
                        <p className="text-xs">
                          {formatDate(exp.start_date)} –{" "}
                          {exp.end_date ? formatDate(exp.end_date) : "Present"}
                        </p>
                        {exp.job_description && (
                          <p className="text-xs mt-1">{exp.job_description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Licenses */}
              {licenses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">
                    Licenses & Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {references.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2 flex items-center">
                    <FileText size={16} className="mr-2" /> References
                  </h3>
                  <div className="space-y-2">
                    {references.map((ref, i) => (
                      <div
                        key={i}
                        className="border p-3 rounded-lg text-sm text-gray-700"
                      >
                        <p className="font-medium">{ref.name}</p>
                        <p>{ref.business_name}</p>
                        <p>{ref.email}</p>
                        {ref.mobile_num && <p>{ref.mobile_num}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMPCandidateFull;
