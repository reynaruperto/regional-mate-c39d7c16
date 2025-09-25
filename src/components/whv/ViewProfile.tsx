import React, { useState, useEffect } from 'react';
import { Eye, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ViewProfile: React.FC = () => {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    given_name: '',
    middle_name: '',
    family_name: '',
    tagline: '',
    profile_photo: null as string | null,
    is_profile_visible: true
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("No user logged in", error);
        navigate('/sign-in');
        return;
      }

      const { data: whv, error: whvError } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo, is_profile_visible')
        .eq('user_id', user.id)
        .maybeSingle();

      if (whvError) {
        console.error("Error fetching WHV profile:", whvError);
        return;
      }

      if (whv) {
        setProfileData({
          given_name: whv.given_name || '',
          middle_name: whv.middle_name || '',
          family_name: whv.family_name || '',
          tagline: whv.tagline || '',
          profile_photo: whv.profile_photo,
          is_profile_visible: whv.is_profile_visible ?? true
        });
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          <div className="w-full h-full flex flex-col relative bg-gray-100">
            {/* Header */}
            <div className="px-6 pt-16 pb-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => navigate('/whv/dashboard')} 
                  className="text-orange-500 font-medium underline"
                >
                  Back
                </button>
                <h1 className="text-lg font-semibold text-gray-900">View Profile</h1>
                <div className="w-12"></div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto">
              {/* Profile Picture */}
              <div className="mb-6 flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500">
                    {profileData.profile_photo ? (
                      <img src={profileData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center pointer-events-none">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Profile Visibility */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Profile Visibility</h3>
                    <p className="text-sm text-gray-500">
                      Your profile is currently {profileData.is_profile_visible ? 'visible' : 'hidden'} to employers
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">
                      {profileData.is_profile_visible ? "ON" : "OFF"}
                    </span>
                    <Switch 
                      checked={profileData.is_profile_visible}
                      disabled
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Profile Card */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Preview Profile Card</h3>
                  <Button 
                    onClick={() => navigate('/whv/profile-preview')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm flex items-center"
                  >
                    <Eye size={16} className="mr-2" />
                    VIEW
                  </Button>
                </div>
              </div>

              {/* Preview Match Card */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Preview Match Card</h3>
                  <Button 
                    onClick={() => navigate('/whv/match-card')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm flex items-center"
                  >
                    <Eye size={16} className="mr-2" />
                    VIEW
                  </Button>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Profile Summary</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 font-medium">
                    {profileData.given_name} {profileData.middle_name} {profileData.family_name}
                  </p>
                  {profileData.tagline && (
                    <p className="text-sm text-gray-700 italic">{profileData.tagline}</p>
                  )}
                </div>
              </div>

              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;

export default ViewProfile;
