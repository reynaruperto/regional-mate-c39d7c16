// src/components/WHVPreviewMatchCard.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  FileText,
  Phone,
  Mail,
  Calendar,
  Globe,
  Briefcase,
  MapPin,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface WHVProfileData {
  name: string;
  tagline: string;
  profilePhoto: string | null;
  nationality: string;
  birthDate?: string;
  phone?: string;
  email?: string;
}

interface WorkExperience {
  position: string;
  company: string;
  industry: string;
  location: string;
  start_date: string;
  end_date: string | null;
  description?: string;
}

interface Preference {
  industry?: string;
  role?: string;
  state?: string;
  area?: string;
}

interface Reference {
  name: string;
  business_name: string;
  email: string;
  mobile_num?: string;
}

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<WHVProfileData | null>(null);
  const [visaData, setVisaData] = useState<any>(null);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [workPreferences, setWorkPreferences] = useState<Preference[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<Preference[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (d: string | null) => {
    if (!d) return "Not set";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

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

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/whv/dashboard");
          return;
        }

        // WHV maker
        const { data: whvMaker } = await supabase
          .from("whv_maker")
          .select("given_name, middle_name, family_name, tagline, nationality, profile_photo, birth_date, mobile_num")
          .eq("user_id", user.id)
          .maybeSingle();

        // Profile email
        const { data: profile } = await supabase
          .from("profile")
          .select("email")
          .eq("user_id", user.id)
          .maybeSingle();

        // Visa
        const { data: visa } = await supabase
          .from("maker_visa")
          .select("expiry_date, visa_stage:stage_id (sub_class, label)")
          .eq("user_id", user.id)
          .maybeSingle();
        setVisaData(visa);

        // Availability
        const { data: availability } = await supabase
          .from("maker_pref_availability")
          .select("available_from")
          .eq("user_id", user.id)
          .maybeSingle();
        setAvailableFrom(availability?.available_from || null);

        // Work preferences
        const { data: workPrefsData } = await supabase
          .from("maker_pref_industry_role")
          .select("industry_role (role, industry(name))")
          .eq("user_id", user.id);
        setWorkPreferences(
          (workPrefsData || []).map((pref: any) => ({
            industry: pref.industry_role?.industry?.name,
            role: pref.industry_role?.role,
          }))
        );

        // Location preferences
        const { data: locationPrefsData } = await supabase
          .from("maker_pref_location")
          .select("state, suburb_city, postcode")
          .eq("user_id", user.id);
        setLocationPreferences(
          (locationPrefsData || []).map((loc: any) => ({
            state: loc.state,
            area: `${loc.suburb_city} (${loc.postcode})`,
          }))
        );

        // Work experience
        const { data: experiences } = await supabase
          .from("maker_work_experience")
          .select("position, company, industry_id, location, start_date, end_date, job_description")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false });

        const { data: industryData } = await supabase.from("industry").select("industry_id, name");
        const formattedExperiences: WorkExperience[] = (experiences || []).map((exp: any) => {
          const industry = industryData?.find((ind: any) => ind.industry_id === exp.industry_id);
          return {
            position: exp.position,
            company: exp.company,
            industry: industry?.name || "Not specified",
            location: exp.location || "Not specified",
            start_date: exp.start_date,
            end_date: exp.end_date,
            description: exp.job_description || "",
          };
        });
        setWorkExperiences(formattedExperiences);

        // Licenses
        const { data: licenseRows } = await supabase
          .from("maker_license")
          .select("license(name)")
          .eq("user_id", user.id);
        setLicenses(licenseRows?.map((l: any) => l.license?.name).filter(Boolean) || []);

        // References
        const { data: referenceRows } = await supabase
          .from("maker_reference")
          .select("name, business_name, email, mobile_num")
          .eq("user_id", user.id);
        setReferences(referenceRows || []);

        // Profile photo
        let signedPhoto: string | null = null;
        if (whvMaker?.profile_photo) {
          let photoPath = whvMaker.profile_photo.includes("/profile_photo/")
            ? whvMaker.profile_photo.split("/profile_photo/")[1]
            : whvMaker.profile_photo;
          const { data } = await supabase.storage.from("profile_photo").createSignedUrl(photoPath, 3600);
          signedPhoto = data?.signedUrl ?? null;
        }

        setProfileData({
          name: [whvMaker?.given_name, whvMaker?.middle_name, whvMaker?.family_name].filter(Boolean).join(" "),
          tagline: whvMaker?.tagline || "Working Holiday Maker",
          profilePhoto: signedPhoto,
          nationality: whvMaker?.nationality || "Not specified",
          birthDate: whvMaker?.birth_date,
          phone: whvMaker?.mobile_num || "",
          email: profile?.email || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profileData) {
    return <div className="min-h-screen flex items-center justify-center">Profile not found</div>;
  }

  // Group preferences
  const groupedWorkPrefs = workPreferences.reduce((acc: any, pref) => {
    if (!pref.industry || !pref.role) return acc;
    if (!acc[pref.industry]) acc[pref.industry] = new Set();
    acc[pref.industry].add(pref.role);
    return acc;
  }, {});

  const groupedLocationPrefs = locationPreferences.reduce((acc: any, pref) => {
    if (!pref.state || !pref.area) return acc;
    if (!acc[pref.state]) acc[pref.state] = new Set();
    acc[pref.state].add(pref.area);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 shadow-sm flex items-center justify-between flex-shrink-0">
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => navigate("/edit-profile")}>
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Matched Profile</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-2 border-orange-500 overflow-hidden mb-3">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
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
                  <p className="text-xs text-gray-500">
                    {calculateAge(profileData.birthDate)} years old
                  </p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {visaData?.visa_stage?.sub_class && (
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-orange-500" />
                    Visa {visaData.visa_stage.sub_class}
                  </div>
                )}
                {visaData?.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-orange-500" />
                    Expires {formatDate(visaData.expiry_date)}
                  </div>
                )}
                {availableFrom && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-orange-500" />
                    Available {formatDate(availableFrom)}
                  </div>
                )}
                {profileData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-orange-500" />
                    {profileData.phone}
                  </div>
                )}
                {profileData.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-orange-500" />
                    {profileData.email}
                  </div>
                )}
              </div>

              {/* Work Preferences */}
              {Object.keys(groupedWorkPrefs).length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Work Preferences</h3>
                  {Object.entries(groupedWorkPrefs).map(([industry, roles]) => (
                    <div key={industry} className="mb-2">
                      <p className="font-medium">{industry}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Array.from(roles as Set<string>).map((role, idx) => (
                          <span key={idx} className="px-2 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Location Preferences */}
              {Object.keys(groupedLocationPrefs).length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Location Preferences</h3>
                  {Object.entries(groupedLocationPrefs).map(([state, areas]) => (
                    <div key={state} className="mb-2">
                      <p className="font-medium">{state}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Array.from(areas as Set<string>).map((area, idx) => (
                          <span key={idx} className="px-2 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                            {area}
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
                  <h3 className="font-semibold text-orange-600 mb-2">Work Experience</h3>
                  <div className="space-y-3 text-sm">
                    {workExperiences.map((exp, idx) => (
                      <div key={idx} className="border rounded-lg p-3 text-gray-700">
                        <p className="font-medium">{exp.position} - {exp.company}</p>
                        <p className="text-gray-600">{exp.industry} • {exp.location}</p>
                        <p className="text-xs">{formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : "Present"}</p>
                        {exp.description && <p className="text-xs mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Licenses */}
              {licenses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Licenses & Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((license, idx) => (
                      <span key={idx} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                        {license}
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
                      <div key={i} className="border p-3 rounded-lg text-sm text-gray-700">
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

export default WHVPreviewMatchCard;
