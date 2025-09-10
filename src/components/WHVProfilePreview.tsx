import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MapPin, Briefcase, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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

const WHVProfilePreview: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
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
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No user logged in", userError);
        navigate('/sign-in');
        return;
      }

      const { data: whv } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: preferencesData } = await supabase
        .from('maker_preference')
        .select(`
          region_rules(state, area),
          industry_role(role, industry_id, industry:industry(name))
        `)
        .eq('user_id', user.id);

      const { data: experiences } = await supabase
        .from('maker_work_experience')
        .select('start_date, end_date, position, company, location, industry:industry(name)')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      const { data: licenseRows } = await supabase
        .from('maker_license')
        .select('license(name)')
        .eq('user_id', user.id);

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
        tagline: whv?.tagline,
        profilePhoto: signedPhoto,
      });

      setPreferences((preferencesData || []).map(p => ({
        state: p.region_rules?.state || '',
        area: p.region_rules?.area || '',
        role: p.industry_role?.role || '',
        industry: p.industry_role?.industry?.name || ''
      })));

      setWorkExperiences((experiences || []).map(exp => ({
        start_date: exp.start_date,
        end_date: exp.end_date,
        position: exp.position,
        company: exp.company,
        location: exp.location,
        industry: exp.industry?.name || 'Not specified',
      })));

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
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Tinder-style big photo card */}
          <div className="relative flex-1">
            {profileData?.profilePhoto ? (
              <img 
                src={profileData.profilePhoto}
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">No Photo</div>
            )}

            {/* Overlay bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
              <h2 className="text-2xl font-bold">
                {profileData?.name}
              </h2>
              <p className="text-sm italic">{profileData?.tagline}</p>
              <div className="mt-3 space-y-1 text-sm">
                {preferences.map((pref, i) => (
                  <div key={i}>
                    {pref.state} ({pref.area}) • {pref.industry} – {pref.role}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable details area */}
          <div className="px-6 py-4 bg-white space-y-4 overflow-y-auto">
            {/* Work Experience */}
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-orange-500 mr-2" /> Work Experience
              </h3>
              {workExperiences.length > 0 ? (
                workExperiences.map((exp, i) => (
                  <div key={i} className="text-xs mb-2 border-l-2 border-orange-200 pl-2">
                    <p className="font-medium">{exp.position} – {exp.industry}</p>
                    <p>{exp.company} • {exp.location}</p>
                    <p className="text-gray-500">{formatDate(exp.start_date)} – {formatDate(exp.end_date)}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No work experience added</p>
              )}
            </div>

            {/* Licenses */}
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center mb-2">
                <Award className="w-4 h-4 text-orange-500 mr-2" /> Licenses & Tickets
              </h3>
              <div className="flex flex-wrap gap-2">
                {licenses.length > 0 ? (
                  licenses.map((license, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {license}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No licenses added</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Button (floating like Tinder) */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Button className="bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl">
              <Heart size={28} className="fill-white" />
            </Button>
          </div>

          {/* Back Button */}
          <div className="absolute top-16 left-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 bg-white rounded-full shadow"
              onClick={() => navigate('/edit-profile')}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVProfilePreview;

