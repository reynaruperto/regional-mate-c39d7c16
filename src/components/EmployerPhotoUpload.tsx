import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmployerPhotoUpload: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleReUpload = () => {
    setFile(null);
    setPreviewUrl(null);
    fileInputRef.current?.click();
  };

  const handleComplete = async () => {
    if (!file) {
      toast({
        title: "Photo required",
        description: "Please upload a business photo to continue",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const fileExt = file.name.split(".").pop();
      const filePath = `employer-${user.id}-${Date.now()}.${fileExt}`;

      // ✅ Upload to bucket
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // ✅ Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const photoUrl = publicUrlData.publicUrl;

      // ✅ Save URL in employer table
      const { error: updateError } = await supabase
        .from("employer")
        .update({ profile_photo_url: photoUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile completed!",
        description: "Your business account has been created successfully",
      });

      navigate("/employer/account-confirmation");
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigate("/employer/account-confirmation");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
              onClick={() => navigate("/employer/about-business")}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <div className="flex items-center justify-between mt-6">
              <h1 className="text-2xl font-bold text-gray-900">Account Set Up</h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">5/5</span>
              </div>
            </div>
          </div>

          {/* Upload area */}
          <div className="flex-1 px-6 flex flex-col justify-center">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload your photo</h2>
            </div>

            <div className="flex justify-center mb-8">
              <div className="relative">
                {previewUrl ? (
                  <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={previewUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-48 h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm text-center">
                      Tap to upload<br />business photo
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {previewUrl && (
              <div className="flex justify-center mb-8">
                <Button
                  variant="outline"
                  onClick={handleReUpload}
                  className="h-12 px-8 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Re Upload
                </Button>
              </div>
            )}
          </div>

          {/* Bottom buttons */}
          <div className="px-6 pb-8 space-y-4">
            <Button
              onClick={handleComplete}
              disabled={uploading}
              className="w-full h-14 text-lg rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              {uploading ? "Uploading..." : previewUrl ? "Complete your profile" : "Continue"}
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
  );
};

export default EmployerPhotoUpload;



