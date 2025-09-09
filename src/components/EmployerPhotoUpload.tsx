import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmployerPhotoUpload: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleReUpload = () => {
    setPreviewUrl(null);
    setFile(null);
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: 'Photo required',
        description: 'Please upload a business photo to continue',
        variant: 'destructive',
      });
      return;
    }

    try {
      // ✅ Upload to Supabase Storage
      const fileName = `employer-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profile_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(fileName);

      // ✅ Save URL to employer table
      const { error: dbError } = await supabase
        .from('employer')
        .update({ profile_photo: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (dbError) throw dbError;

      toast({
        title: 'Profile completed!',
        description: 'Your business account has been created successfully',
      });
      navigate('/employer/account-confirmation');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleSkip = () => {
    navigate('/employer/account-confirmation');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          <div className="w-full h-full flex flex-col relative bg-white">
            
            {/* Header */}
            <div className="px-6 pt-16 pb-6">
              <div className="flex items-center justify-between mb-8">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
                  onClick={() => navigate('/employer/about-business')}
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
                <div className="flex-1"></div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Account Set Up</h1>
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-600">5/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload area (fixed to match WHV style) */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="w-full max-w-sm mb-8">
                {previewUrl ? (
                  <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Uploaded business photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-full h-64 bg-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">Tap to upload business photo</p>
                  </div>
                )}
              </div>

              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Re-upload */}
              {previewUrl && (
                <Button 
                  variant="outline"
                  onClick={handleReUpload}
                  className="w-full max-w-sm h-14 text-base rounded-xl border-gray-300 hover:bg-gray-50 mb-6"
                >
                  Re Upload
                </Button>
              )}
            </div>

            {/* Bottom buttons */}
            <div className="px-6 pb-8 space-y-4">
              <Button 
                onClick={handleSubmit}
                className="w-full h-14 text-lg rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
              >
                {previewUrl ? 'Complete your profile' : 'Continue'}
              </Button>
              
              {!previewUrl && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-gray-600 hover:text-gray-800 underline text-sm"
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerPhotoUpload;
