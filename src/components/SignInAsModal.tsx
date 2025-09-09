import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import AustraliaIcon from "./AustraliaIcon";
import { supabase } from "@/integrations/supabase/client";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setLoading(false);
        return;
      }

      // Get user_type from profile table (safer than relying on metadata)
      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("user_type")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (profileError) {
        setMessage({ type: "error", text: "Error fetching user profile." });
        setLoading(false);
        return;
      }

      if (profile?.user_type === "employer") {
        setMessage({ type: "success", text: "Welcome back, Employer!" });
        setTimeout(() => navigate("/employer/dashboard"), 800);
      } else if (profile?.user_type === "whv") {
        setMessage({ type: "success", text: "Welcome back, WHV Holder!" });
        setTimeout(() => navigate("/whv/dashboard"), 800);
      } else {
        setMessage({
          type: "error",
          text: "No user type found. Please contact support.",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Unexpected error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
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

            {/* Logo */}
            <div className="px-6 pt-8 pb-6 flex justify-center">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <AustraliaIcon className="w-[108px] h-[108px]" />
              </div>
            </div>

            {/* Title */}
            <div className="px-6 pb-6 text-center">
              <h1 className="text-2xl font-medium text-gray-600">Sign In</h1>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-6 pb-6 space-y-6"
            >
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-gray-100 border-0 text-gray-900"
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-gray-100 border-0 text-gray-900"
                  required
                />
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-orange-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Inline message */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
