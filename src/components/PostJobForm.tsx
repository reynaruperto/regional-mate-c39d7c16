import React, { useEffect, useState } from "react";
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
    role: string;
    job_status: "active" | "inactive" | "draft";
  } | null;
}

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();
  const employerProfile = getEmployerProfile();
  const employerIndustryId = employerProfile?.industry_id
    ? parseInt(employerProfile.industry_id, 10)
    : undefined;

  const [roles, setRoles] = useState<{ industry_role_id: number; role: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<{ license_id: number; name: string }[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [showFuturePopup, setShowFuturePopup] = useState(false);

  const [formData, setFormData] = useState({
    jobRoleId: "" as number | string,
    jobDescription: "",
    jobType: "",
    payRange: "",
    experienceRange: "",
    state: "",
    area: "",
    status: editingJob?.job_status || "active",
  });

  // Fetch enums + roles + licenses
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        // Roles filtered by employer industry
        if (employerIndustryId) {
          const { data: rolesData, error: rolesErr } = await supabase
            .from("industry_role")
            .select("industry_role_id, role")
            .eq("industry_id", employerIndustryId);
          console.log("Roles Response:", rolesData, rolesErr);
          if (rolesData) setRoles(rolesData);
        }

        // Job type enum
        const { data: jt, error: jtErr } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: "job_type_enum",
        });
        console.log("Job Types Response:", jt, jtErr);
        if (jt) setJobTypes(jt[0]?.get_enum_values || jt);

        // Pay range enum
        const { data: pr, error: prErr } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: "pay_range",
        });
        console.log("Pay Ranges Response:", pr, prErr);
        if (pr) setPayRanges(pr[0]?.get_enum_values || pr);

        // Experience enum
        const { data: er, error: erErr } = await (supabase.rpc as any)("get_enum_values", {
          enum_name: "years_experience",
        });
        console.log("Experience Ranges Response:", er, erErr);
        if (er) setExperienceRanges(er[0]?.get_enum_values || er);

        // Licenses
        const { data: lic, error: licErr } = await supabase.from("license").select("license_id, name");
        console.log("Licenses Response:", lic, licErr);
        if (lic) setLicenses(lic);
      } catch (err) {
        console.error("Dropdown load error:", err);
      }
    };

    loadDropdowns();
  }, [employerIndustryId]);

  // Fetch areas by state
  useEffect(() => {
    const fetchAreas = async () => {
      if (!formData.state) return;
      const { data, error } = await supabase
        .from("mvw_emp_location_roles" as any)
        .select("suburb_city, postcode")
        .eq("state", formData.state);

      console.log("Areas Response:", data, error);

      if (data) {
        const unique = [...new Set(data.map((d: any) => `${d.suburb_city} (${d.postcode})`))];
        setAreas(unique);
      }
    };
    fetchAreas();
  }, [formData.state]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAndPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post jobs." });
      return;
    }

    // Parse area into suburb + postcode
    let suburb_city = "";
    let postcode = "";
    if (formData.area.includes("(")) {
      suburb_city = formData.area.split("(")[0].trim();
      postcode = formData.area.match(/\(([^)]+)\)/)?.[1] || "";
    } else {
      suburb_city = formData.area;
    }

    const jobPayload = {
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

    let jobId: number | undefined;
    let error: any;

    if (editingJob) {
      const { data: updated, error: updateErr } = await supabase
        .from("job")
        .update(jobPayload as any)
        .eq("job_id", editingJob.job_id)
        .select("job_id")
        .single();
      error = updateErr;
      jobId = updated?.job_id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("job")
        .insert(jobPayload as any)
        .select("job_id")
        .single();
      error = insertErr;
      jobId = inserted?.job_id;
    }

    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }

    if (jobId && selectedLicenses.length > 0) {
      await supabase.from("job_license").delete().eq("job_id", jobId);
      const rows = selectedLicenses.map((lid) => ({ job_id: jobId, license_id: lid }));
      await supabase.from("job_license").insert(rows as any);
    }

    toast({
      title: editingJob ? "Job Updated" : "Job Posted",
      description: editingJob ? "Job updated successfully" : "Job posted successfully",
    });
    onBack();
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
                <h2 className="text-sm font-semibold mb-3">Job Role</h2>
                <Select
                  value={formData.jobRoleId.toString()}
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
                <h2 className="text-sm font-semibold mb-3">Description</h2>
                <Textarea
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  placeholder="Describe the role..."
                />
              </div>

              {/* Job Type */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">Job Type</h2>
                <Select
                  value={formData.jobType}
                  onValueChange={(val) => handleInputChange("jobType", val)}
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
                <h2 className="text-sm font-semibold mb-3">Salary Range</h2>
                <Select
                  value={formData.payRange}
                  onValueChange={(val) => handleInputChange("payRange", val)}
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
                <h2 className="text-sm font-semibold mb-3">Experience Required</h2>
                <Select
                  value={formData.experienceRange}
                  onValueChange={(val) => handleInputChange("experienceRange", val)}
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
                <h2 className="text-sm font-semibold mb-3">Location</h2>
                <Select
                  value={formData.state}
                  onValueChange={(val) => handleInputChange("state", val)}
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

                {formData.state && (
                  <Select
                    value={formData.area}
                    onValueChange={(val) => handleInputChange("area", val)}
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

              {/* Licenses */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">Required Licenses</h2>
                <Select
                  onValueChange={(val) => {
                    const id = parseInt(val, 10);
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

                <div className="flex flex-wrap mt-2 gap-2">
                  {selectedLicenses.map((id) => {
                    const license = licenses.find((l) => l.license_id === id);
                    return (
                      <span key={id} className="bg-slate-100 px-3 py-1 rounded-xl text-xs">
                        {license?.name}{" "}
                        <button
                          onClick={() =>
                            setSelectedLicenses((prev) => prev.filter((lid) => lid !== id))
                          }
                          className="text-red-500 ml-1"
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
                <h2 className="text-sm font-semibold mb-3">Job Status</h2>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Active / Inactive</span>
                  <Switch
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) =>
                      handleInputChange("status", checked ? "active" : "inactive")
                    }
                  />
                </div>
              </div>

              <div className="pb-6">
                <Button
                  onClick={handleSaveAndPost}
                  className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90 text-white rounded-xl h-12"
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
      </div>
    </div>
  );
};

export default PostJobForm;
