import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, MapPin, Award, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/sign-in');
        return;
      }

      // 1. Profile
      const { data: whv } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo, suburb, state, nationality')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. Preferences
      const { data: prefs } = await supabase
        .from('maker_preference')
        .select(`
          region_rules(state, area),
          industry_role(role, industry(name))
        `)
        .eq('user_id', user.id);

      // 3. Work Experience
      const { data: exp } = await supabase
        .from('maker_work_experience')
        .select('start_date, end_date, position, company, industry(name), location')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      // 4. Licenses
      const { data: licenseRows } = await supabase
        .from('maker_license')
        .select('license(name)')
        .eq('user_id', user.id);

      // 5. Signed photo
      let signedPhoto: string | null = null;
      if (whv?.profile_photo) {
        let photoPath = whv.profile_photo.includes('/profile_photo/')
          ? whv.profile_photo.split('/profile_photo/')[1]
          : whv.profile_photo;
        const { data } = await supabase.storage.from('profile_photo').createSignedUrl(photoPath, 3600);
        signedPhoto = data?.signedUrl ?? null;
      }

      setProfileData({
        name: [whv?.given_name, whv?.middle_name, whv?.family_name].filter(Boolean).join(' '),
        tagline: whv?.tagline || 'Working Holiday Maker seeking opportunities',
        nationality: whv?.nationality || 'Not specified',
        currentLocation: whv ? `${whv.suburb}, ${whv.state}` : 'Not specified',
        profilePhoto: signedPhoto,
        workPrefs: prefs?.map(p => `${p.industry_role?.industry?.name} – ${p.industry_role?.role}`) || [],
        locationPrefs: prefs?.map(p => `${p.region_rules?.state} (${p.region_rules?.area})`) || []
      });

      setWorkExperiences(exp || []);
      setLicenses(licenseRows?.map(l => l.license?.name).filter(Boolean) || []);
      setLoading(false);
    };

    fetchProfileData();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-4 py-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/edit-profile')}
              className="w-10 h-10 bg-white rounded-full shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            {/* Photo + Basic Info */}
            <div className="relative mb-6">
              <div className="w-full h-56 rounded-2xl overflow-hidden shadow">
                {profileData?.profilePhoto ? (
                  <img
                    src={profileData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                It’s a Match!
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{profileData?.tagline}</p>
              <p className="text-xs text-gray-500 mt-1">{profileData?.currentLocation}</p>
            </div>

            {/* Work Preferences */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Briefcase size={16} className="text-orange-500 mr-2" />
                Work Preferences
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData?.workPrefs.length > 0 ? (
                  profileData.workPrefs.map((wp: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {wp}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No work preferences set</p>
                )}
              </div>
            </div>

            {/* Location Preferences */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <MapPin size={16} className="text-orange-500 mr-2" />
                Location Preferences
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData?.locationPrefs.length > 0 ? (
                  profileData.locationPrefs.map((lp: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {lp}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No location preferences set</p>
                )}
              </div>
            </div>

            {/* Work Experience */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Work Experience</h3>
              {workExperiences.length > 0 ? (
                <div className="space-y-3">
                  {workExperiences.map((exp, i) => (
                    <div key={i} className="border-l-2 border-orange-200 pl-3">
                      <h4 className="font-medium text-gray-800">{exp.position}</h4>
                      <p className="text-sm text-gray-600">
                        {exp.company} • {exp.industry?.name || 'Industry not set'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {exp.location || ''} | {exp.start_date} – {exp.end_date || 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No work experience added</p>
              )}
            </div>

            {/* Licenses */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Award size={16} className="text-orange-500 mr-2" />
                Licenses & Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {licenses.length > 0 ? (
                  licenses.map((l, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {l}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No licenses added</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-6 left-6 right-6">
            <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <span>Heart to Match</span>
              <Heart size={18} className="fill-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
