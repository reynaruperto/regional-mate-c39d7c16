import React, { useEffect, useState } from "react";
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
  businessTagline: z.string().min(10, "Please enter at least 10 characters").max(200, "Max 200 characters"),
  yearsInBusiness: z.string().min(1, "Required"),
  employeeCount: z.string().min(1, "Required"),
  industryId: z.string().min(1, "Required"),
  jobType: z.array(z.string()).min(1, "Select at least one job type"),
  payRange: z.string().min(1, "Select a pay range"),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
});

type FormData = z.infer<typeof formSchema>;

// ✅ Enums from Supabase
const yearsOptions = ["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"];
const employeeOptions = ["1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"];
const payRanges = ["$25–30/hour", "$30–35/hour", "$35–40/hour", "$40–45/hour", "$45+/hour"];

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<{ id: number; type: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);

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

  // ✅ Fetch industries, job types, and facilities
  useEffect(() => {
    const loadData = async () => {
      const { data: industryData } = await supabase.from("industry").select("industry_id, name");
      if (industryData) setIndustries(industryData.map(i => ({ id: i.industry_id, name: i.name })));

      const { data: jobTypeData } = await supabase.from("job_type").select("type_id, type");
      if (jobTypeData) setJobTypes(jobTypeData.map(j => ({ id: j.type_id, type: j.type })));

      const { data: facilityData } = await supabase.from("facility").select("facility_id, name");
      if (facilityData) setFacilities(facilityData.map(f => ({ id: f.facility_id, name: f.name })));
    };
    loadData();
  }, []);

  const watchedJobTypes = watch("jobType") || [];
  const watchedFacilities = watch("facilitiesAndExtras") || [];

  // ✅ Submit handler
  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Not logged in", variant: "destructive" });
        return;
      }

      const userId = user.id;

      // 1. Update employer table
      const { error: employerError } = await supabase.from("employer").update({
        tagline: data.businessTagline,
        business_tenure: data.yearsInBusiness,
        employee_count: data.employeeCount,
        industry_id: parseInt(data.industryId, 10),
        pay_range: data.payRange,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);

      if (employerError) throw employerError;

      // 2. Clear and re-insert job types
      await supabase.from("employer_job_type").delete().eq("user_id", userId);
      if (data.jobType.length > 0) {
        const jobTypeInserts = jobTypes
          .filter(j => data.jobType.includes(j.type))
          .map(j => ({ user_id: userId, type_id: j.id }));
        if (jobTypeInserts.length > 0) {
          const { error: jtError } = await supabase.from("employer_job_type").insert(jobTypeInserts);
          if (jtError) throw jtError;
        }
      }

      // 3. Clear and re-insert facilities
      await supabase.from("employer_facility").delete().eq("user_id", userId);
      if (data.facilitiesAndExtras.length > 0) {
        const facilityInserts = facilities
          .filter(f => data.facilitiesAndExtras.includes(f.name))
          .map(f => ({ user_id: userId, facility_id: f.id }));
        if (facilityInserts.length > 0) {
          const { error: fError } = await supabase.from("employer_facility").insert(facilityInserts);
          if (fError) throw fError;
        }
      }

      toast({ title: "Business info saved!", description: "Your business details have been updated." });
      navigate("/employer/photo-upload");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error saving business info", description: err.message, variant: "destructive" });
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
                  <Label>Business Tagline <span className="text-red-500">*</span></Label>
                  <Input placeholder="Quality produce, sustainable farming" {...register("businessTagline")} className="h-14 bg-gray-100 rounded-xl" />
                  {errors.businessTagline && <p className="text-red-500 text-sm">{errors.businessTagline.message}</p>}
                </div>

                {/* Years in Business */}
                <div>
                  <Label>Years in Business <span className="text-red-500">*</span></Label>
                  <Controller
                    name="yearsInBusiness"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select years" /></SelectTrigger>
                        <SelectContent>
                          {yearsOptions.map(opt => (
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
                  <Label>Employees <span className="text-red-500">*</span></Label>
                  <Controller
                    name="employeeCount"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select employees" /></SelectTrigger>
                        <SelectContent>
                          {employeeOptions.map(opt => (
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
                  <Label>Industry <span className="text-red-500">*</span></Label>
                  <Controller
                    name="industryId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-14 bg-gray-100 rounded-xl"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {industries.map(ind => (
                            <SelectItem key={ind.id} value={String(ind.id)}>{ind.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industryId && <p className="text-red-500 text-sm">{errors.industryId.message}</p>}
                </div>

                {/* Job Type */}
                <div>
                  <Label>Job Type <span className="text-red-500">*</span></Label>
                  {jobTypes.map(type => (
                    <label key={type.id} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={type.type}
                        checked={watchedJobTypes.includes(type.type)}
                        onChange={e => {
                          const current = watchedJobTypes;
                          if (e.target.checked) setValue("jobType", [...current, type.type]);
                          else setValue("jobType", current.filter(j => j !== type.type));
                        }}
                      />
                      <span>{type.type}</span>
                    </label>
                  ))}
                  {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType.message}</p>}
                </div>

                {/* Pay */}
                <div>
                  <Label>Pay Range <span className="text-red-500">*</span></Label>
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
                  <Label>Facilities & Extras <span className="text-red-500">*</span></Label>
                  {facilities.map(facility => (
                    <label key={facility.id} className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        value={facility.name}
                        checked={watchedFacilities.includes(facility.name)}
                        onChange={e => {
                          const current = watchedFacilities;
                          if (e.target.checked) setValue("facilitiesAndExtras", [...current, facility.name]);
                          else setValue("facilitiesAndExtras", current.filter(x => x !== facility.name));
                        }}
                      />
                      <span>{facility.name}</span>
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
