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
  jobType: z.array(z.string()).min(1, "Select at least one job type"),
  payRange: z.string().min(1, "Select a pay range"),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
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

const jobTypes = ["Full-time", "Part-time", "Casual", "Seasonal", "Contract"];
const payRanges = [
  "$25–30/hour",
  "$30–35/hour",
  "$35–40/hour",
  "$40–45/hour",
  "$45+/hour",
];
const facilitiesExtras = [
  "Accommodation provided",
  "Meals included",
  "Transport provided",
  "Training provided",
  "Equipment provided",
  "Flexible hours",
  "Career progression",
  "Team environment",
  "Other",
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
];

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [industriesData, setIndustriesData] = useState<any[]>([]);
  const [facilitiesData, setFacilitiesData] = useState<any[]>([]);
  const [jobTypesData, setJobTypesData] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobType: [],
      facilitiesAndExtras: [],
    },
  });

  useEffect(() => {
    const loadOptions = async () => {
      const { data: ind } = await supabase.from("industry").select("industry_id, name");
      if (ind) setIndustriesData(ind);

      const { data: fac } = await supabase.from("facility").select("facility_id, name");
      if (fac) setFacilitiesData(fac);

      const { data: jt } = await supabase.from("job_type").select("type_id, type");
      if (jt) setJobTypesData(jt);
    };
    loadOptions();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const { data: profile } = await supabase
        .from("profile")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) throw new Error("Profile not found");

      const industry = industriesData.find((i) => i.name === data.industry);

      // ✅ Save employer details
      await supabase.from("employer").upsert({
        user_id: profile.user_id,
        tagline: data.businessTagline,
        business_tenure: data.yearsInBusiness,
        employee_count: data.employeeCount,
        industry_id: industry?.industry_id,
        pay_range: data.payRange,
        state: data.state as (typeof AUSTRALIAN_STATES)[number],
        updated_at: new Date().toISOString(),
      } as any); // 👈 bypass type mismatch

      // ✅ Save facilities
      const selectedFacilities = facilitiesData.filter((f) =>
        data.facilitiesAndExtras.includes(f.name)
      );
      for (const fac of selectedFacilities) {
        await supabase.from("employer_facility").upsert({
          user_id: profile.user_id,
          facility_id: fac.facility_id,
        } as any);
      }

      // ✅ Save job types
      const selectedJobTypes = jobTypesData.filter((jt) =>
        data.jobType.includes(jt.type)
      );
      for (const jt of selectedJobTypes) {
        await supabase.from("employer_job_type").upsert({
          user_id: profile.user_id,
          type_id: jt.type_id,
        } as any);
      }

      toast({
        title: "Business info saved!",
        description: "Your employer profile has been updated successfully.",
      });
      navigate("/employer/photo-upload");
    } catch (error: any) {
      console.error("Error saving business info:", error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          <div className="w-full h-full flex flex-col relative bg-white">
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
                <h1 className="text-2xl font-bold text-gray-900">About Your Business</h1>
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                  <span className="text-sm font-medium text-gray-600">4/5</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Business Tagline */}
                <div>
                  <Label>Business Tagline *</Label>
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
                  <Label>Years in Business *</Label>
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
                </div>

                {/* Employee Count */}
                <div>
                  <Label>Employees *</Label>
                  <Controller
                    name="employeeCount"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
                          <SelectValue placeholder="Select employees" />
                        </SelectTrigger>
                        <SelectContent>
                          {["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"].map(
                            (opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Industry */}
                <div>
                  <Label>Industry *</Label>
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
                </div>

                {/* Job Types */}
                <div>
                  <Label>Job Types *</Label>
                  {jobTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={type}
                        checked={watch("jobType")?.includes(type)}
                        onChange={(e) => {
                          const current = watch("jobType") || [];
                          if (e.target.checked)
                            setValue("jobType", [...current, type]);
                          else
                            setValue(
                              "jobType",
                              current.filter((a) => a !== type)
                            );
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>

                {/* Pay Range */}
                <div>
                  <Label>Pay Range *</Label>
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
                </div>

                {/* Facilities */}
                <div>
                  <Label>Facilities & Extras *</Label>
                  {facilitiesExtras.map((facility) => (
                    <label
                      key={facility}
                      className="flex items-center space-x-2 mt-2"
                    >
                      <input
                        type="checkbox"
                        value={facility}
                        checked={watch("facilitiesAndExtras")?.includes(facility)}
                        onChange={(e) => {
                          const current = watch("facilitiesAndExtras") || [];
                          if (e.target.checked)
                            setValue("facilitiesAndExtras", [...current, facility]);
                          else
                            setValue(
                              "facilitiesAndExtras",
                              current.filter((x) => x !== facility)
                            );
                        }}
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
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
