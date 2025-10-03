import React, { useState, useEffect } from "react";
import { ArrowLeft, User, FileText, Phone, Mail, Briefcase, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface WHVProfileData {
  name: string;
  tagline: string;
  profilePhoto: string | null;
  nationality: string;
  visaType: string;
  visaExpiry: string;
  availableDate: string;
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

interface Reference {
  name: string;
  business_name: string;
  email: string;
  mobile_num?: string;
}

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<WHVProfileData | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [workPreferences, setWorkPreferences] = useState<{ industry: string; role: string }[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<{ state: string; area: string }[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (d: string | null) => {
    if (!d) return "Not set";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const categorizeYears = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years < 1) return "<1 yr";
    if (years < 3) return "1–2 yrs";
    if (years < 5) return "3–4 yrs";
    if (years < 8) return "5–7 yrs";
    if (years < 11) return "8–10 yrs";
    return "10+ yrs";
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/whv/dashboard");
          return;
        }

        const { data: whvMaker } = await supabase
          .from("whv_maker")
          .select("given_name, middle_name, family_name, tagline, nationality, profile_photo, mobile_num")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("profile")
          .select("email")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: visa } = await supabase
          .from("maker_visa")
          .select(`expiry_date, visa_stage:stage_id ( sub_class, label )`)
          .eq("user_id", user.id)
          .maybeSingle();

        let visaType = "Not specified";
        if (visa?.visa_stage) {
          const { sub_class, label } = visa.visa_stage;
          visaType = label.includes(sub_class) ? label : `${sub_class} (${label})`;
        }

        const { data: availability } = await supabase
          .from("maker_pref_availability")
          .select("available_from")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: workPrefsData } = await supabase
          .from("maker_pref_industry_role")
          .select(`industry_role ( role, industry(name) )`)
          .eq("user_id", user.id);

        const formattedWorkPrefs =
          (workPrefsData || []).map((pref: any) => ({
            industry: pref.industry_role?.industry?.name || "",
            role: pref.industry_role?.role || "",
          })) || [];
        setWorkPreferences(formattedWorkPrefs);

        const { data: locationPrefsData } = await supabase
          .from("maker_pref_location")
          .select("state, suburb_city, postcode")
          .eq("user_id", user.id);

        const formattedLocationPrefs =
          (locationPrefsData || []).map((loc: any) => ({
            state: loc.state,
            area: `${loc.suburb_city} (${loc.postcode})`,
          })) || [];
        setLocationPreferences(formattedLocationPrefs);

        const { data: experiences } = await supabase
          .from("maker_work_experience" as any)
          .select("position, company, industry_id, location, start_date, end_date, job_description")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false });

        const { data: industryData } = await supabase.from("industry").select("industry_id, name");

        const formattedExperiences: WorkExperience[] =
          (experiences || []).map((exp: any) => {
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
          }) || [];
        setWorkExperiences(formattedExperiences);

        const { data: licenseRows } = await supabase
          .from("maker_license")
          .select("license(name)")
          .eq("user_id", user.id);
        setLicenses((licenseRows || []).map((l: any) => l.license?.name || "Unknown License"));

        const { data: referenceRows } = await supabase
          .from("maker_reference")
          .select("name, business_name, email, mobile_num")
          .eq("user_id", user.id);
        setReferences(referenceRows || []);

        let signedPhoto: string | null = null;
        if (whvMaker?.profile_photo) {
          let path = whvMaker.profile_photo;
          if (path.includes("/profile_photo/")) {
            path = path.split("/profile_photo/")[1];
          }
          const { data } = await supabase.storage
            .from("profile_photo")
            .createSignedUrl(path, 3600);
          signedPhoto = data?.signedUrl ?? null;
        }

        setProfileData({
          name: [whvMaker?.given_name, whvMaker?.middle_name, whvMaker?.family_name]
            .filter(Boolean)
            .join(" "),
          tagline: whvMaker?.tagline || "Working Holiday Maker",
          profilePhoto: signedPhoto,
          nationality: whvMaker?.nationality || "Not specified",
          visaType,
          visaExpiry: visa?.expiry_date || "Not specified",
          availableDate: availability?.available_from || "Not specified",
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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => navigate("/whv/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold">Matched Profile</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-orange-500 overflow-hidden mb-3">
                  {profileData?.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
                <p className="text-sm text-gray-600">{profileData?.tagline}</p>
                <p className="text-xs text-gray-500">{profileData?.nationality}</p>
                <p className="text-xs text-gray-500">{profileData?.visaType}</p>
                <p className="text-xs text-gray-500">Expires {formatDate(profileData?.visaExpiry)}</p>
                <p className="text-xs text-gray-500">Available From: {formatDate(profileData?.availableDate)}</p>
                {profileData?.phone && <p className="text-sm flex items-center"><Phone size={14} className="mr-1 text-orange-500" /> {profileData.phone}</p>}
                {profileData?.email && <p className="text-sm flex items-center"><Mail size={14} className="mr-1 text-orange-500" /> {profileData.email}</p>}
              </div>

              {/* Work Preferences */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><Briefcase size={16} className="mr-2" /> Work Preferences</h3>
                {workPreferences.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {workPreferences.map((wp, i) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{wp.industry} - {wp.role}</span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No work preferences set</p>}
              </div>

              {/* Location Preferences */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><MapPin size={16} className="mr-2" /> Location Preferences</h3>
                {locationPreferences.length > 0 ? (
                  locationPreferences.map((loc, i) => (
                    <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{loc.state} - {loc.area}</span>
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
                      <p>{exp.industry} • {exp.location}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : "Present"} ({categorizeYears(exp.start_date, exp.end_date)})
                      </p>
                      {exp.description && <p className="text-xs mt-1">{exp.description}</p>}
                    </div>
                  ))
                ) : <p className="text-sm text-gray-500">No work experience</p>}
              </div>

              {/* Licenses */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><Award size={16} className="mr-2" /> Licenses & Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {licenses.length > 0 ? (
                    licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{l}</span>
                    ))
                  ) : <p className="text-sm text-gray-500">No licenses added</p>}
                </div>
              </div>

              {/* References */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center"><FileText size={16} className="mr-2" /> References</h3>
                {references.length > 0 ? (
                  references.map((ref, i) => (
                    <div key={i} className="border p-2 rounded-lg text-sm text-gray-700">
                      <p className="font-medium">{ref.name}</p>
                      <p>{ref.business_name}</p>
                      <p>{ref.email}</p>
                      {ref.mobile_num && <p>{ref.mobile_num}</p>}
                    </div>
                  ))
                ) : <p className="text-sm text-gray-500">No references</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
