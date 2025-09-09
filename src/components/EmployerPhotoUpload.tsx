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
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `employer-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // ✅ Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile_photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // ✅ Get public URL
      const { data } = supabase.storage.from("profile_photos").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // ✅ Save into employer table
      const { error: dbError } = await supabase
        .from("employer")
        .update({ profile_photo: publicUrl })
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      setUploadedPhoto(publicUrl);

      toast({
        title: "Photo uploaded!",
        description: "Your business photo has been saved.",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReUpload = () => {
    setUploadedPhoto(null);
    fileInputRef.current?.click();
  };

  const handleComplete = () => {
    if (!uploadedPhoto) {
      toast({
        title: "Photo required",
        description: "Please upload a photo before continuing",
        variant: "destructive",
      });
      return;
    }
    navigate("/employer/account-confirmation");
  };

  const handleSkip = () => {
    navigate("/employer/account-confirmation");
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
                  onClick={() => navigate("/employer/about-business")}
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

            {/* Upload area */}
            <div className="flex-1 px-6 flex flex-col justify-center">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload your photo</h2>
              </div>

              <div className="flex justify-center mb-8">
                <div className="relative w-64 h-64">
                  {uploadedPhoto ? (
                    <img
                      src={uploadedPhoto}
                      alt="Uploaded"
                      className="w-full h-full object-cover rounded-2xl border"
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Tap to upload business photo</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {uploadedPhoto && (
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
                disabled={loading}
                className="w-full h-14 text-lg rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
              >
                {loading ? "Saving..." : uploadedPhoto ? "Complete your profile" : "Continue"}
              </Button>

              {!uploadedPhoto && (
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



