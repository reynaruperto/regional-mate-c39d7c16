import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Award,
  User,
  Calendar,
  Globe,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const EMPCandidateFull: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

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

      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo, state, suburb, postcode, birth_date, nationality")
        .eq("user_id", id)
        .maybeSingle();

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

      const { data: availabilityRow } = await supabase
        .from("maker_pref_availability")
        .select("available_from")
        .eq("user_id", id)
        .maybeSingle();
      setAvailableFrom(availabilityRow?.available_from || null);

      const { data: industryRows } = await supabase
        .from("maker_pref_industry")
        .select("industry (name)")
        .eq("user_id", id);
      setIndustryPrefs(industryRows?.map((i: any) => i.industry?.name).filter(Boolean) || []);

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

      const { data: expRows } = await supabase
        .from("maker_work_experience")
        .select("position, company, industry(name), location, start_date, end_date, job_description")
        .eq("user_id", id)
        .order("start_date", { ascending: false });
      setWorkExperiences(expRows || []);

      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name), other")
        .eq("user_id", id);
      setLicenses(licenseRows?.map((l) => l.other || l.license?.name).filter(Boolean) || []);

      const { data: refRows } = await supabase
        .from("maker_reference")
        .select("name, business_name, email, mobile_num, role")
        .eq("user_id", id);
      setReferences(refRows || []);

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
        name: [whv?.given_name, whv?.middle_name, whv?.family_name].filter(Boolean).join(" "),
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });

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
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Candidate not found</p>
          <Button onClick={handleBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold">Candidate Profile</h1>
            <div className="w-10" />
          </div>

          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-orange-500 overflow-hidden mb-3">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
                <p className="text-sm text-gray-600">{profileData.tagline}</p>
                <p className="text-xs text-gray-500">{profileData.nationality}</p>
                {profileData.birthDate && (
                  <p className="text-xs text-gray-500">
                    {calculateAge(profileData.birthDate)} years old
                  </p>
                )}
              </div>

              {/* Visa Info */}
              {visaData && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-orange-600 mb-2">Visa Information</h3>
                  <p className="text-sm text-gray-700">{visaData.country?.name} — {visaData.visa_stage?.label}</p>
                  <p className="text-sm text-gray-700">Expiry: {visaData.expiry_date ? formatDate(visaData.expiry_date) : "Not set"}</p>
                </div>
              )}

              {/* Industry Preferences */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><Briefcase size={16} className="mr-2" /> Industry Preferences</h3>
                {industryPrefs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {industryPrefs.map((ind, i) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{ind}</span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No industries set</p>}
              </div>

              {/* Location Preferences */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><MapPin size={16} className="mr-2" /> Location Preferences</h3>
                {locationPreferences.length > 0 ? (
                  locationPreferences.map(([state, suburbs]) => (
                    <div key={state} className="mb-2">
                      <p className="font-medium">{state}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(suburbs as string[]).map((s, i) => (
                          <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : <p className="text-sm text-gray-500">No location preferences</p>}
              </div>

              {/* Work Experience */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2">Work Experience</h3>
                {workExperiences.length > 0 ? (
                  workExperiences.map((exp, idx) => (
                    <div key={idx} className="border-b pb-2 mb-2 text-sm text-gray-700">
                      <p className="font-medium">{exp.position} - {exp.company}</p>
                      <p>{exp.industry?.name} • {exp.location}</p>
                      <p className="text-xs text-gray-500">{formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : "Present"}</p>
                      {exp.job_description && <p className="text-xs mt-1">{exp.job_description}</p>}
                    </div>
                  ))
                ) : <p className="text-sm text-gray-500">No work experience</p>}
              </div>

              {/* Licenses */}
              {licenses.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><Award size={16} className="mr-2" /> Licenses & Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {references.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><FileText size={16} className="mr-2" /> References</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    {references.map((ref, i) => (
                      <div key={i} className="border p-2 rounded-lg">
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
