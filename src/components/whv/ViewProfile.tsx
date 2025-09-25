import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase, Tables } from '@/integrations/supabase/client';

const ViewProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileVisible, setProfileVisible] = useState(true);
  const [givenName, setGivenName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');

  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("No user logged in", error);
        navigate('/sign-in');
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: whv, error: whvError } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, profile_photo, is_profile_visible')
        .eq('user_id', user.id)
        .maybeSingle();

      if (whvError) {
        console.error("Error fetching WHV profile:", whvError);
        return;
      }

      if (whv) {
        setGivenName(whv.given_name || '');
        setMiddleName(whv.middle_name || '');
        setFamilyName(whv.family_name || '');
        setProfileVisible(whv.is_profile_visible ?? true);

        if (whv.profile_photo) {
          let photoPath = whv.profile_photo;
          if (photoPath.includes('/profile_photo/')) {
            photoPath = photoPath.split('/profile_photo/')[1];
          }

          const { data } = await supabase
            .storage
            .from('profile_photo')
            .createSignedUrl(photoPath, 3600);

          if (data?.signedUrl) setProfilePhoto(data.signedUrl);
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !userId) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('profile_photo')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('whv_maker')
        .update({ profile_photo: filePath })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      const { data } = await supabase
        .storage
        .from('profile_photo')
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) setProfilePhoto(data.signedUrl);

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully",
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!userId) return;

    if (!givenName.trim() || !familyName.trim()) {
      toast({
        title: "Missing required fields",
        description: "First Name and Last Name are mandatory",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('whv_maker')
      .update({
        given_name: givenName,
        middle_name: middleName || null,
        family_name: familyName,
        is_profile_visible: profileVisible
      })
      .eq('user_id', userId);

    if (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated",
    });
    navigate('/whv/dashboard');
  };

  const handleCancel = () => {
    navigate('/whv/dashboard');
  };

  const handlePreviewProfile = () => {
    navigate('/whv/profile-preview');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          <div className="w-full h-full flex flex-col relative bg-gray-100">
            {/* Header */}
            <div className="px-6 pt-16 pb-4">
              <div className="flex items-center justify-between">
                <button onClick={handleCancel} className="text-orange-500 font-medium underline">
                  Cancel
                </button>
                <h1 className="text-lg font-semibold text-gray-900">View Profile</h1>
                <button onClick={handleSave} className="flex items-center text-orange-500 font-medium underline">
                  <Check size={16} className="mr-1" />
                  Save
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto">
              {/* Profile Visibility */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Profile Visibility</h3>
                    <p className="text-sm text-gray-500">Your profile is currently visible to all employers</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">{profileVisible ? "ON" : "OFF"}</span>
                    <Switch 
                      checked={profileVisible}
                      onCheckedChange={setProfileVisible}
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
                    onClick={handlePreviewProfile}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm"
                  >
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
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm"
                  >
                    VIEW
                  </Button>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="mb-6">
                <h3 className="text-gray-600 mb-3">Profile Picture</h3>
                <div className="relative w-24 h-24">
                  <button 
                    onClick={handlePhotoClick}
                    className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500 hover:opacity-80 transition-opacity"
                  >
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        No Photo
                      </div>
                    )}
                  </button>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center pointer-events-none">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <Label htmlFor="givenName" className="text-gray-600 mb-2 block">First Name *</Label>
                  <Input
                    id="givenName"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                    required
                  />
                </div>

                {/* Middle Name */}
                <div>
                  <Label htmlFor="middleName" className="text-gray-600 mb-2 block">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="familyName" className="text-gray-600 mb-2 block">Last Name *</Label>
                  <Input
                    id="familyName"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-white"
                    required
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <Label htmlFor="email" className="text-gray-600 mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="h-12 rounded-xl border-gray-200 bg-gray-100 cursor-not-allowed"
                  />
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
