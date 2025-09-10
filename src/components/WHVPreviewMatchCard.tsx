// src/components/WHVPreviewMatchCard.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, Award, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface WHVProfileData {
  name: string;
  tagline: string;
  profilePhoto: string | null;
  currentLocation: string;
  nationality: string;
  visaType: string;
  visaExpiry: string;
}

interface WorkExperience {
  position: string;
  company: string;
  industry: string;
  location: string;
  start_date: string;
  end_date: string | null;
}

interface Preference {
  industry: string;
  role: string;
  state: string;
  area: string;
}

interface Reference {
  name: string;
  business_name: string;
  email: string;
}

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<WHVProfileData | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("No user logged in", userError);
          navigate('/whv/dashboard');
          return;
        }

        // 1. WHV maker
        const { data: whvMaker } = await supabase
          .from('whv_maker')
          .select('given_name, middle_name, family_name, tagline, nationality, profile_photo, suburb, state')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Visa with stage join
        const { data: visa } = await supabase
          .from('maker_visa')
          .select(`
            expiry_date,
            visa_stage:stage_id (
              sub_class,
              label
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        // 3. Preferences
        const { data: preferencesData } = await supabase
          .from('maker_preference')
          .select(`
            industry_role(role, industry(name)),
            region_rules(state, area)
          `)
          .eq('user_id', user.id);

        const formattedPreferences: Preference[] = (preferencesData || []).map((pref: any) => ({
          industry: String(pref.industry_role?.industry?.name || 'Not specified'),
          role: String(pref.industry_role?.role || 'Not specified'),
          state: String(pref.region_rules?.state || 'Not specified'),
          area: String(pref.region_rules?.area || 'Not specified'),
        }));

        // Deduplicate work & location preferences
        const uniqueWorkPrefs = Array.from(
          new Set(formattedPreferences.map(p => `${p.industry} – ${p.role}`))
        ).map(str => {
          const [industry, role] = str.split(' – ');
          return { industry, role } as Preference;
        });

        const uniqueLocationPrefs = Array.from(
          new Set(formattedPreferences.map(p => `${p.state} – ${p.area}`))
        ).map(str => {
          const [state, area] = str.split(' – ');
          return { state, area } as Preference;
        });

        // 4. Work experience
        const { data: experiences } = await supabase
          .from('maker_work_experience')
          .select('position, company, industry(name), location, start_date, end_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        const formattedExperiences: WorkExperience[] = (experiences || []).map((exp: any) => ({
          position: exp.position,
          company: exp.company,
          industry: exp.industry?.name || 'Not specified',
          location: exp.location || 'Not specified',
          start_date: exp.start_date,
          end_date: exp.end_date,
        }));

        // 5. Licenses
        const { data: licenseRows } = await supabase
          .from('maker_license')
          .select('license(name)')
          .eq('user_id', user.id);

        const formattedLicenses: string[] = (licenseRows || []).map((l: any) => 
          typeof l.license === 'string' ? l.license : (l.license?.name || 'Unknown License')
        );

        // 6. References
        const { data: referenceRows } = await supabase
          .from('maker_reference')
          .select('name, business_name, email')
          .eq('user_id', user.id);

        // 7. Profile photo signed URL
        let signedPhoto: string | null = null;
        if (whvMaker?.profile_photo) {
          let photoPath = whvMaker.profile_photo;
          if (photoPath.includes('/profile_photo/')) {
            photoPath = photoPath.split('/profile_photo/')[1];
          }
          const { data } = await supabase.storage
            .from('profile_photo')
            .createSignedUrl(photoPath, 3600);
          signedPhoto = data?.signedUrl ?? null;
        }

        setProfileData({
          name: [whvMaker?.given_name, whvMaker?.middle_name, whvMaker?.family_name]
            .filter(Boolean)
            .join(' '),
          tagline: whvMaker?.tagline || 'Working Holiday Maker seeking opportunities',
          profilePhoto: signedPhoto,
          currentLocation: whvMaker ? `${whvMaker.suburb}, ${whvMaker.state}` : 'Not specified',
          nationality: whvMaker?.nationality || 'Not specified',
          visaType: visa?.visa_stage
            ? `${visa.visa_stage.sub_class} (${visa.visa_stage.label})`
            : 'Not specified',
          visaExpiry: visa?.expiry_date || 'Not specified',
        });

        setPreferences([...uniqueWorkPrefs, ...uniqueLocationPrefs]); // keep both grouped
        setWorkExperiences(formattedExperiences);
        setLicenses(formattedLicenses);
        setReferences(referenceRows || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Separate unique sets for rendering
  const workPrefs = Array.from(new Set(preferences.map(p => `${p.industry} – ${p.role}`)));
  const locationPrefs = Array.from(new Set(preferences.map(p => `${p.state} – ${p.area}`)));

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                onClick={() => navigate('/edit-profile')}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Preview Match Card</h1>
              <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-2 border-orange-500 overflow-hidden mb-3">
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
                  <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
                  <p className="text-sm text-gray-600">{profileData?.tagline}</p>
                  <p className="text-xs text-gray-500">
                    {profileData?.nationality} — {profileData?.visaType}, Expires {profileData?.visaExpiry}
                  </p>
                </div>

                {/* Current Location */}
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin size={16} className="text-orange-500 mr-2" />
                  Current Location: {profileData?.currentLocation}
                </div>

                {/* Work Preferences */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Work Preferences</h3>
                  {workPrefs.length > 0 ? (
                    workPrefs.map((wp, idx) => (
                      <p key={idx} className="text-sm text-gray-700">{wp}</p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No work preferences set</p>
                  )}
                </div>

                {/* Location Preferences */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Location Preferences</h3>
                  {locationPrefs.length > 0 ? (
                    locationPrefs.map((lp, idx) => (
                      <p key={idx} className="text-sm text-gray-700">{lp}</p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No location preferences set</p>
                  )}
                </div>

                {/* Work Experience */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Work Experience</h3>
                  {workExperiences.length > 0 ? (
                    workExperiences.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-orange-300 pl-3 mb-2">
                        <p className="text-sm font-medium">{exp.position} – {exp.industry}</p>
                        <p className="text-xs text-gray-600">{exp.company}, {exp.location}</p>
                        <p className="text-xs text-gray-500">
                          {exp.start_date} – {exp.end_date || 'Present'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No work experience added yet</p>
                  )}
                </div>

                {/* Licenses */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Licenses & Certifications</h3>
                  {licenses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {licenses.map((license, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full"
                        >
                          {license}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No licenses added yet</p>
                  )}
                </div>

                {/* References */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2 flex items-center">
                    <FileText size={16} className="mr-2" />
                    References
                  </h3>
                  {references.length > 0 ? (
                    references.map((ref, idx) => (
                      <div key={idx} className="text-sm text-gray-700 mb-2">
                        <p className="font-medium">{ref.name} — {ref.business_name}</p>
                        <p className="text-xs text-gray-500">{ref.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No references added</p>
                  )}
                </div>

                {/* Heart to Match */}
                <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white py-3 rounded-xl font-medium mt-4">
                  ❤️ Heart to Match
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
