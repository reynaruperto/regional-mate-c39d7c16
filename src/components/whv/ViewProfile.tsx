import React, { useState, useEffect } from 'react';
import { Eye, Check, Camera } from 'lucide-react';
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
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Preview Profile Card</h3>
                    <p className="text-sm text-gray-500">See how your profile appears to employers</p>
                  </div>
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
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Preview Match Card</h3>
                    <p className="text-sm text-gray-500">See how you appear in employer matches</p>
                  </div>
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
                  <div>
                    <span className="text-sm text-gray-500">Name: </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {profileData.given_name} {profileData.middle_name} {profileData.family_name}
                    </span>
                  </div>
                  {profileData.tagline && (
                    <div>
                      <span className="text-sm text-gray-500">Tagline: </span>
                      <span className="text-sm text-gray-900">{profileData.tagline}</span>
                    </div>
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