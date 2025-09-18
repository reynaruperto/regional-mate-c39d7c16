import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getEmployerProfile } from "@/utils/employerProfile";

interface PostJobFormProps {
  onBack: () => void;
  editingJob?: {
    job_id: number;
    role: string; // display only
    job_status: "active" | "inactive" | "draft";
  } | null;
}

type RoleRow = { industry_role_id: number; role: string };
type LicenseRow = { license_id: number; name: string };

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();
  const employerProfile = getEmployerProfile();
  const employerIndustryIdRaw = employerProfile?.industry;

  // Normalize employer industry id
  const employerIndustryId = useMemo(() => {
    const n =
      typeof employerIndustryIdRaw === "string"
        ? parseInt(employerIndustryIdRaw, 10)
        : employerIndustryIdRaw;
    return Number.isFinite(n) ? (n as number) : undefined;
  }, [employerIndustryIdRaw]);

  // Dropdown data
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [showFuturePopup, setShowFuturePopup] = useState(false);

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    jobRole: editingJob?.role || "",
    jobDescription: "",
    jobType: "",
    payRange: "",
    experienceRange: "",
    state: "",
    area: "",
    status: editingJob?.job_status || "active",
  });

  // Helper: try multiple enum typenames until one returns values
  const fetchEnumFor = async (typeNames: string[]) => {
    for (const name of typeNames) {
      try {
        const { data, error } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: name,
        });
        if (!error && Array.isArray(data) && data.length > 0) return data as string[];
      } catch {
        // try next
      }
    }
    return [] as string[];
  };

  // 🔹 Fetch roles, job enums, licenses, and distinct states from the view
  useEffect(() => {
    const run = async () => {
      try {
        // Roles limited by employer industry
        if (employerIndustryId) {
          const { data: rolesData } = await supabase
            .from("industry_role")
            .select("industry_role_id, role")
            .eq("industry_id", employerIndustryId);
          if (rolesData) setRoles(rolesData as RoleRow[]);
        } else {
          setRoles([]);
        }

        // Job table enums (try canonical names + fallbacks)
        const [jt, pr, exp] = await Promise.all([
          fetchEnumFor(["employment_type", "job_type_enum"]),
          fetchEnumFor(["salary_range", "pay_range"]),
          fetchEnumFor(["req_experience", "years_experience", "experience_enum"]),
        ]);
        setJobTypes(jt);
        setPayRanges(pr);
        setExperienceRanges(exp);

        // Licenses
        const { data: licensesData } = await supabase
          .from("license")
          .select("license_id, name");
        if (licensesData) setLicenses(licensesData as LicenseRow[]);

        // Distinct states from mvw_emp_location_roles
        const { data: stateRows } = await supabase
          .from("mvw_emp_location_roles" as any)
          .select("state");
        if (Array.isArray(stateRows)) {
          const uniq = Array.from(
            new Set(stateRows.map((r: any) => (r?.state ?? "").toString()).filter(Boolean))
          ).sort();
          setStates(uniq);
        }
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [employerIndustryId]);

  // 🔹 Fetch areas for the selected state from mvw_emp_location_roles
  useEffect(() => {
    const run = async () => {
      if (!formData.state) {
        setAreas([]);
        return;
      }
      try {
        const { data } = await supabase
          .from("mvw_emp_location_roles" as any)
          .select("suburb_city, postcode")
          .eq("state", formData.state);

        if (Array.isArray(data)) {
          const uniqueAreas = Array.from(
            new Set(
              data.map(
                (d: any) =>
                  `${(d?.suburb_city ?? "").toString().trim()} (${(d?.postcode ?? "")
                    .toString()
                    .trim()})`
              )
            )
          ).filter((s) => s && !s.startsWith(" ("));
          setAreas(uniqueAreas);
        }
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [formData.state]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const errors: string[] = [];
    if (!formData.jobRole) errors.push("Select a job role.");
    if (!formData.jobDescription?.trim()) errors.push("Add a job description.");
    if (!formData.jobType) errors.push("Select a job type.");
    if (!formData.payRange) errors.push("Select a salary range.");
    if (!formData.experienceRange) errors.push("Select experience required.");
    if (!formData.state) errors.push("Select a state.");
    if (!formData.area) errors.push("Select an area (suburb + postcode).");

    // Ensure the role exists in our filtered list
    const selectedRole = roles.find((r) => r.role === formData.jobRole);
    if (!selectedRole) errors.push("Selected role is not valid for your industry.");

    return errors;
  };

  const handleSaveAndPost = async () => {
    if (saving) return;
    const problems = validate();
    if (problems.length) {
      toast({ title: "Missing fields", description: problems.join(" ") });
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to post jobs." });
        return;
      }

      // Parse "Suburb (Postcode)"
      let suburb_city = "";
      let postcode = "";
      if (formData.area.includes("(")) {
        suburb_city = formData.area.split("(")[0].trim();
        postcode = formData.area.match(/\(([^)]+)\)/)?.[1]?.trim() ?? "";
      } else {
        suburb_city = formData.area;
      }

      const selectedRole = roles.find((r) => r.role === formData.jobRole)!;

      const jobPayload = {
        industry_role_id: selectedRole.industry_role_id,
        description: formData.jobDescription,
        employment_type: formData.jobType as any,
        salary_range: formData.payRange as any,
        req_experience: formData.experienceRange as any,
        job_status: formData.status as any,
        state: formData.state as any,
        suburb_city,
        postcode,
        user_id: user.id,
        start_date: new Date().toISOString().split("T")[0], // required by schema
      };

      let error: any;
      let jobId: number | undefined;

      if (editingJob) {
        const { data: updatedJob, error: updateError } = await supabase
          .from("job")
          .update(jobPayload as any)
          .eq("job_id", editingJob.job_id)
          .select("job_id")
          .single();
        error = updateError;
        jobId = updatedJob?.job_id as number | undefined;
      } else {
        const { data: insertedJob, error: insertError } = await supabase
          .from("job")
          .insert(jobPayload as any)
          .select("job_id")
          .single();
        error = insertError;
        jobId = insertedJob?.job_id as number | undefined;
      }

      if (error) {
        toast({ title: "Error", description: error.message ?? "Failed to save job." });
        return;
      }

      // Save licenses in junction table
      if (jobId !== undefined) {
        // clear existing (safe for both create/edit)
        await supabase.from("job_license").delete().eq("job_id", jobId);
        if (selectedLicenses.length > 0) {
          const rows = selectedLicenses.map((lid) => ({ job_id: jobId, license_id: lid }));
          await supabase.from("job_license").insert(rows as any);
        }
      }

      toast({
        title: editingJob ? "Job Updated" : "Job Posted",
        description: editingJob
          ? "Job has been successfully updated."
          : "Job has been successfully posted.",
      });
      onBack();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message ?? "Unexpected error." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-200">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={onBack}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {editingJob ? "Edit Job" : "Post Job"}
              </h1>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto pb-24">
              {/* Job Role (filtered by employer industry) */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Role</h2>
                <Select
                  value={formData.jobRole}
                  onValueChange={(value) => handleInputChange("jobRole", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.industry_role_id} value={r.role}>
                        {r.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Description</h2>
                <Textarea
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  placeholder="Describe the role..."
                  className="bg-gray-50 border-gray-200 rounded-xl text-sm min-h-[60px] resize-none"
                />
              </div>

              {/* Job Type (enum) */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Type</h2>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) => handleInputChange("jobType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt) => (
                      <SelectItem key={jt} value={jt}>
                        {jt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range (enum) */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Salary Range</h2>
                <Select
                  value={formData.payRange}
                  onValueChange={(value) => handleInputChange("payRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select salary range" />
                  </SelectTrigger>
                  <SelectContent>
                    {payRanges.map((pr) => (
                      <SelectItem key={pr} value={pr}>
                        {pr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Required (enum) */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Experience Required</h2>
                <Select
                  value={formData.experienceRange}
                  onValueChange={(value) => handleInputChange("experienceRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceRanges.map((er) => (
                      <SelectItem key={er} value={er}>
                        {er}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location (from mvw_emp_location_roles) */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Location</h2>
                <Select
                  value={formData.state}
                  onValueChange={(value) => {
                    // keep your "future" gating if not Queensland
                    if (value !== "Queensland") {
                      setShowFuturePopup(true);
                    }
                    handleInputChange("state", value);
                    handleInputChange("area", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.state && (
                  <Select
                    value={formData.area}
                    onValueChange={(value) => handleInputChange("area", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select area (suburb + postcode)" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Licenses (from license table) */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Required Licenses</h2>
                <Select
                  onValueChange={(value) => {
                    const id = parseInt(value, 10);
                    if (!selectedLicenses.includes(id)) {
                      setSelectedLicenses((prev) => [...prev, id]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a license" />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map((l) => (
                      <SelectItem key={l.license_id} value={l.license_id.toString()}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Pills */}
                <div className="flex flex-wrap mt-2 gap-2">
                  {selectedLicenses.map((id) => {
                    const license = licenses.find((l) => l.license_id === id);
                    return (
                      <span
                        key={id}
                        className="bg-slate-100 px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1"
                      >
                        {license?.name}
                        <button
                          onClick={() =>
                            setSelectedLicenses((prev) => prev.filter((lid) => lid !== id))
                          }
                          className="text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Status</h2>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Active / Inactive</span>
                  <Switch
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) =>
                      handleInputChange("status", checked ? "active" : "inactive")
                    }
                  />
                </div>
              </div>

              {/* Save */}
              <div className="pb-6">
                <Button
                  onClick={handleSaveAndPost}
                  disabled={saving}
                  className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90 text-white rounded-xl h-12 text-base font-medium"
                >
                  {saving ? "Saving..." : editingJob ? "Update Job" : "Post Job"}
                </Button>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-white">
              <BottomNavigation />
            </div>
          </div>
        </div>

        {/* Future States Popup */}
        {showFuturePopup && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-[90%] text-center shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                These functions are for future phases
              </h2>
              <p className="text-gray-600 mb-6">We’ll be back with more locations soon!</p>
              <Button
                onClick={() => setShowFuturePopup(false)}
                className="w-full bg-slate-800 text-white rounded-lg py-2"
              >
                Got It
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostJobForm;
