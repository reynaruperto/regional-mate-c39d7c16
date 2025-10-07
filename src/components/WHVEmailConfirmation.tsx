import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WHVEmailConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 👈 new

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem("pendingEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      navigate("/whv/onboarding");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // clear previous error

    if (confirmationCode.length !== 6) {
      setErrorMessage("Please enter the 6-digit confirmation code.");
      return;
    }

    setIsVerifying(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: confirmationCode,
        type: "signup",
      });

      if (error) {
        if (error.message.includes("expired") || error.message.includes("invalid")) {
          setErrorMessage("The code has expired or is invalid. Please request a new one.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      sessionStorage.removeItem("pendingEmail");

      toast({
        title: "Email confirmed!",
        description: "Your account has been verified successfully",
      });

      navigate("/whv/profile-setup");
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/whv/profile-setup`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        toast({
          title: "Code resent",
          description: "Check your email for a new confirmation code",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0"></div>

          <div className="px-4 py-3 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/onboarding")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Confirm Your Email</h1>
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-600">2/6</span>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-6 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-8">
              <Mail className="w-12 h-12 text-orange-500" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Check your email</h2>
              <p className="text-gray-600 leading-relaxed max-w-sm">
                We've sent a 6-digit confirmation code to your email address. Enter it below to verify your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
              <div>
                <Label htmlFor="confirmationCode" className="text-base font-medium text-gray-700 mb-2 block">
                  Confirmation Code
                </Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ""))}
                  className="h-12 text-base bg-gray-100 border-0 rounded-xl text-center text-2xl tracking-widest text-gray-900"
                />
                {errorMessage && <p className="text-red-500 text-sm mt-2 text-center">{errorMessage}</p>}
              </div>

              <Button
                type="submit"
                disabled={isVerifying}
                className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-orange-500 hover:text-orange-600 underline text-sm disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEmailConfirmation;
