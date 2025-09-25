import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';

const ViewProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    given_name: '',
    middle_name: '',
    family_name: '',
    tagline: '',
    profile_photo: '',
    is_profile_visible: true
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      navigate('/sign-in');
      return;
    }

    const { data: whv, error: whvError } = await supabase
      .from('whv_maker')
      .select('given_name, middle_name, family_name, tagline, profile_photo, is_profile_visible')
      .eq('user_id', user.id)
      .maybeSingle();

    if (whvError) {
      console.error('Error fetching WHV profile:', whvError);
      return;
    }

    if (whv) {
      setProfileData(whv);

      if (whv.profile_photo) {
        let photoPath = whv.profile_photo;
        if (photoPath.includes('/profile_photo/')) {
          photoPath = photoPath.split('/profile_photo/')[1];
        }

        const { data, error } = await supabase
          .storage
          .from('profile_photo')
          .createSignedUrl(photoPath, 3600);

        if (error) {
          console.error("Error creating signed URL:", error);
        } else if (data?.signedUrl) {
          setProfilePhoto(data.signedUrl);
        }
      }
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('whv_maker')
      .update({ is_profile_visible: checked })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating visibility:', error);
    } else {
      setProfileData(prev => ({ ...prev, is_profile_visible: checked }));
    }
  };

  const fullName = [profileData.given_name, profileData.middle_name, profileData.family_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          {/* Main content container */}
          <div className="w-full h-full flex flex-col relative bg-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pt-16 bg-white border-b border-gray-200">
              <button 
                onClick={() => navigate('/whv/dashboard')}
                className="text-orange-500 text-lg font-medium"
              >
                Cancel
              </button>
              <h1 className="text-xl font-semibold text-gray-900">View Profile</h1>
              <div className="w-16"></div>
            </div>

            <div className="flex-1 px-6 py-6 overflow-y-auto space-y-6">
              {/* Profile Visibility Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Profile Visibility</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {profileData.is_profile_visible ? 'Your profile is visible to employers' : 'Your profile is hidden from employers'}
                    </p>
                  </div>
                  <Switch
                    checked={profileData.is_profile_visible}
                    onCheckedChange={handleVisibilityToggle}
                  />
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-500 overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Camera size={20} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{fullName || 'Name not set'}</h3>
                    <p className="text-gray-600 text-sm">{profileData.tagline || 'No tagline added'}</p>
                  </div>
                </div>
              </div>

              {/* Preview Profile Card Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Eye size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Preview Profile Card</h3>
                      <p className="text-sm text-gray-600">See how your profile appears to employers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/whv/profile-preview')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    VIEW
                  </button>
                </div>
              </div>

              {/* Preview Match Card Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Preview Match Card</h3>
                      <p className="text-sm text-gray-600">See how you appear in job matches</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/whv/match-card')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    VIEW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;