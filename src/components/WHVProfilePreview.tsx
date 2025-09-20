// src/pages/whv/WHVProfilePreview.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Award,
  User,
  Heart,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WHVProfilePreview: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<
    Record<string, { suburb_city: string; postcode: string }[]>
  >({});
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number>(0);
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

      // 1️⃣ Profile
      const { data: whv } = await supabase
        .from("whv_maker")
        .select("given_name, middle_name, family_name, tagline, profile_photo")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2️⃣ Industries
      const { data: industryPrefs } = await supabase
        .from("maker_pref_industry")
        .select("industry(name)")
        .eq("user_id", user.id);

      setIndustries(
        industryPrefs?.map((i: any) => i.industry?.name).filter(Boolean) || []
      );

      // 3️⃣ Locations (grouped by state)
      const { data: locationPrefs } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", user.id);

      if (locationPrefs) {
        const grouped: Record<
          string,
          { suburb_city: string; postcode: string }[]
        > = {};
        locationPrefs.forEach((loc: any) => {
          if (!grouped[loc.state]) grouped[loc.state] = [];
          grouped[loc.state].push({
            suburb_city: loc.suburb_city,
            postcode: loc.postcode,
          });
        });
        setLocationPreferences(grouped);
      }

      // 4️⃣ Work Experience
      const { data: experiences } = await supabase
        .from("maker_work_experience")
        .select(
          "company, position, industry(name), location, start_date, end_date, job_description"
        )
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (experiences) {
        setWorkExperiences(experiences);

        // Auto calculate years of experience
        let totalMonths = 0;
        experiences.forEach((exp: any) => {
          const start = new Date(exp.start_date);
          const end = exp.end_date ? new Date(exp.end_date) : new Date();
          const months =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());
          totalMonths += Math.max(0, months);
        });
        setExperienceYears(Math.floor(totalMonths / 12));
      }

      // 5️⃣ Licenses
      const { data: licenseRows } = await supabase
        .from("maker_license")
        .select("license(name)")
        .eq("user_id", user.id);

      setLicenses(licenseRows?.map((l) => l.license?.name) || []);

      // 6️⃣ Signed profile photo
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

  const formatDate = (date: string | null) => {
    if (!date) return "Present";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
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
      {/* iPhone 16 Pro Max frame */}
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
                  {industries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {industries.map((ind, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900 font-semibold">Not set</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-orange-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Experience
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {experienceYears} years
                  </p>
                </div>
              </div>

              {/* Location Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin size={16} className="text-orange-500 mr-2" />
                  Location Preferences
                </h3>
                {Object.keys(locationPreferences).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(locationPreferences).map(
                      ([state, areas], i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-2xl p-4 shadow-sm"
                        >
                          <p className="font-medium text-gray-800 mb-2">
                            {state}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {areas.map((a, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                              >
                                {a.suburb_city} ({a.postcode})
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No location preferences set
                  </p>
                )}
              </div>

              {/* Work Experience */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Work Experience
                </h3>
                {workExperiences.length > 0 ? (
                  <div className="space-y-4">
                    {workExperiences.map((exp, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-3 text-sm bg-gray-50"
                      >
                        <p>
                          <span className="font-medium">Company:</span>{" "}
                          {exp.company}
                        </p>
                        <p>
                          <span className="font-medium">Industry:</span>{" "}
                          {exp.industry?.name || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Position:</span>{" "}
                          {exp.position}
                        </p>
                        <p>
                          <span className="font-medium">Location:</span>{" "}
                          {exp.location}
                        </p>
                        <p>
                          <span className="font-medium">Dates:</span>{" "}
                          {formatDate(exp.start_date)} –{" "}
                          {formatDate(exp.end_date)}
                        </p>
                        {exp.job_description && (
                          <p>
                            <span className="font-medium">Description:</span>{" "}
                            {exp.job_description}
                          </p>
                        )}
                      </div>
                    ))}
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
