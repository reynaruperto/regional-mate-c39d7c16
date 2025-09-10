import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, Award, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
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

interface Reference {
  name: string | null;
  business_name: string | null;
  email: string | null;
}

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [workPreferences, setWorkPreferences] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<string[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/sign-in');
          return;
        }

        // 1. WHV Maker (basic info + photo)
        const { data: whvMaker } = await supabase
          .from('whv_maker')
          .select('given_name, middle_name, family_name, tagline, profile_photo, suburb, state, nationality')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Visa info
        const { data: visa } = await supabase
          .from('maker_visa')
          .select('stage_id, expiry_date')
          .eq('user_id', user.id)
          .maybeSingle();

        // 3. Preferences
        const { data: preferences } = await supabase
          .from('maker_preference')
          .select(`
            region_rules(state, area),
            industry_role(role, industry(name))
          `)
          .eq('user_id', user.id);

        // 4. Work experiences
        const { data: experiences } = await supabase
          .from('maker_work_experience')
          .select('position, company, industry(name), location, start_date, end_date')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        // 5. Licenses
        const { data: licenseRows } = await supabase
          .from('maker_license')
          .select('license(name)')
          .eq('user_id', user.id);

        // 6. References
        const { data: referenceRows } = await supabase
          .from('maker_reference')
          .select('name, business_name, email')
          .eq('user_id', user.id);

        // Profile Photo Signed URL
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
          name: [whvMaker?.given_name, whvMaker?.middle_name, whvMaker?.family_name].filter(Boolean).join(' '),
          tagline: whvMaker?.tagline || 'Working Holiday Maker seeking opportunities',
          profilePhoto: signedPhoto,
          currentLocation: whvMaker ? `${whvMaker.suburb || ''}, ${whvMaker.state || ''}` : 'Not specified',
          nationality: whvMaker?.nationality || 'Not specified',
          visaType: visa?.stage_id ? `Subclass ${visa.stage_id}` : 'Not specified',
          visaExpiry: visa?.expiry_date ? new Date(visa.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Not specified',
        });

        setWorkPreferences(preferences?.map((p: any) => `${p.industry_role?.industry?.name || ''} - ${p.industry_role?.role || ''}`).filter(Boolean) || []);
        setLocationPreferences(preferences?.map((p: any) => `${p.region_rules?.state} (${p.region_rules?.area})`).filter(Boolean) || []);
        setWorkExperiences(experiences || []);
        setLicenses(licenseRows?.map(l => l.license?.name).filter(Boolean) || []);
        setReferences(referenceRows || []);
      } catch (err) {
        console.error('Error loading profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="px-6 pt-16 pb-6 overflow-y-auto h-full space-y-6">
            
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full border-4 border-orange-500 overflow-hidden">
                {profileData?.profilePhoto ? (
                  <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-400 mx-auto mt-8" />
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold">{profileData?.name}</h2>
              <p className="text-gray-600">{profileData?.tagline}</p>
              <p className="text-sm text-gray-500 mt-1">
                {profileData?.nationality} – Expires {profileData?.visaExpiry}
              </p>
            </div>

            {/* Info Box */}
            <div className="border-2 border-orange-500 rounded-2xl p-5 space-y-6">
              {/* Current Location */}
              <div className="flex items-center space-x-3">
                <MapPin className="text-orange-500" size={18} />
                <p className="text-sm"><span className="font-semibold">Current Location:</span> {profileData?.currentLocation}</p>
              </div>

              {/* Work Preferences */}
              <div>
                <h3 className="text-orange-600 font-semibold flex items-center mb-2"><Briefcase size={16} className="mr-2" /> Work Preferences</h3>
                {workPreferences.length > 0 ? (
                  <ul className="list-disc ml-5 text-sm text-gray-700">
                    {workPreferences.map((wp, i) => <li key={i}>{wp}</li>)}
                  </ul>
                ) : <p className="text-gray-500 text-sm">No work preferences set</p>}
              </div>

              {/* Location Preferences */}
              <div>
                <h3 className="text-orange-600 font-semibold mb-2">Location Preferences</h3>
                {locationPreferences.length > 0 ? (
                  <ul className="list-disc ml-5 text-sm text-gray-700">
                    {locationPreferences.map((lp, i) => <li key={i}>{lp}</li>)}
                  </ul>
                ) : <p className="text-gray-500 text-sm">No location preferences set</p>}
              </div>

              {/* Work Experience */}
              <div>
                <h3 className="text-orange-600 font-semibold mb-2">Work Experience</h3>
                {workExperiences.length > 0 ? (
                  <div className="space-y-3">
                    {workExperiences.map((exp, i) => (
                      <div key={i} className="border-l-2 border-orange-300 pl-3">
                        <p className="font-medium">{exp.position} – {exp.industry}</p>
                        <p className="text-sm text-gray-700">{exp.company}, {exp.location}</p>
                        <p className="text-xs text-gray-500">{exp.start_date} – {exp.end_date || 'Present'}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No work experience added yet</p>}
              </div>

              {/* Licenses */}
              <div>
                <h3 className="text-orange-600 font-semibold flex items-center mb-2"><Award size={16} className="mr-2" /> Licenses & Certifications</h3>
                {licenses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((l, i) => (
                      <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">{l}</span>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No licenses added</p>}
              </div>

              {/* References */}
              <div>
                <h3 className="text-orange-600 font-semibold flex items-center mb-2"><FileText size={16} className="mr-2" /> References</h3>
                {references.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {references.map((ref, i) => (
                      <li key={i} className="border rounded-lg p-2">
                        <p className="font-medium">{ref.name || 'No name'}</p>
                        <p className="text-gray-700">{ref.business_name}</p>
                        <p className="text-xs text-gray-500">{ref.email}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-gray-500 text-sm">No references added</p>}
              </div>
            </div>

            {/* Footer */}
            <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 text-white rounded-xl py-3">
              ❤️ Heart to Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPreviewMatchCard;
