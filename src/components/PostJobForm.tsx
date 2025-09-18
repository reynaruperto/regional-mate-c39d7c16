import React, { useEffect, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const [roles, setRoles] = useState<{ industry_role_id: number; role: string }[]>([]);
  const [states, setStates] = useState<string[]>([
    "Queensland",
    "New South Wales",
    "Victoria",
    "Tasmania",
    "Western Australia",
    "South Australia",
    "Northern Territory",
    "Australian Capital Territory",
  ]);
  const [suburbs, setSuburbs] = useState<{ suburb_city: string; postcode: string }[]>([]);
  const [licenses, setLicenses] = useState<{ license_id: number; name: string }[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    jobRole: editingJob?.role || "",
    jobDescription: "",
    employmentType: "",
    salaryRange: "",
    experienceRange: "",
    state: "",
    suburb: "",
    postcode: "",
    startDate: "",
    status: editingJob?.job_status || "active",
  });

  const [showPopup, setShowPopup] = useState(false);

  // Fetch roles based on employer's industry
  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: emp } = await supabase
        .from("employer")
        .select("industry_id")
        .eq("user_id", user.id)
        .single();

      if (emp?.industry_id) {
        const { data: rolesData } = await supabase
          .from("industry_role")
          .select("industry_role_id, role")
          .eq("industry_id", emp.industry_id);

        if (rolesData) setRoles(rolesData);
      }
    };
    fetchRoles();
  }, []);

  // Fetch suburbs for QLD only
  useEffect(() => {
    const fetchSuburbs = async () => {
      if (formData.state !== "Queensland") {
        setSuburbs([]);
        return;
      }
      const { data } = await supabase
        .from("mvw_emp_location_roles")
        .select("suburb_city, postcode")
        .eq("state", "Queensland");
      if (data) setSuburbs(data);
    };
    fetchSuburbs();
  }, [formData.state]);

  // Fetch licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data } = await supabase.from("license").select("license_id, name");
      if (data) setLicenses(data);
    };
    fetchLicenses();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleLicense = (id: number) => {
    setSelectedLicenses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
      employment_type: formData.employmentType as any,
      salary_range: formData.salaryRange as any,
      req_experience: formData.experienceRange as any,
      state: formData.state,
      suburb_city: formData.suburb,
      postcode: formData.postcode,
      start_date: formData.startDate,
      job_status: formData.status as any,
      user_id: user.id,
    };

    let jobId: number | null = null;
    let error;

    if (editingJob) {
      const { error: updateError } = await supabase
        .from("job")
        .update(jobPayload)
        .eq("job_id", editingJob.job_id);
      error = updateError;
      jobId = editingJob.job_id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("job")
        .insert(jobPayload)
        .select("job_id")
        .single();
      error = insertError;
      jobId = inserted?.job_id || null;
    }

    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }

    // Insert licenses
    if (jobId && selectedLicenses.length > 0) {
      await supabase.from("job_license").delete().eq("job_id", jobId);
      const licenseRows = selectedLicenses.map((lid) => ({ job_id: jobId, license_id: lid }));
      await supabase.from("job_license").insert(licenseRows);
    }

    toast({
      title: editingJob ? "Job Updated" : "Job Posted",
      description: editingJob
        ? "Job has been successfully updated"
        : "Job has been successfully posted",
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
              <h2 className="text-sm font-semibold mb-3">Description</h2>
              <Textarea
                value={formData.jobDescription}
                onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                placeholder="Describe the role..."
              />
            </div>

            {/* Employment Type */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Type</h2>
              <Select
                value={formData.employmentType}
                onValueChange={(value) => handleInputChange("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Salary Range</h2>
              <Select
                value={formData.salaryRange}
                onValueChange={(value) => handleInputChange("salaryRange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salary range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25-30">$25-30</SelectItem>
                  <SelectItem value="30-35">$30-35</SelectItem>
                  <SelectItem value="35-40">$35-40</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Experience Required</h2>
              <Select
                value={formData.experienceRange}
                onValueChange={(value) => handleInputChange("experienceRange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 years</SelectItem>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5+">5+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Location</h2>
              <Select
                value={formData.state}
                onValueChange={(value) => {
                  if (value !== "Queensland") {
                    setShowPopup(true);
                    handleInputChange("state", value);
                  } else {
                    handleInputChange("state", value);
                  }
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

              {formData.state === "Queensland" && (
                <Select
                  value={formData.suburb}
                  onValueChange={(value) => {
                    const suburb = suburbs.find((s) => `${s.suburb_city} (${s.postcode})` === value);
                    handleInputChange("suburb", suburb?.suburb_city || "");
                    handleInputChange("postcode", suburb?.postcode || "");
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select suburb/city" />
                  </SelectTrigger>
                  <SelectContent>
                    {suburbs.map((s, idx) => (
                      <SelectItem key={idx} value={`${s.suburb_city} (${s.postcode})`}>
                        {s.suburb_city} ({s.postcode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Start Date */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Start Date</h2>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>

            {/* Licenses */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Licenses</h2>
              <div className="flex flex-col gap-2">
                {licenses.map((l) => (
                  <label key={l.license_id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLicenses.includes(l.license_id)}
                      onChange={() => handleToggleLicense(l.license_id)}
                    />
                    {l.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Job Status */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Status</h2>
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

            {/* Save Button */}
            <div className="pb-6">
              <Button
                onClick={handleSaveAndPost}
                className="w-full bg-[#1E293B] text-white rounded-xl h-12 text-base font-medium"
              >
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>

          {/* Popup for unavailable states */}
          {showPopup && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold mb-2">These functions are for future phases</h2>
                <p className="text-gray-600 mb-6">We’ll be back</p>
                <Button onClick={() => setShowPopup(false)} className="w-full bg-slate-800 text-white">
                  Got It
                </Button>
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobForm;
