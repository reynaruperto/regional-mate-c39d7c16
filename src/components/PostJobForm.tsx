import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    job_status: "active" | "inactive" | "draft" | "closed";
  } | null;
}

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();
  const employerProfile = getEmployerProfile();
  const employerIndustryId = employerProfile?.industry;

  const [roles, setRoles] = useState<{ industry_role_id: number; role: string }[]>([]);
  const [jobTypes, setJobTypes] = useState<{ type_id: number; type: string }[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

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

  // Fetch dropdown options from Supabase
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        if (employerIndustryId) {
          const { data: rolesData } = await supabase
            .from("industry_role")
            .select("industry_role_id, role")
            .eq("industry_id", parseInt(employerIndustryId));
          if (rolesData) setRoles(rolesData);
        }

        const { data: jobTypeData } = await supabase.from("job_type").select("type_id, type");
        if (jobTypeData) setJobTypes(jobTypeData);

        // Hard-coded enum values for now
        setPayRanges(["$25-30", "$30-35", "$35-40", "$40-45", "$45-50", "$50+"]);
        setExperienceRanges(["0-1 years", "1-3 years", "3-5 years", "5+ years"]);
        setStates(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
      } catch (err) {
        console.error("Error loading dropdowns:", err);
      }
    };
    fetchDropdowns();
  }, [employerIndustryId]);

  // Fetch areas when state changes
  useEffect(() => {
    const fetchAreas = async () => {
      if (!formData.state) return;
      const { data } = await supabase
        .from("region_rules")
        .select("area")
        .eq("state", formData.state);
      if (data) {
        const uniqueAreas = [...new Set(data.map((d) => d.area))];
        setAreas(uniqueAreas);
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

    const jobPayload = {
      role: formData.jobRole,
      description: formData.jobDescription,
      job_type: formData.jobType as any,
      min_rate: formData.payRange as any,
      max_rate: formData.payRange as any,
      pay_type: "hourly" as any,
      req_experience: formData.experienceRange as any,
      job_status: formData.status as any,
      user_id: user.id,
    };

    let error;
    if (editingJob) {
      const { error: updateError } = await supabase
        .from("job")
        .update(jobPayload)
        .eq("job_id", editingJob.job_id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("job")
        .insert(jobPayload);
      error = insertError;
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
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
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

              {/* Role */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Role</h2>
                <Select
                  value={formData.jobRole}
                  onValueChange={(value) => handleInputChange("jobRole", value)}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-9">
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

              {/* Job Type */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Type</h2>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) => handleInputChange("jobType", value)}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-9">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt) => (
                      <SelectItem key={jt.type_id} value={jt.type}>
                        {jt.type}
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
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-9">
                    <SelectValue placeholder="Select pay range" />
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

              {/* Experience Range */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Experience Required</h2>
                <Select
                  value={formData.experienceRange}
                  onValueChange={(value) => handleInputChange("experienceRange", value)}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-9">
                    <SelectValue placeholder="Select experience range" />
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
                  onValueChange={(value) => handleInputChange("state", value)}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-9">
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
                    <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-9 mt-2">
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

              {/* Job Status */}
              <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Status</h2>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    Active / Inactive
                  </span>
                  <Switch
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) =>
                      handleInputChange("status", checked ? "active" : "inactive")
                    }
                    className="data-[state=checked]:bg-[#1E293B]"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pb-6">
                <Button
                  onClick={handleSaveAndPost}
                  className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90 text-white rounded-xl h-12 text-base font-medium"
                >
                  {editingJob ? "Update Job" : "Post Job"}
                </Button>
              </div>
            </div>

            {/* Bottom Navigation */}
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
