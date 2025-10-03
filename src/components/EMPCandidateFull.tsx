// src/pages/EMPCandidateFull.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Globe,
  Briefcase,
  MapPin,
  FileText,
  Award,
} from "lucide-react";
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
        .select(
          "given_name, middle_name, family_name, tagline, profile_photo, state, suburb, postcode, birth_date, nationality, mobile_num"
        )
        .eq("user_id", id)
        .maybeSingle();

      const { data: profileRow } = await supabase
        .from("profile")
        .select("email")
        .eq("user_id", id)
        .maybeSingle();

      const { data: visa } = await supabase
        .from("maker_visa")
        .select("expiry_date, stage_id, visa_stage (sub_class, label), country(name)")
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
          const area = `${loc.suburb_city} (${loc.postcode})`;
          if (!grouped[state]) grouped[state] = [];
          if (!grouped[state].includes(area)) grouped[state].push(area);
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
        if (whv.profile_photo.startsWith("http")) {
          signedPhoto = whv.profile_photo;
        } else {
          const { data } = supabase.storage.from("profile_photo").getPublicUrl(whv.profile_photo);
          signedPhoto = data.publicUrl;
        }
      }

      setProfileData({
        name: [whv?.given_name, whv?.middle_name, whv?.family_name].filter(Boolean).join(" "),
        tagline: whv?.tagline || "",
        nationality: whv?.nationality,
        birthDate: whv?.birth_date,
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
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading…</div>;
  }

  if (!profileData) {
    return <div className="flex items-center justify-center min-h-screen">Candidate not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
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

          {/* Scrollable Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#EC5823] rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#EC5823] overflow-hidden mb-3">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold">{profileData.name}</h2>
                <p className="text-sm text-gray-600">{profileData.tagline}</p>
                {profileData.nationality && (
                  <p className="text-xs text-gray-500">{profileData.nationality}</p>
                )}
                {profileData.birthDate && (
                  <p className="text-xs text-gray-500">{calculateAge(profileData.birthDate)} years old</p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {visaData?.visa_stage?.sub_class && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-1">
                      <Globe className="w-5 h-5 text-[#EC5823] mr-2" />
                      <span>Visa</span>
                    </div>
                    <p className="font-semibold">{visaData.visa_stage.sub_class}</p>
                  </div>
                )}
                {visaData?.expiry_date && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-5 h-5 text-[#EC5823] mr-2" />
                      <span>Expiry</span>
                    </div>
                    <p className="font-semibold">{formatDate(visaData.expiry_date)}</p>
                  </div>
                )}
                {availableFrom && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-5 h-5 text-[#EC5823] mr-2" />
                      <span>Available</span>
                    </div>
                    <p className="font-semibold">{formatDate(availableFrom)}</p>
                  </div>
                )}
                {profileData.phone && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-1">
                      <Phone className="w-5 h-5 text-[#EC5823] mr-2" />
                      <span>Phone</span>
                    </div>
                    <a href={`tel:${profileData.phone}`} className="font-semibold text-blue-600 hover:underline">
                      {profileData.phone}
                    </a>
                  </div>
                )}
                {profileData.email && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center mb-1">
                      <Mail className="w-5 h-5 text-[#EC5823] mr-2" />
                      <span>Email</span>
                    </div>
                    <a href={`mailto:${profileData.email}`} className="font-semibold text-blue-600 hover:underline">
                      {profileData.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Industry Preferences */}
              {industryPrefs.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Industry Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {industryPrefs.map((ind, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Preferences */}
              {locationPreferences.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Location Preferences</h3>
                  {locationPreferences.map(([state, areas]) => (
                    <div key={state} className="mb-2">
                      <p className="font-medium">{state}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(areas as string[]).map((a, idx) => (
                          <span key={idx} className="px-2 py-1 border text-xs rounded-full">
                            {a}
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
                  <h3 className="font-semibold mb-2">Work Experience</h3>
                  <div className="space-y-3 text-sm">
                    {workExperiences.map((exp, idx) => (
                      <div key={idx} className="border rounded-lg p-3 text-gray-700">
                        <p className="font-medium">
                          {exp.position} - {exp.company}
                        </p>
                        <p className="text-gray-600">
                          {exp.industry?.name} • {exp.location}
                        </p>
                        <p className="text-xs">
                          {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : "Present"}
                        </p>
                        {exp.job_description && <p className="text-xs mt-1">{exp.job_description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Licenses */}
              {licenses.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Licenses & Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {references.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <FileText size={16} className="mr-2" /> References
                  </h3>
                  <div className="space-y-2">
                    {references.map((ref, i) => (
                      <div key={i} className="border p-3 rounded-lg text-sm text-gray-700">
                        <p className="font-medium">{ref.name}</p>
                        <p>{ref.business_name}</p>
                        {ref.email && (
                          <a href={`mailto:${ref.email}`} className="text-blue-600 hover:underline">
                            {ref.email}
                          </a>
                        )}
                        {ref.mobile_num && (
                          <a href={`tel:${ref.mobile_num}`} className="block text-blue-600 hover:underline">
                            {ref.mobile_num}
                          </a>
                        )}
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
