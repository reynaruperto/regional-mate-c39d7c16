import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AustraliaIcon from './AustraliaIcon';
import { useToast } from '@/hooks/use-toast';

const EmployerSignInForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically validate credentials
    toast({
      title: "Success",
      description: "Signed in successfully",
    });
    
    // Navigate to dashboard
    navigate('/employer/dashboard');
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const handleGetStarted = () => {
    navigate('/lets-begin');
  };

   const handleBack = () => {
     navigate('/sign-in');
   };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          {/* Main content container */}
          <div className="w-full h-full flex flex-col relative">
            
            {/* Header with back button */}
            <div className="flex items-center justify-between px-6 pt-16 pb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-12 h-12 bg-white rounded-2xl shadow-sm"
                onClick={handleBack}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <div className="flex-1"></div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6 pt-4">
              <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-lg">
                
                 {/* Logo */}
                 <div className="flex justify-center mb-8">
                   <div className="bg-white p-6 rounded-3xl shadow-lg">
                     <AustraliaIcon className="w-[108px] h-[108px]" />
                   </div>
                 </div>

                 {/* Title */}
                 <div className="text-center mb-8">
                   <h1 className="text-2xl font-bold text-gray-900 mb-2">
                     Sign in as an Employer
                   </h1>
                   <p className="text-gray-600">
                     Welcome back! Enter your details
                   </p>
                 </div>

                {/* Login Form */}
                <form onSubmit={handleSignIn} className="space-y-6">
                  {/* Email */}
                  <div>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-gray-50 placeholder:text-gray-400 text-base"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-gray-50 placeholder:text-gray-400 text-base pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                   {/* Sign In Button */}
                   <div className="pt-2">
                     <Button 
                       type="submit"
                       className="w-full h-14 text-base rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-medium flex items-center justify-center gap-2"
                       disabled={!email || !password}
                     >
                       Sign in as Employer
                       <span className="px-2 py-1 text-xs bg-slate-700 rounded">EMP</span>
                     </Button>
                   </div>
                </form>

                {/* Forgot Password */}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-base text-blue-500 hover:text-blue-700 underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Get Started Link */}
                <div className="mt-12 text-center">
                  <span className="text-gray-600 text-base">Don't have an account? </span>
                  <button
                    onClick={handleGetStarted}
                    className="text-base font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPasswordModal && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-6">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Password Reset Email Sent
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Please check your email for password reset instructions
                    </p>
                    <Button 
                      onClick={() => setShowForgotPasswordModal(false)}
                      className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerSignInForm;