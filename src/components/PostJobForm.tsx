import React, { useEffect, useMemo, useState } from "react";
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

type JobStatus = "active" | "inactive" | "draft";

type RoleRow = { industry_role_id: number; industry_role: string };
type SuburbRow = { suburb_city: string; postcode: string; state: string };
type LicenseRow = { license_id: number; name: string };

const ALL_STATES = [
  "Queensland",
  "New South Wales",
  "Victoria",
  "Tasmania",
  "Western Australia",
  "South Australia",
  "Northern Territory",
  "Australian Capital Territory",
];

interface PostJobFormProps {
  onBack: () => void;
  editingJob?: {
    job_id: number;
    role: string;
    job_status: JobStatus;
  } | null;
}

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();

  // UI lists
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [jobTypeEnum, setJobTypeEnum] = useState<string[]>([]);
  const [payRangeEnum, setPayRangeEnum] = useState<string[]>([]);
  const [yearsExpEnum, setYearsExpEnum] = useState<string[]>([]);
  const [locations, setLocations] = useState<SuburbRow[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);

  // Selected values
  const [form, setForm] = useState({
    industryRoleId: "",
    industryRoleName: editingJob?.role || "",
    description: "",
    employmentType: "",
    salaryRange: "",
    experienceRange: "",
    state: "",
    suburbValue: "",
    postcode: "",
    status: (editingJob?.job_status || "active") as JobStatus,
    startDate: "",
  });

  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const pretty = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handle = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Load roles + locations from mvw_emp_location_roles
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

      if (!emp?.industry_id) return;

      const { data, error } = await supabase
        .from("mvw_emp_location_roles")
        .select("industry_role_id, industry_role, state, suburb_city, postcode")
        .eq("industry_id", emp.industry_id);

      if (!error && data) {
        const roleMap = new Map<number, string>();
        data.forEach((r) =>
          roleMap.set(r.industry_role_id, r.industry_role)
        );
        setRoles(
          Array.from(roleMap, ([industry_role_id, industry_role]) => ({
            industry_role_id,
            industry_role,
          }))
        );

        setLocations(data); // keep for suburbs
      }
    })();
  }, []);

  // Load enums via helper RPCs
  useEffect(() => {
    (async () => {
      const { data: jt } = await supabase.rpc("get_job_type_enum");
      const { data: pr } = await supabase.rpc("get_pay_range_enum");
      const { data: ye } = await supabase.rpc("get_years_experience_enum");

      if (jt) setJobTypeEnum(jt);
      if (pr) setPayRangeEnum(pr);
      if (ye) setYearsExpEnum(ye);
    })();
  }, []);

  // Licenses
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("license")
        .select("license_id, name")
        .order("name");
      if (!error && data) setLicenses(data);
    })();
  }, []);

  const chosenSuburb = useMemo(
    () =>
      locations.find(
        (s) => `${s.suburb_city} (${s.postcode})` === form.suburbValue
      ),
    [locations, form.suburbValue]
  );

  useEffect(() => {
    handle("postcode", chosenSuburb?.postcode ?? "");
  }, [chosenSuburb?.postcode]);

  // Save
  const onSave = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      toast({ title: "Error", description: "You must be logged in." });
      return;
    }

    if (!form.industryRoleId || isNaN(Number(form.industryRoleId))) {
      return toast({ title: "Role required", description: "Pick a job role." });
    }
    if (!form.employmentType)
      return toast({ title: "Job type required", description: "Pick job type." });
    if (!form.salaryRange)
      return toast({ title: "Salary required", description: "Pick a range." });
    if (!form.experienceRange)
      return toast({ title: "Experience required", description: "Pick level." });
    if (!form.state)
      return toast({ title: "State required", description: "Select a state." });

    const payload = {
      user_id: uid,
      job_status: form.status,
      industry_role_id: Number(form.industryRoleId), // ✅ guaranteed number
      description: form.description,
      employment_type: form.employmentType,
      salary_range: form.salaryRange,
      req_experience: form.experienceRange,
      state: form.state,
      suburb_city: chosenSuburb?.suburb_city ?? "",
      postcode: chosenSuburb?.postcode ?? form.postcode,
      start_date: form.startDate || null,
    };

    let jobId: number | null = null;
    let error: any = null;

    if (editingJob) {
      const { error: upd } = await supabase
        .from("job")
        .update(payload)
        .eq("job_id", editingJob.job_id);
      error = upd;
      jobId = editingJob.job_id;
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("job")
        .insert(payload)
        .select("job_id")
        .single();
      error = insErr;
      jobId = ins?.job_id ?? null;
    }

    if (error) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Sync licenses safely
    if (jobId) {
      await supabase.from("job_license").delete().eq("job_id", jobId);
      if (selectedLicenses.length) {
        const licenseRows = selectedLicenses
          .filter((lid) => typeof lid === "number" && !isNaN(lid))
          .map((lid) => ({
            job_id: jobId!,
            license_id: lid,
          }));
        if (licenseRows.length) {
          await supabase.from("job_license").insert(licenseRows);
        }
      }
    }

    toast({
      title: editingJob ? "Job updated" : "Job posted",
      description: editingJob
        ? "Your changes are saved."
        : "Your job is now in the list.",
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-30" />

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
          <div className="flex-1 px-6 overflow-y-auto pb-24">
            {/* Role */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Role</h2>
              <Select
                value={form.industryRoleId}
                onValueChange={(v) => {
                  const row = roles.find(
                    (r) => String(r.industry_role_id) === v
                  );
                  handle("industryRoleId", v);
                  handle("industryRoleName", row?.industry_role ?? "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem
                      key={r.industry_role_id}
                      value={String(r.industry_role_id)}
                    >
                      {r.industry_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Description</h2>
              <Textarea
                value={form.description}
                onChange={(e) => handle("description", e.target.value)}
                placeholder="Describe the role..."
                className="min-h-[80px]"
              />
            </div>

            {/* Job type */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Type</h2>
              <Select
                value={form.employmentType}
                onValueChange={(v) => handle("employmentType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypeEnum.map((t) => (
                    <SelectItem key={t} value={t}>
                      {pretty(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Salary Range</h2>
              <Select
                value={form.salaryRange}
                onValueChange={(v) => handle("salaryRange", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salary range" />
                </SelectTrigger>
                <SelectContent>
                  {payRangeEnum.map((t) => (
                    <SelectItem key={t} value={t}>
                      {pretty(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Experience Required</h2>
              <Select
                value={form.experienceRange}
                onValueChange={(v) => handle("experienceRange", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {yearsExpEnum.map((t) => (
                    <SelectItem key={t} value={t}>
                      {pretty(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Location</h2>
              <Select
                value={form.state}
                onValueChange={(v) => {
                  handle("state", v);
                  if (v !== "Queensland") setShowPopup(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {form.state === "Queensland" && (
                <Select
                  value={form.suburbValue}
                  onValueChange={(v) => handle("suburbValue", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select suburb/city" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((l) => l.state === "Queensland")
                      .map((s, i) => {
                        const v = `${s.suburb_city} (${s.postcode})`;
                        return (
                          <SelectItem key={`${v}-${i}`} value={v}>
                            {v}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Start date */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Start Date</h2>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => handle("startDate", e.target.value)}
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
                      onChange={() =>
                        setSelectedLicenses((prev) =>
                          prev.includes(l.license_id)
                            ? prev.filter((id) => id !== l.license_id)
                            : [...prev, l.license_id]
                        )
                      }
                    />
                    <span>{l.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Status</h2>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">
                  Active / Inactive
                </span>
                <Switch
                  checked={form.status === "active"}
                  onCheckedChange={(checked) =>
                    handle("status", checked ? "active" : "inactive")
                  }
                  className="data-[state=checked]:bg-[#1E293B]"
                />
              </div>
            </div>

            <div className="pb-6">
              <Button
                onClick={onSave}
                className="w-full bg-[#1E293B] text-white rounded-xl h-12 text-base font-medium"
              >
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>

          {/* Popup */}
          {showPopup && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 w-[85%] max-w-sm shadow-xl">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  These functions are for future phases
                </h2>
                <p className="text-gray-600 text-center mb-6">We’ll be back</p>
                <Button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Got It
                </Button>
              </div>
            </div>
          )}

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
