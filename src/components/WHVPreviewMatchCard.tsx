// src/components/WHVPreviewMatchCard.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Phone, Mail } from 'lucide-react';
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
  availableDate: string;
  phone?: string;
  email?: string;
}

interface WorkExperience {
  position: string;
  company: string;
  industry: string;
  location: string;
  start_date: string;
  end_date: string | null;
  description?: string;
}

interface Preference {
  industry?: string;
  role?: string;
  state?: string;
  area?: string;
}

interface Reference {
  name: string;
  business_name: string;
  email: string;
  mobile_num?: string;
}

const WHVPreviewMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<WHVProfileData | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [workPreferences, setWorkPreferences] = useState<Preference[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<Preference[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Consistent date formatting across all components
  const formatDate = (d: string | null) => {
    if (!d) return "Not set";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const categorizeYears = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years < 1) return "<1 yr";
    if (years < 3) return "1–2 yrs";
    if (years < 5) return "3–4 yrs";
    if (years < 8) return "5–7 yrs";
    if (years < 11) return "8–10 yrs";
    return "10+ yrs";
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/whv/dashboard');
          return;
        }

        // 1. WHV maker
        const { data: whvMaker } = await supabase
          .from('whv_maker')
          .select('given_name, middle_name, family_name, tagline, nationality, profile_photo, suburb, state, mobile_num')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Profile email
        const { data: profile } = await supabase
          .from('profile')
          .select('email')
          .eq('user_id', user.id)
          .maybeSingle();

        // 3. Visa
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

        let visaType = "Not specified";
        if (visa?.visa_stage) {
          const { sub_class, label } = visa.visa_stage;
          visaType = label.includes(sub_class) ? label : `${sub_class} (${label})`;
        }

        // 4. Availability
        const { data: availability } = await supabase
          .from('maker_pref_availability')
          .select('available_from')
          .eq('user_id', user.id)
          .maybeSingle();

        // 5. Work Preferences
        const { data: workPrefsData } = await supabase
          .from('maker_pref_industry_role')
          .select(`
            industry_role (
              role,
              industry(name)
            )
          `)
          .eq('user_id', user.id);

        const formattedWorkPrefs: Preference[] = (workPrefsData || []).map((pref: any) => ({
          industry: pref.industry_role?.industry?.name || '',
          role: pref.industry_role?.role || '',
        }));
        setWorkPreferences(formattedWorkPrefs);

        // 6. Location Preferences
        const { data: locationPrefsData } = await supabase
          .from('maker_pref_location')
          .select('state, suburb_city, postcode')
          .eq('user_id', user.id);

        const formattedLocationPrefs: Preference[] = (locationPrefsData || []).map((loc: any) => ({
          state: loc.state,
          area: `${loc.suburb_city} (${loc.postcode})`,
        }));
        setLocationPreferences(formattedLocationPrefs);

        // 7. Work experience
        const { data: experiences } = await supabase
          .from('maker_work_experience' as any)
          .select('position, company, industry_id, location, start_date, end_date, job_description')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        const { data: industryData } = await supabase
          .from('industry')
          .select('industry_id, name');

        const formattedExperiences: WorkExperience[] = (experiences || []).map((exp: any) => {
          const industry = industryData?.find((ind: any) => ind.industry_id === exp.industry_id);
          return {
            position: exp.position,
            company: exp.company,
            industry: industry?.name || 'Not specified',
            location: exp.location || 'Not specified',
            start_date: exp.start_date,
            end_date: exp.end_date,
            description: exp.job_description || '',
          };
        });
        setWorkExperiences(formattedExperiences);

        // 8. Licenses
        const { data: licenseRows } = await supabase
          .from('maker_license')
          .select('license(name)')
          .eq('user_id', user.id);

        const formattedLicenses: string[] = (licenseRows || []).map((l: any) => l.license?.name || 'Unknown License');
        setLicenses(formattedLicenses);

        // 9. References
        const { data: referenceRows } = await supabase
          .from('maker_reference')
          .select('name, business_name, email, mobile_num')
          .eq('user_id', user.id);

        setReferences(referenceRows || []);

        // 10. Profile photo
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
          currentLocation: whvMaker ? `${whvMaker.suburb}, ${whvMaker.state}` : 'Not specified',
          nationality: whvMaker?.nationality || 'Not specified',
          visaType,
          visaExpiry: visa?.expiry_date || 'Not specified',
          availableDate: availability?.available_from || 'Not specified',
          phone: whvMaker?.mobile_num || '',
          email: profile?.email || '',
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const groupedWorkPrefs = workPreferences.reduce((acc: any, pref) => {
    if (!pref.industry || !pref.role) return acc;
    if (!acc[pref.industry]) acc[pref.industry] = new Set();
    acc[pref.industry].add(pref.role);
    return acc;
  }, {});

  const groupedLocationPrefs = locationPreferences.reduce((acc: any, pref) => {
    if (!pref.state || !pref.area) return acc;
    if (!acc[pref.state]) acc[pref.state] = new Set();
    acc[pref.state].add(pref.area);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 bg-white shadow-sm flex items-center justify-between">
              <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => navigate('/edit-profile')}>
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Matched Profile</h1>
              <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <div className="border-2 border-orange-500 rounded-2xl p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-2 border-orange-500 overflow-hidden mb-3">
                    {profileData?.profilePhoto ? (
                      <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{profileData?.name}</h2>
                  <p className="text-sm text-gray-600">{profileData?.tagline}</p>

                  {profileData?.nationality !== "Not specified" && (
                    <p className="text-xs text-gray-500">{profileData.nationality}</p>
                  )}
                  {profileData?.visaType !== "Not specified" && (
                    <p className="text-xs text-gray-500">{profileData.visaType}</p>
                  )}
                  {profileData?.visaExpiry !== "Not specified" && (
                    <p className="text-xs text-gray-500">
                      Expires {formatDate(profileData.visaExpiry)}
                    </p>
                  )}
                  {profileData?.availableDate !== "Not specified" && (
                    <p className="text-xs text-gray-500">
                      Available From: {formatDate(profileData.availableDate)}
                    </p>
                  )}

                  {profileData?.phone && (
                    <p className="text-sm text-gray-700 flex items-center mt-1">
                      <Phone size={14} className="mr-1 text-orange-500" /> {profileData.phone}
                    </p>
                  )}
                  {profileData?.email && (
                    <p className="text-sm text-gray-700 flex items-center mt-1">
                      <Mail size={14} className="mr-1 text-orange-500" /> {profileData.email}
                    </p>
                  )}
                </div>

                {/* Work Preferences */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Work Preferences</h3>
                  {Object.keys(groupedWorkPrefs).length > 0 ? (
                    Object.entries(groupedWorkPrefs).map(([industry, roles]) => (
                      <div key={industry} className="mb-2">
                        <p className="font-medium">{industry}</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          {Array.from(roles as Set<string>).map((role, idx) => (
                            <li key={idx}>{role}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No work preferences set</p>
                  )}
                </div>

                {/* Location Preferences */}
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Location Preferences</h3>
                  {Object.keys(groupedLocationPrefs).length > 0 ? (
                    Object.entries(groupedLocationPrefs).map(([state, areas]) => (
                      <div key={state} className="mb-2">
                        <p className="font-medium">{state}</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          {Array.from(areas as Set<string>).map((area, idx) => (
                            <li key={idx}>{area}</li>
                          ))}
                        </ul>
                      </div>
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
                      <div key={idx} className="border p-3 rounded-lg mb-2 text-sm text-gray-700">
                        <p><span className="font-medium">Company:</span> {exp.company}</p>
                        <p><span className="font-medium">Industry:</span> {exp.industry}</p>
                        <p><span className="font-medium">Position:</span> {exp.position}</p>
                        <p><span className="font-medium">Location:</span> {exp.location}</p>
                        <p>
                          <span className="font-medium">Dates:</span>{" "}
                          {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : "Present"}{" "}
                          ({categorizeYears(exp.start_date, exp.end_date)})
                        </p>
                        {exp.description && <p><span className="font-medium">Description:</span> {exp.description}</p>}
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
                        <span key={idx} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
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
                    <FileText size={16} className="mr-2" /> References
                  </h3>
                  {references.length > 0 ? (
                    references.map((ref, idx) => (
                      <div key={idx} className="border p-3 rounded-lg mb-2 text-sm text-gray-700">
                        <p><span className="font-medium">Name:</span> {ref.name}</p>
                        <p><span className="font-medium">Business:</span> {ref.business_name}</p>
                        <p><span className="font-medium">Email:</span> {ref.email}</p>
                        {ref.mobile_num && <p><span className="font-medium">Phone:</span> {ref.mobile_num}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No references added</p>
                  )}
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
