import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  description: z.string().min(5, "Job description is required"),
  industry_role_id: z.string(),
  employment_type: z.string(),
  salary_range: z.string(),
  req_experience: z.string(),
  suburb_city: z.string(),
  postcode: z.string(),
  state: z.string(),
  license_id: z.string().optional(),
  start_date: z.string(),
});

type FormData = z.infer<typeof schema>;

const PostJobForm: React.FC<{ employerIndustryId: number; userId: string }> = ({
  employerIndustryId,
  userId,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const [roles, setRoles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);

  // 🔹 Load enums, roles, locations, licenses
  useEffect(() => {
    (async () => {
      try {
        // Enums
        const { data: jt } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: "job_type_enum",
        });
        const { data: pr } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: "pay_range",
        });
        const { data: yr } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: "years_experience",
        });

        if (jt) setJobTypes(jt);
        if (pr) setPayRanges(pr);
        if (yr) setExperienceRanges(yr);

        // Roles + Locations
        const { data: rl, error: rlErr } = await supabase
          .from("mvw_emp_location_roles")
          .select("industry_role_id, industry_role, state, suburb_city, postcode")
          .eq("industry_id", employerIndustryId);

        if (rlErr) console.error("Error fetching roles/locations:", rlErr);
        else if (rl) {
          setRoles(rl.map((r) => ({
            industry_role_id: r.industry_role_id,
            role: r.industry_role,
          })));
          setLocations(rl);
        }

        // Licenses
        const { data: lc, error: lcErr } = await supabase
          .from("license")
          .select("id, name");
        if (lcErr) console.error("Error fetching licenses:", lcErr);
        else if (lc) setLicenses(lc);
      } catch (err) {
        console.error("Setup error:", err);
      }
    })();
  }, [employerIndustryId]);

  // 🔹 Submit
  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.from("job").insert({
      description: data.description,
      industry_role_id: parseInt(data.industry_role_id),
      employment_type: data.employment_type,
      salary_range: data.salary_range,
      req_experience: data.req_experience,
      suburb_city: data.suburb_city,
      postcode: data.postcode,
      state: data.state,
      start_date: data.start_date,
      job_status: "active",
      user_id: userId,
    });

    if (error) {
      console.error("Insert job error:", error);
      alert("Error posting job: " + error.message);
    } else {
      alert("Job posted successfully!");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Post a New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Description */}
          <div>
            <Label>Job Description</Label>
            <Textarea placeholder="Write a short job description..." {...register("description")} />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>

          {/* Job Role */}
          <div>
            <Label>Job Role</Label>
            <Select onValueChange={(val) => setValue("industry_role_id", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Job Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.industry_role_id} value={r.industry_role_id.toString()}>
                    {r.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type */}
          <div>
            <Label>Employment Type</Label>
            <Select onValueChange={(val) => setValue("employment_type", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Employment Type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salary */}
          <div>
            <Label>Salary Range</Label>
            <Select onValueChange={(val) => setValue("salary_range", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Salary Range" />
              </SelectTrigger>
              <SelectContent>
                {payRanges.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience */}
          <div>
            <Label>Experience Required</Label>
            <Select onValueChange={(val) => setValue("req_experience", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Required Experience" />
              </SelectTrigger>
              <SelectContent>
                {experienceRanges.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* License */}
          <div>
            <Label>License (optional)</Label>
            <Select onValueChange={(val) => setValue("license_id", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select License" />
              </SelectTrigger>
              <SelectContent>
                {licenses.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <Label>Start Date</Label>
            <Input type="date" {...register("start_date")} />
          </div>

          {/* Location */}
          <div>
            <Label>Location</Label>
            <Select onValueChange={(val) => {
              const loc = locations.find(l => l.suburb_city === val);
              if (loc) {
                setValue("suburb_city", loc.suburb_city);
                setValue("postcode", loc.postcode);
                setValue("state", loc.state);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc, idx) => (
                  <SelectItem key={idx} value={loc.suburb_city}>
                    {loc.suburb_city}, {loc.state} {loc.postcode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Post Job
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostJobForm;
