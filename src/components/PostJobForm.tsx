// src/components/PostJobForm.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Use the inline (no-portal) Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-inline";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type JobStatus = "active" | "inactive" | "draft";

type RoleRow = { industry_role_id: number; industry_role: string };
type LocationRow = { state: string; suburb_city: string; postcode: string };
type LicenseRow = { license_id: number; name: string };

interface PostJobFormProps {
  onBack: () => void;
  editingJob?: any | null;
}

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [payRangeEnum, setPayRangeEnum] = useState<string[]>([]);
  const [yearsExpEnum, setYearsExpEnum] = useState<string[]>([]);
  const [employmentTypeEnum, setEmploymentTypeEnum] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [industryId, setIndustryId] = useState<number | null>(null);

  const [form, setForm] = useState({
    job_id: editingJob?.job_id || null,
    industryRoleId: editingJob?.industry_role_id
      ? String(editingJob.industry_role_id)
      : "",
    description: editingJob?.description || "",
    employmentType: editingJob?.employment_type || "",
    salaryRange: editingJob?.salary_range || "",
    experienceRange: editingJob?.req_experience || "",
    state: editingJob?.state || "",
    suburbValue: editingJob?.suburb_city
      ? `${editingJob.suburb_city} (${editingJob.postcode})`
      : "",
    postcode: editingJob?.postcode || "",
    status: (editingJob?.job_status || "draft") as JobStatus,
    startDate: editingJob?.start_date || "",
    licenses: (editingJob?.licenses as number[]) || [],
  });

  const [selectedLicenses, setSelectedLicenses] = useState<number[]>(
    (editingJob?.licenses as number[]) || []
  );

  const handle = (k: keyof typeof form, v: string) => {
    setForm((prev) => {
      const updated = { ...prev, [k]: v };
      autosave(updated);
      return updated;
    });
  };

  const autosave = async (draft: any) => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    const payload = {
      user_id: uid,
      job_status: draft.status,
      industry_role_id: draft.industryRoleId
        ? Number(draft.industryRoleId)
        : null,
      description: draft.description,
      employment_type: draft.employmentType,
      salary_range: draft.salaryRange,
      req_experience: draft.experienceRange,
      state: draft.state,
      suburb_city: draft.suburbValue ? draft.suburbValue.split(" (")[0] : "",
      postcode: draft.postcode,
      start_date:
        draft.startDate && draft.startDate.trim() !== ""
          ? draft.startDate
          : null,
    };

    let jobId = draft.job_id;

    if (jobId) {
      await supabase.from("job").update(payload).eq("job_id", jobId);
    } else {
      const { data, error } = await supabase
        .from("job")
        .insert({ ...payload, job_status: "draft" })
        .select("job_id")
        .single();
      if (error) return;
      jobId = data?.job_id;
      setForm((p) => ({ ...p, job_id: jobId }));
    }

    if (jobId) {
      await supabase.from("job_license").delete().eq("job_id", jobId);
      if (draft.licenses?.length) {
        await supabase.from("job_license").insert(
          draft.licenses.map((lid: number) => ({
            job_id: jobId,
            license_id: lid,
          }))
        );
      }
    }
  };

  const onSave = async () => {
    if (!form.industryRoleId) {
      toast({
        title: "Missing Job Role",
        description: "Please select a role before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!form.startDate || form.startDate.trim() === "") {
      toast({
        title: "Missing Start Date",
        description: "Please select a start date.",
        variant: "destructive",
      });
      return;
    }
    if (!form.postcode || !form.suburbValue) {
      toast({
        title: "Missing Location",
        description: "Please select a location.",
        variant: "destructive",
      });
      return;
    }
    await autosave({ ...form, status: "active" });
    toast({
      title: editingJob ? "Job updated" : "Job posted",
      description: editingJob
        ? "Your changes are saved."
        : "Your job is now active.",
    });
    onBack();
  };

  // enums
  useEffect(() => {
    setPayRangeEnum([
      "$25-30/hour",
      "$30-35/hour",
      "$35-40/hour",
      "$40-45/hour",
      "$45+/hour",
      "Undisclosed",
    ]);
    setYearsExpEnum(["None", "<1", "1-2", "3-4", "5-7", "8-10", "10"]);
    setEmploymentTypeEnum([
      "Full-time",
      "Part-time",
      "Contract",
      "Casual",
      "Seasonal",
    ]);
  }, []);

  // fetch employer industry id
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const { data: emp } = await supabase
        .from("employer")
        .select("industry_id")
        .eq("user_id", uid)
        .single();

      if (emp?.industry_id) setIndustryId(emp.industry_id);
    })();
  }, []);

  // load roles (map `role` -> `industry_role` to satisfy RoleRow)
  useEffect(() => {
    if (!industryId) return;
    (async () => {
      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role")
        .eq("industry_id", industryId);

      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            industry_role_id: r.industry_role_id,
            industry_role: r.role,
          }))
        );
      }
    })();
  }, [industryId]);

  // load locations
  useEffect(() => {
    if (!industryId) return;
    (async () => {
      const { data } = await supabase
        .from("visa_work_location_rules")
        .select("state, suburb_city, postcode")
        .eq("industry_id", industryId);
      if (data) {
        const unique = Array.from(
          new Map(
            data.map((loc) => [`${loc.suburb_city}-${loc.postcode}`, loc])
          ).values()
        );
        setLocations(unique);
      }
    })();
  }, [industryId]);

  // load licenses
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("license")
        .select("license_id, name")
        .order("name");
      if (data) setLicenses(data);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white rounded-xl shadow mr-4"
              onClick={onBack}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {editingJob ? "Edit Job" : "Post Job"}
            </h1>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 overflow-y-auto pb-24 text-sm">
            {/* Role */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Job Role *</h2>
              <Select
                value={form.industryRoleId}
                onValueChange={(v) => handle("industryRoleId", v)}
              >
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="max-h-48 text-sm py-1">
                  {roles.map((r) => (
                    <SelectItem
                      key={r.industry_role_id}
                      value={String(r.industry_role_id)}
                      className="py-2 px-3"
                    >
                      {r.industry_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Description *</h2>
              <Textarea
                value={form.description}
                onChange={(e) => handle("description", e.target.value)}
                placeholder="Describe the role..."
                className="text-sm"
              />
            </div>

            {/* Employment Type */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Employment Type *</h2>
              <Select
                value={form.employmentType}
                onValueChange={(v) => handle("employmentType", v)}
              >
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent className="max-h-48 text-sm py-1">
                  {employmentTypeEnum.map((t) => (
                    <SelectItem key={t} value={t} className="py-2 px-3">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Salary Range *</h2>
              <Select
                value={form.salaryRange}
                onValueChange={(v) => handle("salaryRange", v)}
              >
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select salary range" />
                </SelectTrigger>
                <SelectContent className="max-h-48 text-sm py-1">
                  {payRangeEnum.map((t) => (
                    <SelectItem key={t} value={t} className="py-2 px-3">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Experience Required *</h2>
              <Select
                value={form.experienceRange}
                onValueChange={(v) => handle("experienceRange", v)}
              >
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className="max-h-48 text-sm py-1">
                  {yearsExpEnum.map((t) => (
                    <SelectItem key={t} value={t} className="py-2 px-3">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Location *</h2>
              <Select
                value={form.suburbValue}
                onValueChange={(v) => {
                  const chosen = locations.find(
                    (loc) => `${loc.suburb_city} (${loc.postcode})` === v
                  );
                  handle("suburbValue", v);
                  handle("state", chosen?.state || "");
                  handle("postcode", chosen?.postcode || "");
                }}
              >
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="max-h-48 text-sm py-1">
                  {locations.map((l, idx) => (
                    <SelectItem
                      key={`${l.suburb_city}-${l.postcode}-${idx}`}
                      value={`${l.suburb_city} (${l.postcode})`}
                      className="py-2 px-3"
                    >
                      {l.suburb_city}, {l.state} {l.postcode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Start Date *</h2>
              <input
                type="date"
                className="w-full border rounded-lg p-2 text-sm"
                value={form.startDate}
                onChange={(e) => handle("startDate", e.target.value)}
                required
              />
            </div>

            {/* Licenses */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Licenses</h2>
              {licenses.map((l) => (
                <label
                  key={l.license_id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedLicenses.includes(l.license_id)}
                    onChange={() => {
                      setSelectedLicenses((prev) => {
                        const updatedLicenses = prev.includes(l.license_id)
                          ? prev.filter((id) => id !== l.license_id)
                          : [...prev, l.license_id];

                        setForm((prevForm) => {
                          const updated = {
                            ...prevForm,
                            licenses: updatedLicenses,
                          };
                          autosave(updated);
                          return updated;
                        });

                        return updatedLicenses;
                      });
                    }}
                  />
                  <span>{l.name}</span>
                </label>
              ))}
            </div>

            {/* Save */}
            <div className="pb-6">
              <Button
                onClick={onSave}
                className="w-full bg-[#1E293B] text-white rounded-xl h-12 text-sm"
              >
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobForm;
