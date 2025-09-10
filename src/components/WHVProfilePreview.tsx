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
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No user logged in", userError);
        navigate('/sign-in');
        return;
      }

      // 1. WHV Maker profile
      const { data: whv } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. Preferences
      const { data: preferences } = await supabase
        .from('maker_preference')
        .select(`
          region_rules(state, area),
          industry_role(role, industry(name))
        `)
        .eq('user_id', user.id);

      // 3. Work experience
      const { data: experiences } = await supabase
        .from('maker_work_experience')
        .select('start_date, end_date, position, company, industry(name), location')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      // 4. Licenses
      const { data: licenseRows } = await supabase
        .from('maker_license')
        .select('license(name)')
        .eq('user_id', user.id);

      // 5. Signed profile photo
      let signedPhoto: string | null = null;
      if (whv?.profile_photo) {
        let photoPath = whv.profile_photo;
        if (photoPath.includes('/profile_photo/')) {
          photoPath = photoPath.split('/profile_photo/')[1];
        }
        const { data } = await supabase
          .storage
          .from('profile_photo')
          .createSignedUrl(photoPath, 3600);
        signedPhoto = data?.signedUrl ?? null;
      }

      setProfileData({
        name: [whv?.given_name, whv?.middle_name, whv?.family_name].filter(Boolean).join(' '),
        tagline: whv?.tagline || "No tagline added",
        profilePhoto: signedPhoto,
        workPrefs: preferences?.map((p: any) =>
          `${p.industry_role?.industry?.name || ''} - ${p.industry_role?.role || ''}`
        ) || [],
        locationPrefs: preferences?.map((p: any) =>
          `${p.region_rules?.state || ''} (${p.region_rules?.area || ''})`
        ) || []
      });

      setWorkExperiences(experiences || []);
      setLicenses(licenseRows?.map(l => l.license?.name) || []);
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const formatDate = (date: string | null) => {
    if (!date) return 'Present';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          {/* Header */}
          <div className="px-6 pt-16 pb-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10"
                onClick={() => navigate('/edit-profile')}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Match Card Preview</h1>
              <div className="w-10"></div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 px-6 py-4 overflow-y-auto space-y-6">

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
              <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{profileData?.tagline}</p>
            </div>

            {/* Main Info Box */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">

              {/* Work Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <Briefcase size={16} className="text-orange-500 mr-2" />
                  Work Preferences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData?.workPrefs.length > 0 ? (
                    profileData.workPrefs.map((wp: string, i: number) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                        {wp}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No work preferences set</p>
                  )}
                </div>
              </div>

              {/* Location Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin size={16} className="text-orange-500 mr-2" />
                  Location Preferences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData?.locationPrefs.length > 0 ? (
                    profileData.locationPrefs.map((lp: string, i: number) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                        {lp}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No location preferences set</p>
                  )}
                </div>
              </div>

              {/* Work Experience */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Experience</h3>
                {workExperiences.length > 0 ? (
                  <div className="space-y-3">
                    {workExperiences.map((exp, i) => (
                      <div key={i} className="border-l-2 border-orange-200 pl-3">
                        <p className="text-sm font-medium">{exp.position} – {exp.industry?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-600">{exp.company}, {exp.location}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No work experience added</p>
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
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
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

export default WHVPreviewMatchCard;
