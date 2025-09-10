import React, { useState, useEffect } from 'react';
import { Edit, FileText, Shield, Bell, Lock, HelpCircle, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileTagline, setProfileTagline] = useState<string>('');
  const [fullName, setFullName] = useState<string>('User');

  useEffect(() => {
    let isMounted = true; // ✅ guard against double-fetch

    const fetchWHVProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user logged in', userError);
        navigate('/sign-in');
        return;
      }

      console.log("Auth user id:", user.id);

      // Step 1: get profile row using auth.user.id
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

      // Step 2: fetch WHV row with profile.user_id
      const { data: whv, error: whvError } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo')
        .eq('user_id', profileRow.user_id)
        .maybeSingle();

      if (whvError) {
        console.error('Error fetching WHV profile:', whvError);
        return;
      }

      if (whv && isMounted) {
        console.log("Fetched WHV data:", whv);

        const nameParts = [whv.given_name, whv.middle_name, whv.family_name].filter(Boolean);
        setFullName(nameParts.join(' '));
        setProfileTagline(whv.tagline || '');
        setProfilePhoto(whv.profile_photo || null);
      } else {
        console.warn("No WHV data found for this user");
      }
    };

    fetchWHVProfile();

    return () => { isMounted = false }; // ✅ cleanup
  }, [navigate]);

  const settingsItems = [
    { icon: FileText, label: 'Edit WHV Profile', color: 'text-gray-600' },
    { icon: Shield, label: 'Security', color: 'text-gray-600' },
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
                <div className="bg-orange-500 text-white px-6 py-3 rounded-2xl">
                  <span className="font-medium text-base">{fullName}</span>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      No Photo
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Description */}
              <div className="text-center mb-6">
                <p className="text-gray-700 text-base leading-relaxed">
                  {profileTagline || 'No tagline added yet.'}
                </p>
              </div>

              {/* Edit Profile Button */}
              <div className="flex justify-center mb-8">
                <button 
                  onClick={() => navigate('/whv/profile-edit')}
                  className="flex items-center bg-gray-200 px-6 py-3 rounded-2xl hover:bg-gray-300 transition-colors"
                >
                  <Edit size={16} className="mr-2 text-gray-700" />
                  <span className="text-gray-700 font-medium">Edit Profile</span>
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
                          if (item.label === 'Edit WHV Profile') navigate('/whv/edit-WHVdetails');
                          else if (item.label === 'Security') navigate('/security');
                          else if (item.label === 'Notifications') navigate('/notifications');
                          else if (item.label === 'Privacy') navigate('/privacy');
                          else if (item.label === 'Help & Support') navigate('/help-support');
                          else if (item.label === 'Terms and Policies') navigate('/terms-policies');
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

export default Dashboard;
