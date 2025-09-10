import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MapPin, Briefcase, Award } from 'lucide-react';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/sign-in');
        return;
      }

      // WHV maker profile
      const { data: whv } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, nationality, suburb, state, profile_photo')
        .eq('user_id', user.id)
        .maybeSingle();

      // Preferences
      const { data: preferences } = await supabase
        .from('maker_preference')
        .select(`
          region_rules(state, area),
          industry_role(role, industry)
        `)
        .eq('user_id', user.id);

      // Work experience
      const { data: experiences } = await supabase
        .from('maker_work_experience')
        .select('start_date, end_date, position, company, industry, location')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      // Licenses
      const { data: licenseRows } = await supabase
        .from('maker_license')
        .select('license(name)')
        .eq('user_id', user.id);

      // Profile photo signed URL
      let signedPhoto: string | null = null;
      if (whv?.profile_photo) {
        let photoPath = whv.profile_photo;
        if (photoPath.includes('/profile_photo/')) {
          photoPath = photoPath.split('/profile_photo/')[1];
        }
        const { data } = await supabase.storage
          .from('profile_photo')
          .createSignedUrl(photoPath, 3600);
        signedPhoto = data?.signedUrl ?? null;
      }

      setProfileData({
        name: [whv?.given_name, whv?.middle_name, whv?.family_name].filter(Boolean).join(' '),
        tagline: whv?.tagline || 'No tagline yet',
        nationality: whv?.nationality || 'Not specified',
        currentLocation: `${whv?.suburb || ''}, ${whv?.state || ''}`,
        profilePhoto: signedPhoto,
        preferences: preferences || []
      });

      setWorkExperiences(experiences || []);
      setLicenses(licenseRows?.map(l => l.license?.name).filter(Boolean) || []);
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
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/edit-profile')}>
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-base font-semibold">Profile Preview</h1>
            <div className="w-6" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Photo + Name */}
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden mb-3">
                {profileData?.profilePhoto ? (
                  <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No Photo</div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
              <p className="text-sm text-gray-600 italic">{profileData?.tagline}</p>
              <div className="flex gap-2 mt-2 text-xs text-gray-700">
                <span className="px-3 py-1 bg-gray-100 rounded-full">{profileData?.nationality}</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">{profileData?.currentLocation}</span>
              </div>
            </div>

            {/* Work Preferences */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {profileData?.preferences.map((p: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {p.industry_role?.industry} – {p.industry_role?.role}
                  </span>
                ))}
              </div>
            </div>

            {/* Location Preferences */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Location Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {profileData?.preferences.map((p: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {p.region_rules?.state} – {p.region_rules?.area}
                  </span>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Experience</h3>
              {workExperiences.length > 0 ? (
                <div className="space-y-3">
                  {workExperiences.map((exp, i) => (
                    <div key={i} className="border-l-2 border-orange-200 pl-3">
                      <p className="text-sm font-medium">{exp.position} – {exp.industry}</p>
                      <p className="text-xs text-gray-600">{exp.company}, {exp.location}</p>
                      <p className="text-xs text-gray-500">{exp.start_date} - {exp.end_date || 'Present'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No work experience added</p>
              )}
            </div>

            {/* Licenses */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Licenses & Tickets</h3>
              <div className="flex flex-wrap gap-2">
                {licenses.length > 0 ? (
                  licenses.map((l, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {l}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No licenses added</p>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Action Button */}
          <div className="p-4 bg-white border-t">
            <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Heart size={18} className="fill-white" /> Heart to Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
