import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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

// ✅ Schema
const formSchema = z.object({
  businessTagline: z
    .string()
    .min(10, "Please enter at least 10 characters")
    .max(200, "Max 200 characters"),
  yearsInBusiness: z.string().min(1, "Required"),
  employeeCount: z.string().min(1, "Required"),
  industry: z.string().min(1, "Required"),
  payRange: z.string().min(1, "Select a pay range"),
  state: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

const industries = [
  "Plant & Animal Cultivation",
  "Health",
  "Aged & Disability Care",
  "Childcare",
  "Tourism & Hospitality",
  "Natural Disaster Recovery",
  "Fishing & Pearling",
  "Tree Farming & Felling",
  "Mining",
  "Construction",
];

const payRanges = [
  "$25–30/hour",
  "$30–35/hour",
  "$35–40/hour",
  "$40–45/hour",
  "$45+/hour",
];

const AUSTRALIAN_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
] as const;

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    console.log("Business info submitted:", data);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    // find industry_id
    const { data: industryRow } = await supabase
      .from("industry")
      .select("industry_id")
      .eq("name", data.industry)
      .maybeSingle();

    const industryId = industryRow?.industry_id ?? null;

    // ✅ save to employer table
    const { error } = await supabase.from("employer").upsert({
      user_id: user.id, // ✅ confirmed correct column
      tagline: data.businessTagline,
      business_tenure: data.yearsInBusiness,
      employee_count: data.employeeCount,
      industry_id: industryId,
      pay_range: data.payRange,
      state: data.state as (typeof AUSTRALIAN_STATES)[number], // ✅ cast for TS enum
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save business info",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Business setup complete!",
      description: "Your employer profile has been created successfully",
    });
    navigate("/employer/photo-upload");
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
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
                onClick={() => navigate("/business-registration")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <div className="flex items-center justify-between mt-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  About Your Business
                </h1>
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                  <span className="text-sm font-medium text-gray-600">4/5</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Tagline */}
                <div>
                  <Label>
                    Business Tagline <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Quality produce, sustainable farming"
                    {...register("businessTagline")}
                    className="h-14 bg-gray-100 rounded-xl"
                  />
                  {errors.businessTagline && (
                    <p className="text-red-500 text-sm">
                      {errors.businessTagline.message}
                    </p>
                  )}
                </div>

                {/* Years in Business */}
                <div>
                  <Label>
                    Years in Business <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="yearsInBusiness"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "<1",
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                            "6-10",
                            "11-15",
                            "16-20",
                            "20+",
                          ].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.yearsInBusiness && (
                    <p className="text-red-500 text-sm">
                      {errors.yearsInBusiness.message}
                    </p>
                  )}
                </div>

                {/* Employee Count */}
                <div>
                  <Label>
                    Employees <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="employeeCount"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
                          <SelectValue placeholder="Select employees" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "1",
                            "2-5",
                            "6-10",
                            "11-20",
                            "21-50",
                            "51-100",
                            "100+",
                          ].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.employeeCount && (
                    <p className="text-red-500 text-sm">
                      {errors.employeeCount.message}
                    </p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <Label>
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industry && (
                    <p className="text-red-500 text-sm">
                      {errors.industry.message}
                    </p>
                  )}
                </div>

                {/* Pay */}
                <div>
                  <Label>
                    Pay Range <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="payRange"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
                          <SelectValue placeholder="Select pay" />
                        </SelectTrigger>
                        <SelectContent>
                          {payRanges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.payRange && (
                    <p className="text-red-500 text-sm">
                      {errors.payRange.message}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <Label>
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
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
                    )}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm">{errors.state.message}</p>
                  )}
                </div>

                {/* Continue */}
                <div className="pt-8">
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg rounded-xl bg-slate-800 text-white"
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

export default EmployerAboutBusiness;
