import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  businessTagline: z.string().min(10, "Please enter at least 10 characters").max(200, "Max 200 characters"),
  yearsInBusiness: z.string().min(1, "Required"),
  employeeCount: z.string().min(1, "Required"),
  industry: z.string().min(1, "Required"),
  jobType: z.array(z.string()).min(1, "Select at least one job type"),
  payRange: z.string().min(1, "Select a pay range"),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
});

type FormData = z.infer<typeof formSchema>;

const payRanges = ["$25–30/hour", "$30–35/hour", "$35–40/hour", "$40–45/hour", "$45+/hour"];

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<{ id: number; type: string }[]>([]);

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

  const watchedFacilities = watch("facilitiesAndExtras") || [];
  const watchedJobTypes = watch("jobType") || [];

  // 🔹 Load industries, facilities, job types from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { data: industryData } = await supabase.from("industry").select("industry_id, name");
      if (industryData) setIndustries(industryData.map(i => ({ id: i.industry_id, name: i.name })));

      const { data: facilityData } = await supabase.from("facility").select("facility_id, name");
      if (facilityData) setFacilities(facilityData.map(f => ({ id: f.facility_id, name: f.name })));

      const { data: jobTypeData } = await supabase.from("job_type").select("type_id, type");
      if (jobTypeData) setJobTypes(jobTypeData.map(j => ({ id: j.type_id, type: j.type })));
    };

    loadData();
  }, []);

  // 🔹 Save to Supabase
  const onSubmit = async (data: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not logged in", description: "Please sign in first.", variant: "destructive" });
        return;
      }

      // Get profile
      const { data: profile } = await supabase.from("profile").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!profile) {
        toast({ title: "Error", description: "Profile not found.", variant: "destructive" });
        return;
      }

      // Find selected industry_id
      const industryId = industries.find(i => i.name === data.industry)?.id;

      // 1. Save employer info
      const { error: empError } = await supabase.from("employer").upsert({
        user_id: profile.user_id,
        tagline: data.businessTagline,
        business_tenure: data.yearsInBusiness,
        employee_count: data.employeeCount,
        industry_id: industryId,
        pay_range: data.payRange,
        updated_at: new Date().toISOString(),
      });
      if (empError) throw empError;

      // 2. Save facilities
      await supabase.from("employer_facility").delete().eq("user_id", profile.user_id);
      if (data.facilitiesAndExtras.length > 0) {
        const facilitiesInsert = data.facilitiesAndExtras.map(name => ({
          user_id: profile.user_id,
          facility_id: facilities.find(f => f.name === name)?.id,
        }));
        await supabase.from("employer_facility").insert(facilitiesInsert);
      }

      // 3. Save job types
      await supabase.from("employer_job_type").delete().eq("user_id", profile.user_id);
      if (data.jobType.length > 0) {
        const jobTypesInsert = data.jobType.map(type => ({
          user_id: profile.user_id,
          type_id: jobTypes.find(j => j.type === type)?.id,
        }));
        await supabase.from("employer_job_type").insert(jobTypesInsert);
      }

      toast({ title: "Business setup complete!", description: "Your employer profile has been updated." });
      navigate("/employer/photo-upload");
    } catch (err: any) {
      console.error("Error saving employer:", err);
      toast({
        title: "Error",
        description: err.message || "Unexpected error",
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
                <h1 className="text-2xl font-bold text-gray-900">About Your Business</h1>
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
                  <Input placeholder="Quality produce, sustainable farming" {...register("businessTagline")} className="h-14 bg-gray-100 rounded-xl" />
                  {errors.businessTagline && <p className="text-red-500 text-sm">{errors.businessTagline.message}</p>}
                </div>

                {/* Years in Business */}
                <div>
                  <Label>Years in Business *</Label>
                  <Controller
                    name="yearsInBusiness"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select years" /></SelectTrigger>
                        <SelectContent>
                          {["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"].map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.yearsInBusiness && <p className="text-red-500 text-sm">{errors.yearsInBusiness.message}</p>}
                </div>

                {/* Employee Count */}
                <div>
                  <Label>Employees *</Label>
                  <Controller
                    name="employeeCount"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select employees" /></SelectTrigger>
                        <SelectContent>
                          {["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"].map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.employeeCount && <p className="text-red-500 text-sm">{errors.employeeCount.message}</p>}
                </div>

                {/* Industry */}
                <div>
                  <Label>Industry *</Label>
                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {industries.map(ind => (
                            <SelectItem key={ind.id} value={ind.name}>{ind.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industry && <p className="text-red-500 text-sm">{errors.industry.message}</p>}
                </div>

                {/* Job Types */}
                <div>
                  <Label>Job Type *</Label>
                  {jobTypes.map(j => (
                    <label key={j.id} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={j.type}
                        checked={watchedJobTypes.includes(j.type)}
                        onChange={e => {
                          const current = watchedJobTypes;
                          if (e.target.checked) setValue("jobType", [...current, j.type]);
                          else setValue("jobType", current.filter(r => r !== j.type));
                        }}
                      />
                      <span>{j.type}</span>
                    </label>
                  ))}
                  {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType.message}</p>}
                </div>

                {/* Pay */}
                <div>
                  <Label>Pay Range *</Label>
                  <Controller
                    name="payRange"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select pay" /></SelectTrigger>
                        <SelectContent>
                          {payRanges.map(range => (
                            <SelectItem key={range} value={range}>{range}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.payRange && <p className="text-red-500 text-sm">{errors.payRange.message}</p>}
                </div>

                {/* Facilities */}
                <div>
                  <Label>Facilities & Extras *</Label>
                  {facilities.map(f => (
                    <label key={f.id} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={f.name}
                        checked={watchedFacilities.includes(f.name)}
                        onChange={e => {
                          const current = watchedFacilities;
                          if (e.target.checked) setValue("facilitiesAndExtras", [...current, f.name]);
                          else setValue("facilitiesAndExtras", current.filter(x => x !== f.name));
                        }}
                      />
                      <span>{f.name}</span>
                    </label>
                  ))}
                  {errors.facilitiesAndExtras && <p className="text-red-500 text-sm">{errors.facilitiesAndExtras.message}</p>}
                </div>

                {/* Continue */}
                <div className="pt-8">
                  <Button type="submit" className="w-full h-14 text-lg rounded-xl bg-slate-800 text-white">
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
