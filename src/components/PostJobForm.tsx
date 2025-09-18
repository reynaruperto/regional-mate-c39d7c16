import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// ✅ Ensure EmployerProfile includes industry_id
interface EmployerProfile {
  user_id: string;
  industry_id: number;
}

interface IndustryRole {
  industry_role_id: number;
  role: string;
}

interface License {
  license_id: number;
  name: string;
}

// ✅ Validation schema
const jobSchema = z.object({
  industry_role_id: z.string(),
  description: z.string(),
  employment_type: z.string(),
  salary_range: z.string(),
  req_experience: z.string(),
  state: z.string(),
  suburb_city: z.string(),
  postcode: z.string(),
  start_date: z.string(),
  license_id: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

const PostJobForm: React.FC<{ employerProfile: EmployerProfile }> = ({
  employerProfile,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const [roles, setRoles] = useState<IndustryRole[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);

  const employerIndustryId = employerProfile?.industry_id;

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        // 🎯 Roles by employer.industry_id
        if (employerIndustryId) {
          const { data: rolesData, error: rolesErr } = await supabase
            .from("industry_role")
            .select("industry_role_id, role")
            .eq("industry_id", employerIndustryId);

          console.log("Roles Response:", rolesData, rolesErr);
          if (rolesData) setRoles(rolesData);
        }

        // 🎯 Job types
        const { data: jt, error: jtErr } = await (supabase.rpc as any)(
          "get_enum_values",
          { enum_name: "job_type_enum" }
        );
        console.log("Job Types Response:", jt, jtErr);
        if (jt) setJobTypes(jt[0]?.get_enum_values || jt);

        // 🎯 Pay ranges
        const { data: pr, error: prErr } = await (supabase.rpc as any)(
          "get_enum_values",
          { enum_name: "pay_range" }
        );
        console.log("Pay Ranges Response:", pr, prErr);
        if (pr) setPayRanges(pr[0]?.get_enum_values || pr);

        // 🎯 Experience ranges
        const { data: er, error: erErr } = await (supabase.rpc as any)(
          "get_enum_values",
          { enum_name: "years_experience" }
        );
        console.log("Experience Ranges Response:", er, erErr);
        if (er) setExperienceRanges(er[0]?.get_enum_values || er);

        // 🎯 Licenses
        const { data: lic, error: licErr } = await supabase
          .from("license")
          .select("license_id, name");
        console.log("Licenses Response:", lic, licErr);
        if (lic) setLicenses(lic);
      } catch (err) {
        console.error("Dropdown load error:", err);
      }
    };

    loadDropdowns();
  }, [employerIndustryId]);

  const onSubmit = async (formData: JobFormData) => {
    console.log("Submitting job:", formData);

    const { error } = await supabase.from("job").insert(
      {
        industry_role_id: parseInt(formData.industry_role_id, 10),
        description: formData.description,
        employment_type: formData.employment_type,
        salary_range: formData.salary_range,
        req_experience: formData.req_experience,
        state: formData.state,
        suburb_city: formData.suburb_city,
        postcode: formData.postcode,
        start_date: formData.start_date,
        license_id: formData.license_id
          ? parseInt(formData.license_id, 10)
          : null,
        user_id: employerProfile.user_id,
        job_status: "active", // default status
      } as any // 👈 bypass TypeScript type mismatch
    );

    if (error) {
      console.error("Insert job error:", error);
    } else {
      console.log("Job posted successfully!");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role */}
      <Controller
        name="industry_role_id"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem
                  key={role.industry_role_id}
                  value={role.industry_role_id.toString()}
                >
                  {role.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* Job Type */}
      <Controller
        name="employment_type"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select Job Type" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map((jt) => (
                <SelectItem key={jt} value={jt}>
                  {jt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* Salary Range */}
      <Controller
        name="salary_range"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select Salary Range" />
            </SelectTrigger>
            <SelectContent>
              {payRanges.map((pr) => (
                <SelectItem key={pr} value={pr}>
                  {pr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* Experience */}
      <Controller
        name="req_experience"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select Experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceRanges.map((er) => (
                <SelectItem key={er} value={er}>
                  {er}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* License */}
      <Controller
        name="license_id"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select License (optional)" />
            </SelectTrigger>
            <SelectContent>
              {licenses.map((lic) => (
                <SelectItem key={lic.license_id} value={lic.license_id.toString()}>
                  {lic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* Description */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Input {...field} placeholder="Enter job description" />
        )}
      />

      {/* Location */}
      <Controller
        name="state"
        control={control}
        render={({ field }) => (
          <Input {...field} placeholder="Enter state" />
        )}
      />
      <Controller
        name="suburb_city"
        control={control}
        render={({ field }) => (
          <Input {...field} placeholder="Enter suburb / city" />
        )}
      />
      <Controller
        name="postcode"
        control={control}
        render={({ field }) => (
          <Input {...field} placeholder="Enter postcode" />
        )}
      />

      {/* Start Date */}
      <Controller
        name="start_date"
        control={control}
        render={({ field }) => (
          <Input {...field} type="date" placeholder="Select start date" />
        )}
      />

      <Button type="submit">Post Job</Button>
    </form>
  );
};

export default PostJobForm;
