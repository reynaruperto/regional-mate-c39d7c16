import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const WHVAccountConfirmation: React.FC = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    // ✅ Redirect to shared login, not WHV-only login
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Main content container with background */}
          <div
            className="w-full h-full flex flex-col relative"
            style={{
              backgroundImage: `url(/lovable-uploads/21ecf2a5-2e71-47ed-b042-d7c41af18dd0.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    You have created your Regional Mate Account Successfully
                  </h2>

                  <p className="text-gray-500 text-sm">
                    Start looking for employers and your Working Holiday Visa journey
                  </p>
                </div>

                {/* Sign In Button */}
                <Button
                  onClick={handleContinue}
                  className="w-full h-12 text-base rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVAccountConfirmation;
