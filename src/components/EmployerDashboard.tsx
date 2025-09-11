import React, { useState, useEffect } from 'react';
import { Edit, FileText, Settings, Bell, Lock, HelpCircle, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileTagline, setProfileTagline] = useState<string>('');
  const [fullName, setFullName] = useState<string>('Loading...');
  const [companyName, setCompanyName] = useState<string>('Loading...');

  useEffect(() => {
    let isMounted = true;

    const fetchEmployerProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user logged in', userError);
        navigate('/employer/sign-in');
        return;
      }

      console.log("Auth user id:", user.id);

      const { data: profileRow, error: profileError } = await supabase
        .from('profile')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileRow) {
        console.error('Profile not found for auth user:', profileError);
        return;
      }

      console.log("Matched profile row:", profileRow);

      const { data: employer, error: employerError } = await supabase
        .from('employer')
        .select('given_name, middle_name, family_name, company_name, tagline, profile_photo')
        .eq('user_id', profileRow.user_id)
        .maybeSingle();

      if (employerError) {
        console.error('Error fetching employer profile:', employerError);
        return;
      }

      if (employer && isMounted) {
        console.log("Fetched Employer data:", employer);

        const nameParts = [employer.given_name, employer.middle_name, employer.family_name].filter(Boolean);
        if (nameParts.length > 0) setFullName(nameParts.join(' '));
        if (employer.company_name) setCompanyName(employer.company_name);
        if (employer.tagline) setProfileTagline(employer.tagline);

        if (employer.profile_photo) {
          console.log("Raw profile_photo from DB:", employer.profile_photo);

          let photoPath = employer.profile_photo;
          if (photoPath.includes('/profile_photo/')) {
            photoPath = photoPath.split('/profile_photo/')[1];
          }

          console.log("Normalized photo path:", photoPath);

          const { data, error } = await supabase
            .storage
            .from('profile_photo')
            .createSignedUrl(photoPath, 3600);

          if (error) {
            console.error("Error creating signed URL:", error);
          } else if (data?.signedUrl) {
            console.log("Final signed URL:", data.signedUrl);
            setProfilePhoto(data.signedUrl);
          }
        }
      } else {
        console.warn("Employer fetch returned null — ignoring");
      }
    };

    fetchEmployerProfile();

    return () => { isMounted = false };
  }, [navigate]);

  const settingsItems = [
    { icon: FileText, label: 'Edit Business Profile', color: 'text-gray-600' },
    { icon: Settings, label: 'Security', color: 'text-gray-600' },
    { icon: Bell, label: 'Notifications', color: 'text-gray-600' },
    { icon: Lock, label: 'Privacy', color: 'text-gray-600' },
    { icon: HelpCircle, label: 'Help & Support', color: 'text-gray-600' },
    { icon: Info, label: 'Terms and Policies', color: 'text-gray-600' },
    { icon: LogOut, label: 'Log out', color: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          {/* Main content container */}
          <div className="w-full h-full flex flex-col relative bg-gray-100">
            <div className="flex-1 px-6 pt-16 pb-24 overflow-y-auto">
              {/* Welcome Back Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>
              </div>

              {/* User Name Badge */}
              <div className="flex justify-center mb-6">
                <div className="bg-slate-800 text-white px-6 py-3 rounded-2xl">
                  <span className="font-medium text-base">{fullName}</span>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-slate-800 overflow-hidden">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      No Photo
                    </div>
                  )}
                </div>
              </div>

              {/* Business Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{companyName}</h2>
                <p className="text-gray-700 text-base leading-relaxed italic">
                  {profileTagline || 'No tagline added yet.'}
                </p>
              </div>

              {/* Edit Profile Button (Navy theme) */}
              <div className="flex justify-center mb-8">
                <button 
                  onClick={() => navigate('/employer/edit-profile')} 
                  className="flex items-center bg-slate-800 px-6 py-3 rounded-2xl hover:bg-slate-700 transition-colors"
                >
                  <Edit size={16} className="mr-2 text-white" />
                  <span className="text-white font-medium">Edit Profile</span>
                </button>
              </div>

              {/* Settings Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 px-2">Settings</h3>
                <div className="space-y-1">
                  {settingsItems.map((item, index) => {
                    const Icon = item.icon;
                    const isLogout = item.label === 'Log out';
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (item.label === 'Edit Business Profile') navigate('/employer/edit-business-profile');
                          else if (item.label === 'Security') navigate('/employer/security');
                          else if (item.label === 'Notifications') navigate('/employer/notifications');
                          else if (item.label === 'Privacy') navigate('/employer/privacy');
                          else if (item.label === 'Help & Support') navigate('/employer/help-support');
                          else if (item.label === 'Terms and Policies') navigate('/employer/terms-policies');
                          else if (item.label === 'Log out') {
                            supabase.auth.signOut();
                            navigate('/');
                          }
                        }}
                        className={`flex items-center w-full p-4 ${isLogout ? 'bg-red-50' : 'bg-white'} hover:bg-opacity-80 transition-colors`}
                      >
                        <Icon size={20} className={`mr-4 ${item.color}`} />
                        <span className={`text-left font-medium ${item.color}`}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
              <BottomNavigation />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
