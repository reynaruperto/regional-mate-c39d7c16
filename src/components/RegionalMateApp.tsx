import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AustraliaIcon from './AustraliaIcon';
import SignInAsModal from './SignInAsModal';

const RegionalMateApp: React.FC = () => {
  const navigate = useNavigate();
  const [showSignInModal, setShowSignInModal] = useState(false);

  if (showSignInModal) {
    // ✅ Removed onClose prop
    return <SignInAsModal />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          {/* Main content container with background image */}
          <div className="w-full h-full flex flex-col relative">
            
            {/* Background image with full width and specific height */}
            <div className="absolute top-0 left-0 w-full h-[688px]">
              <img 
                src="/lovable-uploads/57d1a927-999d-413d-8ed8-46c50ac0edde.png" 
                alt="Regional Mate collage of people working and celebrating" 
                className="w-full h-full object-cover object-center"
              />
              {/* Gradient overlay - thicker toward bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/70 pointer-events-none" />
            </div>

            {/* Content positioned over background */}
            <div className="relative z-10 flex flex-col h-full justify-end">
              {/* Australia icon positioned higher */}
              <div className="px-6 pb-2">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-3xl shadow-lg">
                    <AustraliaIcon className="w-[108px] h-[108px]" />
                  </div>
                </div>
              </div>

              {/* Title and tagline */}
              <div className="px-6 pb-8 text-center">
                <h1 className="text-4xl font-bold text-brand-text mb-2">
                  Regional Mate
                </h1>
                <p className="text-lg text-brand-secondary-text whitespace-nowrap">
                  Connecting People. Creating Opportunities.
                </p>
              </div>

              {/* CTA Button */}
              <div className="px-6 pb-6">
                <Button 
                  size="lg" 
                  style={{ backgroundColor: "#EC5823", color: "white" }}
                  className="w-full h-14 text-lg rounded-xl"
                  onClick={() => navigate('/lets-begin')}
                >
                  ✨ Get started
                </Button>
              </div>

              {/* Sign in link */}
              <div className="px-6 pb-8 text-center">
                <p className="text-brand-secondary-text">
                  Already joined? 
                  <button 
                    onClick={() => navigate('/sign-in')}
                    className="text-brand-text font-medium ml-1 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              {/* Legal text */}
              <div className="px-6 pb-8 text-center text-sm text-brand-secondary-text">
                <p>
                  By tapping Get started, you agree with our{' '}
                  <span className="text-brand-text">Terms</span>.{' '}
                  See how we process data in our{' '}
                  <span className="text-brand-text">Privacy Policy</span>.
                </p>
              </div>

              {/* Bottom indicator */}
              <div className="px-6 pb-6 flex justify-center">
                <div className="w-32 h-1 bg-brand-text rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalMateApp;
