import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ✅ Form validation schema
const formSchema = z.object({
  givenName: z
    .string()
    .min(2, { message: "Given name must be at least 2 characters." })
    .regex(/^[a-zA-Z\s]*$/, { message: "Given name can only contain letters." }),
  middleName: z
    .string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z\s]*$/.test(val), {
      message: "Middle name can only contain letters.",
    }),
  familyName: z
    .string()
    .min(2, { message: "Family name must be at least 2 characters." })
    .regex(/^[a-zA-Z\s]*$/, { message: "Family name can only contain letters." }),
  abn: z
    .string()
    .min(11, { message: "ABN must be 11 digits." })
    .max(11, { message: "ABN must be 11 digits." })
    .regex(/^\d+$/, { message: "ABN must contain only numbers." }),
  companyName: z.string().min(2, { message: "Company name is required." }),
  website: z
    .string()
    .url({ message: "Please enter a valid website URL." })
    .optional()
    .or(z.literal("")),
  businessPhone: z
    .string()
    .min(10, { message: "Please enter a valid phone number." })
    .regex(/^[\d\s\+\-\(\)]+$/, {
      message: "Please enter a valid phone number.",
    }),
  addressLine1: z.string().min(2, { message: "Address line 1 is required." }),
  addressLine2: z.string().optional(),
  suburbCity: z.string().min(2, { message: "Suburb / City is required." }),
  state: z.string().min(1, { message: "Please select a state." }),
  postCode: z
    .string()
    .min(4, { message: "Please enter a valid post code." })
    .max(4, { message: "Post code must be 4 digits." })
    .regex(/^\d+$/, { message: "Post code must contain only numbers." }),
});

type FormData = z.infer<typeof formSchema>;

const AUSTRALIAN_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

const BusinessRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // ✅ Save to Supabase
  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not logged in",
          description: "Please log in first.",
          variant: "destructive",
        });
        return;
      }

      // Get profile row
      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "Profile not found.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("employer").upsert({
        user_id: profile.user_id, // ✅ safely from profile
        given_name: data.givenName,
        middle_name: data.middleName || null,
        family_name: data.familyName,
        abn: data.abn,
        company_name: data.companyName,
        website:
          data.website && data.website.trim() !== "" ? data.website : null,
        mobile_num: data.businessPhone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        suburb_city: data.suburbCity,
        state: data.state, // ✅ matches enum via dropdown
        postcode: data.postCode,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Supabase error:", error);
        toast({
          title: "Error saving business details",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Business details saved!",
        description: "Let's continue with information about your business",
      });

      navigate("/employer/about-business");
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Main content */}
          <div className="w-full h-full flex flex-col relative bg-white">
            {/* Header */}
            <div className="px-6 pt-16 pb-6">
              <div className="flex items-center justify-between mb-8">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
                  onClick={() => navigate("/employer/email-confirmation")}
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Button>
                <div className="flex-1"></div>
              </div>

              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Business Registration
                  </h1>
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-600">
                      3/5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Register your business
                </h2>
                <p className="text-gray-600">
                  We need your personal details and business information.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Given Name */}
                <div>
                  <Label htmlFor="givenName">
                    Given Name(s) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="givenName"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("givenName")}
                  />
                  {errors.givenName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.givenName.message}
                    </p>
                  )}
                </div>

                {/* Middle Name */}
                <div>
                  <Label htmlFor="middleName">Middle Name(s)</Label>
                  <Input
                    id="middleName"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("middleName")}
                  />
                  {errors.middleName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.middleName.message}
                    </p>
                  )}
                </div>

                {/* Family Name */}
                <div>
                  <Label htmlFor="familyName">
                    Family Name(s) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="familyName"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("familyName")}
                  />
                  {errors.familyName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.familyName.message}
                    </p>
                  )}
                </div>

                {/* ABN */}
                <div>
                  <Label htmlFor="abn">
                    Australian Business Number (ABN){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="abn"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("abn")}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                      register("abn").onChange(e);
                    }}
                  />
                  {errors.abn && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.abn.message}
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website">Business Website</Label>
                  <Input
                    id="website"
                    type="url"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("website")}
                  />
                  {errors.website && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.website.message}
                    </p>
                  )}
                </div>

                {/* Business Phone */}
                <div>
                  <Label htmlFor="businessPhone">
                    Business Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("businessPhone")}
                  />
                  {errors.businessPhone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.businessPhone.message}
                    </p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <Label htmlFor="addressLine1">
                    Business Address Line 1{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="addressLine1"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("addressLine1")}
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("addressLine2")}
                  />
                </div>

                {/* Suburb / City */}
                <div>
                  <Label htmlFor="suburbCity">
                    Suburb / City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="suburbCity"
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("suburbCity")}
                  />
                  {errors.suburbCity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.suburbCity.message}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("state", value)}>
                    <SelectTrigger className="h-14 text-base bg-gray-100 border-0 rounded-xl">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUSTRALIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                {/* Post Code */}
                <div>
                  <Label htmlFor="postCode">
                    Post Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postCode"
                    maxLength={4}
                    className="h-14 text-base bg-gray-100 border-0 rounded-xl"
                    {...register("postCode")}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                      register("postCode").onChange(e);
                    }}
                  />
                  {errors.postCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.postCode.message}
                    </p>
                  )}
                </div>

                {/* Continue */}
                <div className="pt-8">
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg rounded-xl bg-[#1E293B] hover:opacity-90 text-white"
                  >
                    Continue
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

export default BusinessRegistrationForm;


