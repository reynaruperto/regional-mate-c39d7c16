// src/components/WHVProfilePreview.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Award,
  User,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WHVProfilePreview: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [industryPrefs, setIndustryPrefs] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<any[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (d: string | Date | null) => {
    if (!d) return "Not set";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/sign-in");
        return;
      }

      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: availabilityRow } = await supabase
        .from("maker_pref_availability")
        .select("available_from")
        .eq("user_id", user.id)
        .maybeSingle();
      if (availabilityRow) setAvailableFrom(availabilityRow.available_from);

      const { data: industryData } = await supabase
        .from("industry")
        .select("industry_id, name");
      setIndustries(industryData?.map((i: any) => ({ id: i.industry_id, name: i.name })) || []);

      const { data: industryRows } = await supabase
        .from("maker_pref_industry")
        .select("industry ( name )")
        .eq("user_id", user.id);
      setIndustryPrefs(industryRows?.map((i: any) => i.industry?.name).filter(Boolean) || []);

      const { data: locationRows } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", user.id);
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
        .from("maker_work_experience" as any)
        .select("position, company, industry_id, location, start_date, end_date, job_description")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      if (expRows) setWorkExperiences(expRows);

      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name)")
        .eq("user_id", user.id);
      setLicenses(licenseRows?.map((l) => l.license?.name).filter(Boolean) || []);

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
        name: [whv?.given_name, whv?.middle_name, whv?.family_name].filter(Boolean).join(" "),
        tagline: whv?.tagline || "No tagline added",
        profilePhoto: signedPhoto,
      });

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button
              onClick={() => navigate("/whv/dashboard")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
            <h1 className="text-lg font-semibold">Profile Preview</h1>
            <div className="w-10" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="border-2 border-[#EC5823] rounded-2xl p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#EC5823] overflow-hidden mb-3">
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
                {availableFrom && (
                  <p className="text-sm text-gray-600 mt-1">
                    Available from: <span className="font-medium text-gray-900">{formatDate(availableFrom)}</span>
                  </p>
                )}
              </div>

              {/* Industry Preferences */}
              {industryPrefs.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                    <Briefcase size={16} className="mr-2 text-[#EC5823]" /> Industry Preferences
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
                    <MapPin size={16} className="mr-2 text-[#EC5823]" /> Location Preferences
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
                    <Briefcase size={16} className="mr-2 text-[#EC5823]" /> Work Experience
                  </h3>
                  <div className="space-y-3 text-sm">
                    {workExperiences.map((exp, i) => {
                      const industryName = industries.find((ind) => ind.id === exp.industry_id)?.name || "N/A";
                      return (
                        <div key={i} className="border rounded-lg p-3 text-gray-700">
                          <p className="font-medium">{exp.position} – {exp.company}</p>
                          <p className="text-gray-600">{industryName} • {exp.location}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : "Present"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Licenses */}
              {licenses.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                    <Award size={16} className="mr-2 text-[#EC5823]" /> Licenses & Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border text-xs rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Heart Button */}
              <Button className="w-full bg-[#EC5823] hover:bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md">
                <Heart size={18} className="text-white" /> Heart to Match
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVProfilePreview;
