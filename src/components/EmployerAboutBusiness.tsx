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

// ✅ Enum options matching Supabase
const yearsOptions = [
  "<1", "1", "2", "3", "4", "5",
  "6-10", "11-15", "16-20", "20+"
] as const;

const employeeOptions = [
  "1", "2-5", "6-10", "11-20",
  "21-50", "51-100", "100+"
] as const;

const payRanges = [
  "$25-30/hour",
  "$30-35/hour",
  "$35-40/hour",
  "$40-45/hour",
  "$45+/hour"
] as const;

// ✅ Schema
const formSchema = z.object({
  businessTagline: z.string()
    .min(10, "Please enter at least 10 characters")
    .max(200, "Max 200 characters"),
  yearsInBusiness: z.enum(yearsOptions),
  employeeCount: z.enum(employeeOptions),
  industryId: z.string().min(1, "Required"),
  jobType: z.array(z.string()).min(1, "Select at least one job type"),
  payRange: z.enum(payRanges),
  facilitiesAndExtras: z.array(z.string()).min(1, "Select at least one facility"),
});

type FormData = z.infer<typeof formSchema>;

interface Industry {
  id: number;
  name: string;
}

interface JobType {
  id: number;
  type: string;
}

interface Facility {
  id: number;
  name: string;
}

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

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

  const watchedJobTypes = watch("jobType") || [];
  const watchedFacilities = watch("facilitiesAndExtras") || [];

  // ✅ Load industries, job types, and facilities from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { data: industryData } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (industryData) {
        setIndustries(industryData.map((i) => ({ id: i.industry_id, name: i.name })));
      }

      const { data: jobTypeData } = await supabase
        .from("job_type")
        .select("type_id, type");
      if (jobTypeData) {
        setJobTypes(jobTypeData.map((j) => ({ id: j.type_id, type: j.type })));
      }

      const { data: facilityData } = await supabase
        .from("facility")
        .select("facility_id, name");
      if (facilityData) {
        setFacilities(facilityData.map((f) => ({ id: f.facility_id, name: f.name })));
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: FormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Not logged in", variant: "destructive" });
      return;
    }

    const userId = user.id;

    try {
      // ✅ Update employer table
      const { error: employerError } = await supabase
        .from("employer")
        .update({
          tagline: data.businessTagline,
          business_tenure: data.yearsInBusiness,
          employee_count: data.employeeCount,
          industry_id: parseInt(data.industryId),
          pay_range: data.payRange,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (employerError) throw employerError;

      // ✅ Save job types
      if (jobTypes.length > 0) {
        const jobTypeRows = data.jobType
          .map((typeName) => {
            const match = jobTypes.find((jt) => jt.type === typeName);
            return match ? { user_id: userId, type_id: match.id } : null;
          })
          .filter(Boolean);

        if (jobTypeRows.length > 0) {
          await supabase.from("employer_job_type").delete().eq("user_id", userId);
          const { error: jtError } = await supabase.from("employer_job_type").insert(jobTypeRows as any[]);
          if (jtError) throw jtError;
        }
      }

      // ✅ Save facilities
      if (facilities.length > 0) {
        const facilityRows = data.facilitiesAndExtras
          .map((facName) => {
            const match = facilities.find((f) => f.name === facName);
            return match ? { user_id: userId, facility_id: match.id } : null;
          })
          .filter(Boolean);

        if (facilityRows.length > 0) {
          await supabase.from("employer_facility").delete().eq("user_id", userId);
          const { error: facError } = await supabase.from("employer_facility").insert(facilityRows as any[]);
          if (facError) throw facError;
        }
      }

      toast({ title: "Success", description: "Business details saved!" });
      navigate("/employer/photo-upload");
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Could not save business details",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
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
                <Input
                  placeholder="Quality produce, sustainable farming"
                  {...register("businessTagline")}
                  className="h-14 bg-gray-100 rounded-xl"
                />
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
                {errors.employeeCount && <p className="text-red-500 text-sm">{errors.employeeCount.message}</p>}
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
                          <SelectItem key={ind.id} value={ind.id.toString()}>
                            {ind.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.industryId && <p className="text-red-500 text-sm">{errors.industryId.message}</p>}
              </div>

              {/* Job Types */}
              <div>
                <Label>Job Type *</Label>
                {jobTypes.map((jt) => (
                  <label key={jt.id} className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      value={jt.type}
                      checked={watchedJobTypes.includes(jt.type)}
                      onChange={(e) => {
                        const current = watchedJobTypes;
                        if (e.target.checked) setValue("jobType", [...current, jt.type]);
                        else setValue("jobType", current.filter((a) => a !== jt.type));
                      }}
                    />
                    <span>{jt.type}</span>
                  </label>
                ))}
                {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType.message}</p>}
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
                {errors.payRange && <p className="text-red-500 text-sm">{errors.payRange.message}</p>}
              </div>

              {/* Facilities */}
              <div>
                <Label>Facilities & Extras *</Label>
                {facilities.map((fac) => (
                  <label key={fac.id} className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      value={fac.name}
                      checked={watchedFacilities.includes(fac.name)}
                      onChange={(e) => {
                        const current = watchedFacilities;
                        if (e.target.checked) setValue("facilitiesAndExtras", [...current, fac.name]);
                        else setValue("facilitiesAndExtras", current.filter((x) => x !== fac.name));
                      }}
                    />
                    <span>{fac.name}</span>
                  </label>
                ))}
                {errors.facilitiesAndExtras && (
                  <p className="text-red-500 text-sm">{errors.facilitiesAndExtras.message}</p>
                )}
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
  );
};

export default EmployerAboutBusiness;
