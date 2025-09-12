import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check } from "lucide-react";
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

// Options
const yearsOptions = ["<1", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20+"] as const;
const employeeOptions = ["1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"] as const;
const payRanges = ["$25-30/hour", "$30-35/hour", "$35-40/hour", "$40-45/hour", "$45+/hour"] as const;
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

// Schema
const formSchema = z.object({
  abn: z.string().length(11).regex(/^\d+$/, "ABN must be numeric"),
  website: z.string().optional().or(z.literal("")),
  businessPhone: z.string().min(10),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional(),
  suburbCity: z.string().min(2),
  state: z.enum(AUSTRALIAN_STATES),
  postCode: z.string().length(4).regex(/^\d+$/, "Must be numeric"),
  businessTagline: z.string().min(5).max(200),
  yearsInBusiness: z.enum(yearsOptions),
  employeeCount: z.enum(employeeOptions),
  industryId: z.number(),
  rolesOffered: z.array(z.string()).min(1),
  jobType: z.array(z.string()).min(1),
  payRange: z.enum(payRanges),
  facilitiesAndExtras: z.array(z.string()).min(1),
});

type FormData = z.infer<typeof formSchema>;

const EditBusinessProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);

  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; role: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<{ id: number; type: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rolesOffered: [],
      jobType: [],
      facilitiesAndExtras: [],
    },
  });

  const watchedRoles = watch("rolesOffered");
  const watchedJobTypes = watch("jobType");
  const watchedFacilities = watch("facilitiesAndExtras");
  const watchedIndustryId = watch("industryId");

  // Load options + employer data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/employer/sign-in");
        return;
      }

      // Options
      const { data: indData } = await supabase.from("industry").select("industry_id, name");
      if (indData) setIndustries(indData.map(i => ({ id: i.industry_id, name: i.name })));

      const { data: jobData } = await supabase.from("job_type").select("type_id, type");
      if (jobData) setJobTypes(jobData.map(j => ({ id: j.type_id, type: j.type })));

      const { data: facData } = await supabase.from("facility").select("facility_id, name");
      if (facData) setFacilities(facData.map(f => ({ id: f.facility_id, name: f.name })));

      // Employer
      const { data: employer } = await supabase.from("employer").select("*").eq("user_id", user.id).maybeSingle();
      if (employer) {
        reset({
          abn: employer.abn,
          website: employer.website || "",
          businessPhone: employer.mobile_num || "",
          addressLine1: employer.address_line1 || "",
          addressLine2: employer.address_line2 || "",
          suburbCity: employer.suburb_city || "",
          state: employer.state,
          postCode: employer.postcode || "",
          businessTagline: employer.tagline || "",
          yearsInBusiness: employer.business_tenure,
          employeeCount: employer.employee_count,
          industryId: employer.industry_id || 0,
          payRange: employer.pay_range,
          rolesOffered: [],
          jobType: [],
          facilitiesAndExtras: [],
        });
      }

      // Prefill job types
      const { data: empJobTypes } = await supabase.from("employer_job_type").select("type_id").eq("user_id", user.id);
      if (empJobTypes && jobData) {
        const selectedTypes = jobData.filter(j => empJobTypes.some((e: any) => e.type_id === j.type_id)).map(j => j.type);
        setValue("jobType", selectedTypes);
      }

      // Prefill facilities
      const { data: empFacilities } = await supabase.from("employer_facility").select("facility_id").eq("user_id", user.id);
      if (empFacilities && facData) {
        const selectedFacilities = facData.filter(f => empFacilities.some((e: any) => e.facility_id === f.facility_id)).map(f => f.name);
        setValue("facilitiesAndExtras", selectedFacilities);
      }

      // Prefill roles
      const { data: empRoles } = await supabase.from("employer_role" as any).select("industry_role_id").eq("user_id", user.id);
      if (empRoles) {
        const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role").in("industry_role_id", empRoles.map((r: any) => r.industry_role_id));
        if (roleData) {
          const selectedRoles = roleData.map(r => r.role);
          setValue("rolesOffered", selectedRoles);
        }
      }
    };
    loadData();
  }, [navigate, reset, setValue]);

  // Load roles dynamically when industry changes
  useEffect(() => {
    if (!watchedIndustryId) return;
    const fetchRoles = async () => {
      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role")
        .eq("industry_id", watchedIndustryId);
      if (roleData) setRoles(roleData.map(r => ({ id: r.industry_role_id, role: r.role })));
    };
    fetchRoles();
  }, [watchedIndustryId]);

  // Save
  const onSubmit = async (data: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      // Update employer
      await supabase.from("employer").update({
        tagline: data.businessTagline,
        business_tenure: data.yearsInBusiness,
        employee_count: data.employeeCount,
        industry_id: data.industryId,
        pay_range: data.payRange,
        website: data.website || null,
        mobile_num: data.businessPhone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        suburb_city: data.suburbCity,
        state: data.state,
        postcode: data.postCode,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);

      // Replace job types
      await supabase.from("employer_job_type").delete().eq("user_id", user.id);
      const selectedJobTypeIds = jobTypes.filter(j => data.jobType.includes(j.type)).map(j => j.id);
      if (selectedJobTypeIds.length > 0) {
        await supabase.from("employer_job_type").insert(selectedJobTypeIds.map(id => ({ user_id: user.id, type_id: id })));
      }

      // Replace facilities
      await supabase.from("employer_facility").delete().eq("user_id", user.id);
      const selectedFacilityIds = facilities.filter(f => data.facilitiesAndExtras.includes(f.name)).map(f => f.id);
      if (selectedFacilityIds.length > 0) {
        await supabase.from("employer_facility").insert(selectedFacilityIds.map(id => ({ user_id: user.id, facility_id: id })));
      }

      // Replace roles
      await supabase.from("employer_role" as any).delete().eq("user_id", user.id);
      const selectedRoleIds = roles.filter(r => data.rolesOffered.includes(r.role)).map(r => r.id);
      if (selectedRoleIds.length > 0) {
        await supabase.from("employer_role" as any).insert(selectedRoleIds.map(id => ({ user_id: user.id, industry_role_id: id })));
      }

      toast({ title: "Profile Updated", description: "Business profile updated successfully" });
      navigate("/employer/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center justify-between">
            <button onClick={() => navigate("/employer/dashboard")} className="text-[#1E293B] underline">Cancel</button>
            <h1 className="text-lg font-semibold">{step === 1 ? "Business Registration" : "About Business"}</h1>
            <button type="submit" form="editForm" className="flex items-center text-[#1E293B] underline">
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 px-6 overflow-y-auto pb-20">
            <form id="editForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <>
                  <div><Label>ABN</Label><Input {...register("abn")} disabled /></div>
                  <div><Label>Website</Label><Input {...register("website")} /></div>
                  <div><Label>Business Phone</Label><Input {...register("businessPhone")} /></div>
                  <div><Label>Address Line 1</Label><Input {...register("addressLine1")} /></div>
                  <div><Label>Address Line 2</Label><Input {...register("addressLine2")} /></div>
                  <div><Label>Suburb / City</Label><Input {...register("suburbCity")} /></div>
                  <div>
                    <Label>State</Label>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>{AUSTRALIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div><Label>Postcode</Label><Input {...register("postCode")} maxLength={4} /></div>
                </>
              )}

              {step === 2 && (
                <>
                  <div><Label>Business Tagline</Label><Input {...register("businessTagline")} /></div>
                  <div>
                    <Label>Years in Business</Label>
                    <Controller
                      name="yearsInBusiness"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select years" /></SelectTrigger>
                          <SelectContent>{yearsOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Employees</Label>
                    <Controller
                      name="employeeCount"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select employees" /></SelectTrigger>
                          <SelectContent>{employeeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Controller
                      name="industryId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : ""}>
                          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                          <SelectContent>{industries.map(ind => <SelectItem key={ind.id} value={String(ind.id)}>{ind.name}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Roles Offered</Label>
                    {roles.map(r => (
                      <label key={r.id} className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          value={r.role}
                          checked={watchedRoles.includes(r.role)}
                          onChange={e => {
                            if (e.target.checked) setValue("rolesOffered", [...watchedRoles, r.role]);
                            else setValue("rolesOffered", watchedRoles.filter(rr => rr !== r.role));
                          }}
                        />
                        <span>{r.role}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label>Job Type</Label>
                    {jobTypes.map(j => (
                      <label key={j.id} className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          value={j.type}
                          checked={watchedJobTypes.includes(j.type)}
                          onChange={e => {
                            if (e.target.checked) setValue("jobType", [...watchedJobTypes, j.type]);
                            else setValue("jobType", watchedJobTypes.filter(a => a !== j.type));
                          }}
                        />
                        <span>{j.type}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label>Pay Range</Label>
                    <Controller
                      name="payRange"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select pay" /></SelectTrigger>
                          <SelectContent>{payRanges.map(range => <SelectItem key={range} value={range}>{range}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Facilities & Extras</Label>
                    {facilities.map(f => (
                      <label key={f.id} className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          value={f.name}
                          checked={watchedFacilities.includes(f.name)}
                          onChange={e => {
                            if (e.target.checked) setValue("facilitiesAndExtras", [...watchedFacilities, f.name]);
                            else setValue("facilitiesAndExtras", watchedFacilities.filter(x => x !== f.name));
                          }}
                        />
                        <span>{f.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer with stepper */}
          <div className="p-4 flex flex-col items-center">
            <div className="flex gap-2 mb-3">
              {[1, 2].map((i) => (
                <div key={i} className={`h-2 w-6 rounded-full ${step === i ? "bg-slate-800" : "bg-gray-300"}`} />
              ))}
            </div>
            <div className="flex justify-between w-full">
              <Button
                disabled={step === 1}
                onClick={() => setStep(step - 1 as 1 | 2)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                disabled={step === 2}
                onClick={() => setStep(step + 1 as 1 | 2)}
                className="bg-slate-800 text-white"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBusinessProfile;
