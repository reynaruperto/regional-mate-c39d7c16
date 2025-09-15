import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AustraliaIcon from "./AustraliaIcon";

const LetsBeginScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex justify-center items-center p-4"
      style={{ backgroundColor: "##EDEADE" }}
    >
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div
          className="w-full h-full rounded-[48px] overflow-hidden relative"
          style={{ backgroundColor: "#EDEADE" }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Main content container */}
          <div
            className="w-full h-full flex flex-col relative"
            style={{ backgroundColor: "#EDEADE" }}
          >
            {/* Header with back button */}
            <div className="flex items-center justify-between px-6 pt-16 pb-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-2xl shadow-sm"
                onClick={() => navigate("/")}
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
                Let's Begin!
              </h1>
              <p className="text-lg text-brand-secondary-text leading-relaxed">
                Connect for jobs and travel. Choose your role to get started.
              </p>
            </div>

            {/* Role selection buttons */}
            <div className="px-6 pb-8 space-y-4">
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => navigate("/employer/onboarding")}
              >
                I want to hire
              </Button>

              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate("/whv/onboarding")}
              >
                I want to get hired
              </Button>
            </div>

            {/* Sign in link */}
            <div className="px-6 pb-12 text-center">
              <p className="text-brand-secondary-text">
                Already have an account?
                <button
                  onClick={() => navigate("/sign-in")}
                  className="text-brand-text font-medium ml-1 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetsBeginScreen;
