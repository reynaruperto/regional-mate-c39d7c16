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
    role?: string;
    job_status: "active" | "inactive" | "draft";
  } | null;
}

type RoleRow = { industry_role_id: number; role: string };

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();

  const employerProfile = getEmployerProfile() as any;
  const employerIndustryId: number | undefined = useMemo(() => {
    const raw = employerProfile?.industry_id ?? employerProfile?.industry;
    const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
    return Number.isFinite(n) ? (n as number) : undefined;
  }, [employerProfile]);

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [showFuturePopup, setShowFuturePopup] = useState(false);

  const [formData, setFormData] = useState({
    jobRoleId: "" as number | string,
    jobDescription: "",
    jobType: "",
    payRange: "",
    experienceRange: "",
    state: "",
    area: "",
    status: (editingJob?.job_status ?? "active") as "active" | "inactive" | "draft",
  });

  // Helper to fetch enums
  const fetchEnum = async (enumName: string): Promise<string[]> => {
    const { data, error } = await (supabase.rpc as any)("get_enum_values", {
      enum_name: enumName,
    });
    if (error) {
      console.error(error);
      return [];
    }
    return data ?? [];
  };

  useEffect(() => {
    (async () => {
      try {
        // Roles filtered by employer industry
        if (employerIndustryId) {
          const { data } = await supabase
            .from("industry_role")
            .select("industry_role_id, role")
            .eq("industry_id", employerIndustryId);
          if (data) setRoles(data as RoleRow[]);
        }

        // Enums
        const [jt, pr, yr] = await Promise.all([
          fetchEnum("job_type_enum"),
          fetchEnum("pay_range"),
          fetchEnum("years_experience"),
        ]);
        setJobTypes(jt);
        setPayRanges(pr);
        setExperienceRanges(yr);
      } catch (err) {
        console.error("Dropdown load error:", err);
      }
    })();
  }, [employerIndustryId]);

  // Fetch areas (location) when state is QLD
  useEffect(() => {
    (async () => {
      if (formData.state !== "Queensland") return;
      const { data } = await supabase
        .from("mvw_emp_location_roles" as any)
        .select("suburb_city, postcode")
        .eq("state", "Queensland");
      if (data) {
        const unique = [
          ...new Set(data.map((d: any) => `${d.suburb_city} (${d.postcode})`)),
        ];
        setAreas(unique);
      }
    })();
  }, [formData.state]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAndPost = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post jobs." });
      return;
    }

    let suburb_city = "";
    let postcode = "";
    if (formData.area.includes("(")) {
      suburb_city = formData.area.split("(")[0].trim();
      postcode = formData.area.match(/\(([^)]+)\)/)?.[1]?.trim() ?? "";
    } else {
      suburb_city = formData.area;
    }

    const payload = {
      industry_role_id: Number(formData.jobRoleId),
      description: formData.jobDescription,
      employment_type: formData.jobType as any,
      salary_range: formData.payRange as any,
      req_experience: formData.experienceRange as any,
      job_status: formData.status as any,
      state: formData.state as any,
      suburb_city,
      postcode,
      user_id: user.id,
      start_date: new Date().toISOString().split("T")[0],
    };

    let error;
    if (editingJob?.job_id) {
      const { error: updateErr } = await supabase
        .from("job")
        .update(payload as any)
        .eq("job_id", editingJob.job_id);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase.from("job").insert(payload as any);
      error = insertErr;
    }

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({
        title: editingJob ? "Job Updated" : "Job Posted",
        description: editingJob
          ? "Job has been successfully updated"
          : "Job has been successfully posted",
      });
      onBack();
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
              {/* Job Role */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Role</h2>
                <Select
                  value={formData.jobRoleId ? String(formData.jobRoleId) : ""}
                  onValueChange={(val) => handleInputChange("jobRoleId", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
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

              {/* Job Type */}
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

              {/* Salary Range */}
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

              {/* Experience */}
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

              {/* Location */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Location</h2>
                <Select
                  value={formData.state}
                  onValueChange={(value) => {
                    if (value !== "Queensland") setShowFuturePopup(true);
                    handleInputChange("state", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Queensland", "NSW", "VIC", "SA", "WA", "TAS", "NT", "ACT"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.state === "Queensland" && (
                  <Select
                    value={formData.area}
                    onValueChange={(value) => handleInputChange("area", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select area" />
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
                  className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90 text-white rounded-xl h-12 text-base font-medium"
                >
                  {editingJob ? "Update Job" : "Post Job"}
                </Button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white">
              <BottomNavigation />
            </div>
          </div>
        </div>

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
