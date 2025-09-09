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

const formSchema = z.object({
  businessTagline: z.string().min(10, "At least 10 characters").max(200),
  yearsInBusiness: z.string().min(1, "Required"),
  employeeCount: z.string().min(1, "Required"),
  industryId: z.string().min(1, "Required"),
  payRange: z.string().min(1, "Required"),
  jobTypes: z.array(z.string()).min(1, "Select at least one"),
  facilities: z.array(z.string()).min(1, "Select at least one"),
});

type FormData = z.infer<typeof formSchema>;

interface Industry {
  industry_id: number;
  name: string;
}
interface JobType {
  type_id: number;
  type: string;
}
interface Facility {
  facility_id: number;
  name: string;
}

const EmployerAboutBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypesList, setJobTypesList] = useState<JobType[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { jobTypes: [], facilities: [] },
  });

  const watchedJobTypes = watch("jobTypes") || [];
  const watchedFacilities = watch("facilities") || [];

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      const { data: industriesData } = await supabase
        .from("industry")
        .select("industry_id, name");
      setIndustries(industriesData || []);

      const { data: jobTypeData } = await supabase
        .from("job_type")
        .select("type_id, type");
      setJobTypesList(jobTypeData || []);

      const { data: facilityData } = await supabase
        .from("facility")
        .select("facility_id, name");
      setFacilitiesList(facilityData || []);
    };
    loadData();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Check if employer record exists, if not create it with required fields
      const { data: existingEmployer } = await supabase
        .from("employer")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!existingEmployer) {
        // Create employer record with required fields
        const { error: createError } = await supabase
          .from("employer")
          .insert({
            user_id: user.id,
            abn: "000000000", // Placeholder - user will update in profile
            given_name: "Update Required", // Placeholder - user will update in profile
            tagline: data.businessTagline,
            business_tenure: data.yearsInBusiness as any,
            employee_count: data.employeeCount as any,
            industry_id: parseInt(data.industryId, 10),
            pay_range: data.payRange as any,
            updated_at: new Date().toISOString(),
          });

        if (createError) throw createError;
      } else {
        // Update existing employer record
        const { error: employerError } = await supabase
          .from("employer")
          .update({
            tagline: data.businessTagline,
            business_tenure: data.yearsInBusiness as any,
            employee_count: data.employeeCount as any,
            industry_id: parseInt(data.industryId, 10),
            pay_range: data.payRange as any,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (employerError) throw employerError;
      }

      // 2. Job types
      await supabase.from("employer_job_type").delete().eq("user_id", user.id);
      if (data.jobTypes.length) {
        const rows = jobTypesList
          .filter((jt) => data.jobTypes.includes(jt.type))
          .map((jt) => ({ user_id: user.id, type_id: jt.type_id }));

        if (rows.length) {
          const { error: jtError } = await supabase
            .from("employer_job_type")
            .insert(rows);
          if (jtError) throw jtError;
        }
      }

      // 3. Facilities
      await supabase.from("employer_facility").delete().eq("user_id", user.id);
      if (data.facilities.length) {
        const rows = facilitiesList
          .filter((f) => data.facilities.includes(f.name))
          .map((f) => ({ user_id: user.id, facility_id: f.facility_id }));

        if (rows.length) {
          const { error: fError } = await supabase
            .from("employer_facility")
            .insert(rows);
          if (fError) throw fError;
        }
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
                          {["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"].map(
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
                              key={ind.industry_id}
                              value={ind.industry_id.toString()}
                            >
                              {ind.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
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
                          {["$25–30/hour", "$30–35/hour", "$35–40/hour", "$40–45/hour", "$45+/hour"].map(
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

                {/* Job Type */}
                <div>
                  <Label>Job Type *</Label>
                  {jobTypesList.map((jt) => (
                    <label key={jt.type_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={jt.type}
                        checked={watchedJobTypes.includes(jt.type)}
                        onChange={(e) => {
                          const current = watchedJobTypes;
                          if (e.target.checked)
                            setValue("jobTypes", [...current, jt.type]);
                          else
                            setValue(
                              "jobTypes",
                              current.filter((x) => x !== jt.type)
                            );
                        }}
                      />
                      <span>{jt.type}</span>
                    </label>
                  ))}
                </div>

                {/* Facilities */}
                <div>
                  <Label>Facilities & Extras *</Label>
                  {facilitiesList.map((f) => (
                    <label key={f.facility_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={f.name}
                        checked={watchedFacilities.includes(f.name)}
                        onChange={(e) => {
                          const current = watchedFacilities;
                          if (e.target.checked)
                            setValue("facilities", [...current, f.name]);
                          else
                            setValue(
                              "facilities",
                              current.filter((x) => x !== f.name)
                            );
                        }}
                      />
                      <span>{f.name}</span>
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
