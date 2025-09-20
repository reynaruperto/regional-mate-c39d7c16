// src/pages/whv/WHVProfilePreview.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Briefcase, MapPin, Award, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WHVProfilePreview: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<any[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/sign-in");
        return;
      }

      // Profile
      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo")
        .eq("user_id", user.id)
        .maybeSingle();

      // Industries
      const { data: industryRows } = await supabase
        .from("maker_pref_industry")
        .select("industry ( name )")
        .eq("user_id", user.id);

      setIndustries(
        industryRows?.map((i: any) => i.industry?.name).filter(Boolean) || []
      );

      // Locations
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

      // Work Experiences
      const { data: expRows } = await supabase
        .from("maker_work_experience")
        .select("company, position, industry(name), start_date, end_date")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (expRows) {
        setWorkExperiences(expRows);

        // Calculate total years
        const totalYears = expRows.reduce((sum, exp) => {
          const start = new Date(exp.start_date);
          const end = exp.end_date ? new Date(exp.end_date) : new Date();
          const years =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          return sum + years;
        }, 0);
        setExperienceYears(Math.round(totalYears));
      }

      // Licenses
      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name)")
        .eq("user_id", user.id);

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
        profilePhoto: signedPhoto,
      });

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone Frame */}
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
              onClick={() => navigate("/whv/dashboard")}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Profile Preview
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

              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <Briefcase className="w-5 h-5 text-orange-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Industries
                    </span>
                  </div>
                  <ul className="text-gray-900 font-semibold list-disc list-inside text-sm">
                    {industries.length > 0 ? (
                      industries.map((ind, i) => <li key={i}>{ind}</li>)
                    ) : (
                      <li>No industries set</li>
                    )}
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-orange-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Experience
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold text-sm">
                    {experienceYears} years
                  </p>
                </div>
              </div>

              {/* Location Preferences */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center mb-2">
                  <MapPin className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-gray-600">
                    Location Preferences
                  </span>
                </div>
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

              {/* Work Experience Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center mb-2">
                  <Briefcase className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-gray-600">
                    Work Experience
                  </span>
                </div>
                {workExperiences.length > 0 ? (
                  <div>
                    <p className="text-gray-900 font-semibold mb-3">
                      {experienceYears} years total
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {workExperiences.map((exp, i) => (
                        <li key={i} className="border-b last:border-0 pb-2">
                          <span className="font-medium">{exp.position}</span> in{" "}
                          {exp.industry?.name || "N/A"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No work experience added
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
              <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md">
                <Heart size={18} className="fill-white" /> Heart to Match
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVProfilePreview;
