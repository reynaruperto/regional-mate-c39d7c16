import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WHVPhotoUpload: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ==========================
  // Prefill existing photo
  // ==========================
  useEffect(() => {
    const fetchPhoto = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("whv_maker")
        .select("profile_photo")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching existing photo:", error);
        return;
      }

      if (data?.profile_photo) {
        setSelectedImage(data.profile_photo); // preload saved photo
      }
    };

    fetchPhoto();
  }, []);

  // ==========================
  // File Handlers
  // ==========================
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleReUpload = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    fileInputRef.current?.click();
  };

  // ==========================
  // Submit (upload + save to DB)
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to upload your photo",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Please upload a photo",
        description: "A profile photo is required to complete setup",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Fetch current photo to delete old file if needed
      const { data: makerData } = await supabase
        .from("whv_maker")
        .select("profile_photo")
        .eq("user_id", user.id)
        .maybeSingle();

      if (makerData?.profile_photo) {
        const url = new URL(makerData.profile_photo);
        const pathParts = url.pathname.split("/");
        const bucketIndex = pathParts.indexOf("profile-photos");
        if (bucketIndex !== -1) {
          const relativePath = pathParts.slice(bucketIndex + 1).join("/");
          await supabase.storage.from("profile-photos").remove([relativePath]);
        }
      }

      // 2. Upload new file
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 4. Save to DB
      const { error: dbError } = await supabase
        .from("whv_maker")
        .update({ profile_photo: publicUrl })
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      setSelectedImage(publicUrl);

      toast({
        title: "Photo uploaded!",
        description: "Your profile photo has been saved",
      });

      navigate("/whv/account-confirmation");
    } catch (err: any) {
      console.error("Upload failed:", err.message);
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => navigate("/whv/account-confirmation");

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/work-experience")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">
                Account Set Up
              </h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">6/6</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="text-center mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload your photo
              </h2>
            </div>

            {/* Upload area */}
            <div className="w-full max-w-sm mb-8">
              {selectedImage ? (
                <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-full h-64 bg-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                  onClick={handleUploadClick}
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Tap to upload photo</p>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Re-upload button */}
            {selectedImage && (
              <Button
                variant="outline"
                onClick={handleReUpload}
                className="w-full max-w-sm h-14 text-base rounded-xl border-gray-300 hover:bg-gray-50 mb-6"
              >
                Re Upload
              </Button>
            )}
          </div>

          {/* Continue + Skip */}
          <div className="px-4 pb-8 space-y-3">
            <Button
              onClick={handleSubmit}
              className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              Continue →
            </Button>
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full h-12 text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVPhotoUpload;
