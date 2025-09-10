import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
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
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          <div className="w-full h-full flex flex-col relative bg-gray-200">
            <div className="flex-1 px-6 pt-16 pb-24 overflow-y-auto">
              {/* Profile Card */}
              <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-lg">
                
                {/* Name Badge */}
                <div className="bg-orange-100 text-orange-700 text-center py-2 rounded-full mb-6 shadow-sm">
                  <h2 className="text-lg font-semibold">{profileData?.name}</h2>
                </div>

                {/* Profile Picture */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden shadow-md">
                    {profileData?.profilePhoto ? (
                      <img 
                        src={profileData.profilePhoto}
                        alt="Profile" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No Photo</div>
                    )}
                  </div>
                </div>

                {/* Tagline */}
                <div className="text-center mb-6">
                  <p className="text-gray-600 italic text-sm">
                    {profileData?.tagline || "No tagline yet"}
                  </p>
                </div>

                {/* Preferences */}
                <div className="mb-6 text-sm">
                  {preferences.length > 0 ? (
                    preferences.map((pref, i) => (
                      <div key={i} className="flex flex-col gap-1 mb-3">
                        <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium inline-block">
                          {pref.state} ({pref.area})
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs inline-block">
                          {pref.industry} – {pref.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs">No preferences added</p>
                  )}
                </div>

                {/* Latest Work Experience */}
                <div className="mb-6">
                  <span className="font-semibold text-sm">Latest Work Experience:</span>
                  <div className="mt-2 text-xs">
                    {workExperiences.length > 0 ? (
                      <div className="border-l-2 border-orange-200 pl-3">
                        <p className="font-medium">{workExperiences[0].position} – {workExperiences[0].industry}</p>
                        <p>{workExperiences[0].company} • {workExperiences[0].location}</p>
                        <p className="text-gray-500">{formatDate(workExperiences[0].start_date)} – {formatDate(workExperiences[0].end_date)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No work experience added</p>
                    )}
                  </div>
                </div>

                {/* Licenses / Tickets */}
                <div className="mb-6">
                  <span className="font-semibold text-sm">Licenses / Tickets:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
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

                {/* Action */}
                <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 justify-center shadow-md">
                  <span className="font-semibold">Heart to Match</span>
                  <div className="bg-orange-500 rounded-full p-2 shadow">
                    <Heart size={20} className="text-white fill-white" />
                  </div>
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <div className="absolute bottom-8 left-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-12 h-12 bg-white rounded-xl shadow-sm"
                onClick={() => navigate('/edit-profile')}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVProfilePreview;

