import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, Award, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface WHVProfileData {
  name: string;
  tagline: string;
  nationality: string;
  profilePhoto: string | null;
  currentLocation: string;
  email: string;
  phone: string;
}

interface Preference {
  state: string;
  area: string;
  role: string;
  industry: string;
}

interface WorkExperience {
  start_date: string;
  end_date: string | null;
  position: string;
  company: string;
  location: string;
  industry: string;
}

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<WHVProfileData | null>(null);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Present';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("No user logged in", userError);
          navigate('/whv/dashboard');
          return;
        }

        // 1. WHV maker profile
        const { data: whvMaker } = await supabase
          .from('whv_maker')
          .select('given_name, middle_name, family_name, tagline, nationality, profile_photo, suburb, state, mobile_num')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Preferences (join industry + role + region)
        const { data: preferencesData } = await supabase
          .from('maker_preference')
          .select(`
            industry_role(role, industry_id, industry:industry(name)),
            region_rules(state, area)
          `)
          .eq('user_id', user.id);

        // 3. Work experience (join industry)
        const { data: experiences } = await supabase
          .from('maker_work_experience')
          .select('start_date, end_date, position, company, location, industry:industry(name)')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        // 4. Licenses
        const { data: licenseRows } = await supabase
          .from('maker_license')
          .select('license(name)')
          .eq('user_id', user.id);

        // 5. Email from profile
        const { data: profileRow } = await supabase
          .from('profile')
          .select('email')
          .eq('user_id', user.id)
          .maybeSingle();

        // 6. Signed profile photo
        let signedPhoto: string | null = null;
        if (whvMaker?.profile_photo) {
          let photoPath = whvMaker.profile_photo;
          if (photoPath.includes('/profile_photo/')) {
            photoPath = photoPath.split('/profile_photo/')[1];
          }
          const { data } = await supabase
            .storage
            .from('profile_photo')
            .createSignedUrl(photoPath, 3600);
          signedPhoto = data?.signedUrl ?? null;
        }

        // Profile data
        setProfileData({
          name: [whvMaker?.given_name, whvMaker?.middle_name, whvMaker?.family_name].filter(Boolean).join(' '),
          tagline: whvMaker?.tagline || 'Working Holiday Maker seeking opportunities',
          nationality: whvMaker?.nationality || 'Not specified',
          profilePhoto: signedPhoto,
          currentLocation: whvMaker ? `${whvMaker.suburb}, ${whvMaker.state}` : 'Not specified',
          email: profileRow?.email || 'Not provided',
          phone: whvMaker?.mobile_num || 'Not provided',
        });

        // Preferences
        setPreferences((preferencesData || []).map(p => ({
          state: p.region_rules?.state || '',
          area: p.region_rules?.area || '',
          role: p.industry_role?.role || '',
          industry: p.industry_role?.industry?.name || ''
        })));

        // Work Experience
        setWorkExperiences((experiences || []).map(exp => ({
          start_date: exp.start_date,
          end_date: exp.end_date,
          position: exp.position,
          company: exp.company,
          location: exp.location,
          industry: exp.industry?.name || 'Not specified',
        })));

        // Licenses
        setLicenses(licenseRows?.map(l => l.license?.name).filter(Boolean) || []);
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Banner */}
            <div className="px-6 pt-16 pb-4 bg-gradient-to-r from-orange-500 to-slate-800 text-center text-white">
              <h1 className="text-xl font-bold">🎉 It’s a Match! 🎉</h1>
              <p className="text-sm mt-1">This is how employers will see your full profile</p>
            </div>

            {/* Back Button */}
            <div className="absolute top-16 left-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 bg-white shadow-md"
                onClick={() => navigate('/edit-profile')}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4">
              {/* Profile Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 rounded-full border-2 border-orange-500 overflow-hidden flex-shrink-0">
                    {profileData?.profilePhoto ? (
                      <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{profileData?.tagline}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700"><span className="font-medium">Current Location:</span> {profileData?.currentLocation}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Nationality:</span> {profileData?.nationality}</p>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase size={18} className="text-orange-500 mr-2" />
                  Work Preferences
                </h3>
                {preferences.length > 0 ? (
                  <div className="space-y-2">
                    {preferences.map((pref, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        <p><span className="font-medium">Preferred Location:</span> {pref.state} ({pref.area})</p>
                        <p><span className="font-medium">Preferred Work:</span> {pref.industry} – {pref.role}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No preferences added yet</p>
                )}
              </div>

              {/* Work Experience */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase size={18} className="text-orange-500 mr-2" />
                  Work Experience
                </h3>
                {workExperiences.length > 0 ? (
                  <div className="space-y-4">
                    {workExperiences.map((exp, index) => (
                      <div key={index} className="border-l-2 border-orange-200 pl-4">
                        <h4 className="font-medium text-gray-900">{exp.position} – {exp.industry}</h4>
                        <p className="text-sm text-gray-700">{exp.company} • {exp.location}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No work experience added yet</p>
                )}
              </div>

              {/* Licenses */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award size={18} className="text-orange-500 mr-2" />
                  Licenses & Certifications
                </h3>
                {licenses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((license, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {license}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No licenses added yet</p>
                )}
              </div>

              {/* Contact Details */}
              <div className="bg-gradient-to-r from-orange-500 to-slate-800 text-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">🎉 Contact Details Unlocked 🎉</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail size={16} />
                    <span>{profileData?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={16} />
                    <span>{profileData?.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
