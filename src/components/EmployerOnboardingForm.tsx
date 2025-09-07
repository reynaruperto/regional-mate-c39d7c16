import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/(?=.*[0-9])/, { message: "Password must contain at least one number." })
    .regex(/(?=.*[!@#$%^&*])/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const EmployerOnboardingForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateEmailError, setDuplicateEmailError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setError } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setDuplicateEmailError(null);
    
    try {
      const trimmedEmail = data.email.trim().toLowerCase();
      
      const { error, data: signUpData } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/employer/about-business`,
          data: { user_type: 'employer' }
        }
      });

      // Check if user already exists (identities will be empty for existing confirmed users)
      if (signUpData?.user?.identities?.length === 0) {
        setDuplicateEmailError("An account with this email already exists. Please sign in instead.");
        return;
      }

      if (error) {
        console.error("Signup error details:", error);
        throw error;
      }

      sessionStorage.setItem('pendingEmail', trimmedEmail);

      toast({
        title: "Account created successfully!",
        description: "Please check your email for a confirmation code",
      });

      navigate('/employer/email-confirmation');
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-white">
            {/* Header */}
            <div className="px-6 pt-16 pb-6">
              <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" size="icon" className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
                  onClick={() => navigate('/lets-begin')}>
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
              </div>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Account Set Up</h1>
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-600">1/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your login</h2>
              <p className="text-gray-600 mb-6">Start by setting up your account with email and password.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" {...register("email")}
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl" />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                  {duplicateEmailError && (
                    <div className="mt-2">
                      <p className="text-red-500 text-sm">{duplicateEmailError}</p>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm text-orange-600 hover:text-orange-700"
                        onClick={() => navigate('/employer/sign-in')}
                      >
                        Sign in instead
                      </Button>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} {...register("password")}
                      className="h-14 text-base bg-gray-100 border-0 rounded-xl pr-12" />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      className="h-14 text-base bg-gray-100 border-0 rounded-xl pr-12" />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
                  {password && confirmPassword && password !== confirmPassword && !errors.confirmPassword && (
                    <p className="text-red-500 text-sm">Passwords don't match</p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-8">
                  <Button type="submit" disabled={isLoading}
                    className="w-full h-14 text-lg rounded-xl bg-[#1E293B] text-white hover:opacity-90 disabled:opacity-50">
                    {isLoading ? 'Creating account...' : 'Continue'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerOnboardingForm;


