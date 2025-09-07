import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AustraliaIcon from "./AustraliaIcon";

const RoleSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next') || '';

  const handleRoleSelect = (role: 'whv' | 'employer') => {
    const redirectPath = `/${role}/sign-in`;
    const finalUrl = nextUrl ? `${redirectPath}?next=${encodeURIComponent(nextUrl)}` : redirectPath;
    navigate(finalUrl);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Main content container */}
          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header with back button */}
            <div className="flex items-center justify-between px-6 pt-16 pb-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-2xl shadow-sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <div className="flex-1"></div>
            </div>

            {/* Logo section */}
            <div className="px-6 pt-8 pb-12">
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-3xl shadow-lg">
                  <AustraliaIcon className="w-[108px] h-[108px]" />
                </div>
              </div>
            </div>

            {/* Title and subtitle */}
            <div className="px-6 pb-16 text-center">
              <h1 className="text-4xl font-bold text-brand-text mb-4">
                Sign in
              </h1>
              <p className="text-lg text-brand-secondary-text leading-relaxed">
                Choose your account type
              </p>
            </div>

            {/* Role selection buttons */}
            <div className="px-6 pb-8 space-y-4">
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => handleRoleSelect('employer')}
              >
                Employer
              </Button>

              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => handleRoleSelect('whv')}
              >
                Working Holiday Maker
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;