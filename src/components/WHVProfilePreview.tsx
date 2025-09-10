import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const WHVProfilePreview: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No user logged in", userError);
        navigate('/sign-in');
        return;
      }

      // 1. Fetch WHV maker profile
      const { data: whv } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. Fetch preferences (state/area + role)
      const { data: preference } = await supabase
        .from('maker_preference')
        .select(`
          region_rules(state, area),
          industry_role(role)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      // 3. Fetch work experiences
      const { data: experiences } = await supabase
        .from('maker_work_experience')
        .select('start_date, end_date, position, company')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      // 4. Fetch licenses
      const { data: licenseRows } = await supabase
        .from('maker_license')
        .select('license(name)')
        .eq('user_id', user.id);

      // 5. Handle profile photo signed URL
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
        preferredLocation: preference?.region_rules
          ? `${preference.region_rules.state} (${preference.region_rules.area})`
          : 'Not set',
        preferredRole: preference?.industry_role?.role || 'Not set',
      });

      setWorkExperiences(experiences || []);
      setLicenses(licenseRows?.map(l => l.license?.name) || []);
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
                
                {/* Name Header */}
                <div className="bg-orange-500 text-white text-center py-4 rounded-2xl mb-6">
                  <h2 className="text-xl font-bold">{profileData?.name}</h2>
                </div>

                {/* Profile Picture */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden">
                    {profileData?.profilePhoto ? (
                      <img 
                        src={profileData.profilePhoto}
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No Photo</div>
                    )}
                  </div>
                </div>

                {/* Tagline */}
                <div className="text-center mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {profileData?.tagline || "No tagline yet"}
                  </p>
                </div>

                {/* Preferred Location & Role */}
                <div className="space-y-2 text-sm mb-6">
                  <div><span className="font-semibold">Preferred Location:</span> {profileData?.preferredLocation}</div>
                  <div><span className="font-semibold">Preferred Role:</span> {profileData?.preferredRole}</div>
                </div>

                {/* Work Experience */}
                <div className="mb-6">
                  <span className="font-semibold text-sm">Work Experience:</span>
                  <div className="mt-2 text-xs space-y-1">
                    {workExperiences.length > 0 ? (
                      workExperiences.map((exp, i) => (
                        <div key={i}>
                          {exp.start_date} - {exp.end_date || 'Present'}: {exp.position} at {exp.company}
                        </div>
                      ))
                    ) : (
                      <p>No work experience added</p>
                    )}
                  </div>
                </div>

                {/* Licenses / Tickets */}
                <div className="mb-6">
                  <span className="font-semibold text-sm">Licenses / Tickets:</span>
                  <div className="mt-2 text-xs space-y-1">
                    {licenses.length > 0 ? (
                      licenses.map((license, i) => <div key={i}>{license}</div>)
                    ) : (
                      <p>No licenses added</p>
                    )}
                  </div>
                </div>

                {/* Action */}
                <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 justify-center">
                  <span className="font-semibold">Heart to Match</span>
                  <div className="bg-orange-500 rounded-full p-2">
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
