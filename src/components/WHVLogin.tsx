import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AustraliaIcon from './AustraliaIcon';
import { supabase } from '@/integrations/supabase/client' ;

const WHVLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check user type from profile
        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('user_type')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          toast({
            title: "Profile Error",
            description: "Could not verify user profile. Please contact support.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }

        // Verify this is a WHV maker account
        if (profileData?.user_type !== 'whv_maker') {
          toast({
            title: "Invalid Account Type",
            description: "This login is for WHV makers only. Please use the employer login.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          navigate('/employer/sign-in');
          return;
        }

        // Successful login
        toast({
          title: "Welcome back!",
          description: `Successfully signed in to Regional Mate${whvData?.given_name ? ', ' + whvData.given_name : ''}`,
        });
        
        navigate('/whv/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        toast({
          title: "Invalid Credentials",
          description: "The email or password you entered is incorrect.",
          variant: "destructive"
        });
      } else if (error.message?.includes('Email not confirmed')) {
        toast({
          title: "Email Not Verified",
          description: "Please check your email and verify your account before signing in.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sign In Failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
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
                     Sign in as a Working Holiday Maker
                   </h1>
                   <p className="text-gray-600">
                     Welcome back! Enter your details
                   </p>
                 </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-14 rounded-2xl border-gray-200 bg-gray-50 placeholder:text-gray-400 text-base"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="h-14 rounded-2xl border-gray-200 bg-gray-50 placeholder:text-gray-400 text-base pr-12"
                      placeholder="••••••••••••••••"
                      required
                      disabled={isLoading}
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
                       className="w-full h-14 text-base rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2"
                       disabled={isLoading}
                     >
                       Sign in as WHV
                       <span className="px-2 py-1 text-xs bg-orange-600 rounded">WHV</span>
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
                      className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
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

export default WHVLogin;