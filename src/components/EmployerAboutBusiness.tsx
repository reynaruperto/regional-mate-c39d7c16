import React from "react";
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

// ✅ Schema validation
const formSchema = z.object({
  businessTagline: z.string().min(10).max(200),
  yearsInBusiness: z.string().min(1),
  employeeCount: z.string().min(1),
  industryId: z.string().min(1),
  jobTypes: z.array(z.string()).min(1),
  payRange: z.string().min(1),
  facilities: z.array(z.string()).min(1),
});

type FormData = z.infer<typeof formSchema>;

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
      jobTypes: [],
      facilities: [],
    },
  });

  const watchedJobTypes = watch("jobTypes") || [];
  const watchedFacilities = watch("facilities") || [];

  // ✅ Dropdown enums from Supabase
  const yearsOptions = [
    "<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"
  ];
  const employeeOptions = [
    "1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"
  ];
  const payRanges = [
    "$25–30/hour", "$30–35/hour", "$35–40/hour", "$40–45/hour", "$45+/hour"
  ];

  // ✅ Replace with live query to `industry` table
  const industries = [
    { id: 1, name: "Plant & Animal Cultivation" },
    { id: 2, name: "Natural Disaster Recovery" },
    { id: 3, name: "Agriculture" },
    { id: 4, name: "Health" },
    { id: 5, name: "Aged & Disability Care" },
    { id: 6, name: "Childcare" },
    { id: 7, name: "Tourism & Hospitality" },
    { id: 8, name: "Fishing & Pearling" },
    { id: 9, name: "Tree Farming & Felling" },
    { id: 10, name: "Construction" },
    { id: 11, name: "Mining" },
    { id: 12, name: "Bushfire Recovery" },
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

  const jobTypes = ["Full-time", "Part-time", "Casual", "Seasonal", "Contract"];

  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // ✅ 1. Save employer core info
      const { error: employerError } = await supabase.from("employer").upsert({
        user_id: user.id,
        tagline: data.businessTagline,
        business_tenure: data.yearsInBusiness as any,
        employee_count: data.employeeCount as any,
        industry_id: parseInt(data.industryId, 10),
        pay_range: data.payRange as any,
        updated_at: new Date().toISOString(),
      });
      if (employerError) throw employerError;

      // ✅ 2. Save job types
      await supabase.from("employer_job_type").delete().eq("user_id", user.id);
      if (data.jobTypes?.length) {
        const jobTypeRows = data.jobTypes.map((jt) => ({
          user_id: user.id,
          job_type: jt,
        }));
        const { error: jtError } = await supabase
          .from("employer_job_type")
          .insert(jobTypeRows);
        if (jtError) throw jtError;
      }

      // ✅ 3. Save facilities
      await supabase.from("employer_facility").delete().eq("user_id", user.id);
      if (data.facilities?.length) {
        const facilityRows = data.facilities.map((f) => ({
          user_id: user.id,
          facility: f,
        }));
        const { error: fError } = await supabase
          .from("employer_facility")
          .insert(facilityRows);
        if (fError) throw fError;
      }

      toast({
        title: "Business info saved!",
        description: "Your employer profile has been updated",
      });
      navigate("/employer/photo-upload");
    } catch (err: any) {
      console.error("Save failed:", err.message || err);
      toast({
        title: "Error",
        description: "Could not save business info",
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
                          {yearsOptions.map((opt) => (
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
                          {employeeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Industry */}
                <div>
                  <Label>Industry *</Label>
                  <Controller
                    name="industryId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem
                              key={ind.id}
                              value={ind.id.toString()}
                            >
                              {ind.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Job Type */}
                <div>
                  <Label>Job Type *</Label>
                  {jobTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={type}
                        checked={watchedJobTypes.includes(type)}
                        onChange={(e) => {
                          const current = watchedJobTypes;
                          if (e.target.checked)
                            setValue("jobTypes", [...current, type]);
                          else
                            setValue(
                              "jobTypes",
                              current.filter((a) => a !== type)
                            );
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>

                {/* Pay */}
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
                    <label key={facility} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={facility}
                        checked={watchedFacilities.includes(facility)}
                        onChange={(e) => {
                          const current = watchedFacilities;
                          if (e.target.checked)
                            setValue("facilities", [...current, facility]);
                          else
                            setValue(
                              "facilities",
                              current.filter((f) => f !== facility)
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
