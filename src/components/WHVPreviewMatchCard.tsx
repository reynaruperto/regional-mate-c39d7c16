import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, Award, User, FileBadge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No user logged in", userError);
        navigate('/whv/dashboard');
        return;
      }

      // 1. Fetch WHV maker profile
      const { data: whvMaker } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, nationality, profile_photo, suburb, state, visa_type, visa_expiry')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. Fetch preferences
      const { data: preferences } = await supabase
        .from('maker_preference')
        .select(`
          region_rules(state, area),
          industry_role(role, industry(name))
        `)
        .eq('user_id', user.id);

      // 3. Fetch work experiences
      const { data: experiences } = await supabase
        .from('maker_work_experience')
        .select('start_date, end_date, position, company, location, industry(name)')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      // 4. Fetch licenses
      const { data: licenseRows } = await supabase
        .from('maker_license')
        .select('license(name)')
        .eq('user_id', user.id);

      // 5. Fetch references (if table exists)
      const { data: refRows } = await supabase
        .from('maker_reference')
        .select('name, contact, relationship')
        .eq('user_id', user.id);

      // 6. Handle profile photo signed URL
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

      setProfileData({
        name: [whvMaker?.given_name, whvMaker?.middle_name, whvMaker?.family_name].filter(Boolean).join(' '),
        tagline: whvMaker?.tagline || 'Working Holiday Maker seeking opportunities',
        nationality: whvMaker?.nationality || 'Not specified',
        visaType: whvMaker?.visa_type || 'Not specified',
        visaExpiry: whvMaker?.visa_expiry || 'Not specified',
        profilePhoto: signedPhoto,
        currentLocation: whvMaker ? `${whvMaker.suburb}, ${whvMaker.state}` : 'Not specified',
        workPrefs: preferences?.map((p: any) =>
          `${p.industry_role?.industry?.name || ''} - ${p.industry_role?.role || ''}`
        ) || [],
        locationPrefs: preferences?.map((p: any) =>
          `${p.region_rules?.state || ''} (${p.region_rules?.area || ''})`
        ) || []
      });

      setWorkExperiences(experiences || []);
      setLicenses(licenseRows?.map(l => l.license?.name).filter(Boolean) || []);
      setReferences(refRows || []);
      setLoading(false);
    };

    fetchProfileData();
  }, [navigate]);

  const formatDate = (date: string | null) => {
    if (!date) return 'Present';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
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
                  <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <User size={32} />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{profileData?.tagline}</p>
              <p className="text-xs text-gray-500 mt-1">
                {profileData?.visaType} – Expires {profileData?.visaExpiry}
              </p>
            </div>

            {/* Info Box */}
            <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">

              {/* Current Location */}
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-orange-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Current Location:</span> {profileData?.currentLocation}
                </span>
              </div>

              {/* Nationality */}
              <div className="flex items-center space-x-3">
                <User size={16} className="text-orange-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Nationality:</span> {profileData?.nationality}
                </span>
              </div>

              {/* Work Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-2">Work Preferences</h3>
                {profileData?.workPrefs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.workPrefs.map((wp: string, i: number) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                        {wp}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No work preferences set</p>}
              </div>

              {/* Location Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-2">Location Preferences</h3>
                {profileData?.locationPrefs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.locationPrefs.map((lp: string, i: number) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                        {lp}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No location preferences set</p>}
              </div>

              {/* Work Experience */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-2">Work Experience</h3>
                {workExperiences.length > 0 ? (
                  <div className="space-y-3">
                    {workExperiences.map((exp, i) => (
                      <div key={i} className="border-l-2 border-orange-200 pl-3">
                        <p className="text-sm font-medium">{exp.position} – {exp.industry?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-600">{exp.company}, {exp.location}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No work experience added</p>}
              </div>

              {/* Licenses */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-2">Licenses & Certifications</h3>
                {licenses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No licenses added</p>}
              </div>

              {/* References */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-2 flex items-center">
                  <FileBadge size={16} className="text-orange-500 mr-1" />
                  References
                </h3>
                {references.length > 0 ? (
                  <div className="space-y-2">
                    {references.map((ref, i) => (
                      <p key={i} className="text-xs text-gray-700">
                        {ref.name} – {ref.relationship} ({ref.contact})
                      </p>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No references added</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
