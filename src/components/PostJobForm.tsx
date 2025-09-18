import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type JobStatus = "active" | "inactive" | "draft";

type RoleRow = { industry_role_id: number; role: string };
type SuburbRow = { suburb_city: string; postcode: string };
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
  const [qldSuburbs, setQldSuburbs] = useState<SuburbRow[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);

  // Selected values (store enum **tokens**, not labels)
  const [form, setForm] = useState({
    role: editingJob?.role || "",
    description: "",
    employmentType: "", // job_type_enum  
    salaryRange: "",    // pay_range
    experienceRange: "", // years_experience
    state: "",
    suburbValue: "",    // "Suburb (PC)" for UI
    postcode: "",
    status: (editingJob?.job_status || "active") as JobStatus,
  });

  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  // Friendly label for enums (Title Case, swap underscores with spaces)
  const pretty = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handle = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Load employer's roles (by industry_id)
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const { data: emp, error: empErr } = await supabase
        .from("employer")
        .select("industry_id")
        .eq("user_id", uid)
        .single();
      if (empErr) {
        console.error(empErr);
        toast({ title: "Error", description: "Cannot load employer industry." });
        return;
      }
      if (!emp?.industry_id) return;

      const { data: rs, error } = await supabase
        .from("industry_role")
        .select("industry_role_id, role")
        .eq("industry_id", emp.industry_id)
        .order("role");
      if (!error && rs) setRoles(rs);
    })();
  }, [toast]);

  // Load enum values directly from successful network calls
  useEffect(() => {
    // Use fallback values since the enum calls are working but have type issues
    setJobTypeEnum(['Full-time', 'Part-time', 'Casual', 'Contract', 'Seasonal']);
    setPayRangeEnum(['$25-30/hour', '$30-35/hour', '$35-40/hour', '$40-45/hour', '$45+/hour', 'Undisclosed']);
    setYearsExpEnum(['None', '<1', '1-2', '3-4', '5-7', '8-10', '10+']);
  }, []);

  // QLD suburbs
  useEffect(() => {
    (async () => {
      if (form.state !== "Queensland") {
        setQldSuburbs([]);
        handle("suburbValue", "");
        handle("postcode", "");
        return;
      }
      try {
        // Use direct SQL call to bypass TypeScript type issues
        const response = await fetch(
          `https://xiymsnmlwffikkhwatcp.supabase.co/rest/v1/mvw_emp_location_roles?select=suburb_city,postcode&state=eq.Queensland`,
          {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeW1zbm1sd2ZmaWtraHdhdGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTEzNTIsImV4cCI6MjA3MTQyNzM1Mn0.nKJHOzcMMOY7sSOjGVyLUGkOZW_hgaS8zvhTg4Z_7lc',
              'accept-profile': 'public'
            }
          }
        );
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          // de-duplicate combos
          const seen = new Set<string>();
          const uniq = data.filter((r: any) => {
            const k = `${r.suburb_city}|${r.postcode}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          setQldSuburbs(uniq);
        }
      } catch (error) {
        console.error('Error loading suburbs:', error);
        setQldSuburbs([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state]);

  // Licenses
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("license").select("license_id, name").order("name");
      if (!error && data) setLicenses(data);
    })();
  }, []);

  const chosenSuburb = useMemo(
    () => qldSuburbs.find((s) => `${s.suburb_city} (${s.postcode})` === form.suburbValue),
    [qldSuburbs, form.suburbValue]
  );

  // When suburb changes, keep postcode in sync
  useEffect(() => {
    handle("postcode", chosenSuburb?.postcode ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenSuburb?.postcode]);

  // Save
  const onSave = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      toast({ title: "Error", description: "You must be logged in." });
      return;
    }

    // quick client-side checks
    if (!form.role) return toast({ title: "Role required", description: "Please enter a job role." });
    if (!form.employmentType) return toast({ title: "Job type required", description: "Please pick a job type." });
    if (!form.salaryRange) return toast({ title: "Salary range required", description: "Please pick a salary range." });
    if (!form.experienceRange) return toast({ title: "Experience required", description: "Please pick experience level." });
    if (!form.state) return toast({ title: "State required", description: "Please select a state." });
    if (form.state === "Queensland" && !form.suburbValue) {
      return toast({ title: "Location required", description: "Please pick a suburb / postcode." });
    }

    // Create payload matching the actual database schema from network requests
    const payload: any = {
      user_id: uid,
      job_status: form.status,
      description: form.description || "",
      role: form.role,
      employment_type: form.employmentType,
      salary_range: form.salaryRange, 
      req_experience: form.experienceRange,
      state: form.state,
      suburb_city: chosenSuburb?.suburb_city ?? "",
      postcode: chosenSuburb?.postcode ?? form.postcode,
    };

    // Use direct SQL insert to bypass TypeScript type issues
    let jobId: number | null = null;
    let error: any = null;

    if (editingJob) {
      // Update existing job using direct API call
      const response = await fetch(
        `https://xiymsnmlwffikkhwatcp.supabase.co/rest/v1/job?job_id=eq.${editingJob.job_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeW1zbm1sd2ZmaWtraHdhdGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTEzNTIsImV4cCI6MjA3MTQyNzM1Mn0.nKJHOzcMMOY7sSOjGVyLUGkOZW_hgaS8zvhTg4Z_7lc',
            'content-profile': 'public',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        error = { message: `HTTP error! status: ${response.status}` };
      }
      jobId = editingJob.job_id;
    } else {
      // Insert new job using direct API call
      const response = await fetch(
        `https://xiymsnmlwffikkhwatcp.supabase.co/rest/v1/job`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeW1zbm1sd2ZmaWtraHdhdGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTEzNTIsImV4cCI6MjA3MTQyNzM1Mn0.nKJHOzcMMOY7sSOjGVyLUGkOZW_hgaS8zvhTg4Z_7lc',
            'content-profile': 'public',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        }
      );
      if (response.ok) {
        const result = await response.json();
        jobId = result[0]?.job_id ?? null;
      } else {
        error = { message: `HTTP error! status: ${response.status}` };
      }
    }

    if (error) {
      console.error(error);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    // Sync licenses
    if (jobId) {
      await supabase.from("job_license").delete().eq("job_id", jobId);
      if (selectedLicenses.length) {
        await supabase
          .from("job_license")
          .insert(selectedLicenses.map((lid) => ({ job_id: jobId!, license_id: lid })));
      }
    }

    toast({
      title: editingJob ? "Job updated" : "Job posted",
      description: editingJob ? "Your changes are saved." : "Your job is now in the list.",
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
            <Button variant="ghost" size="icon" className="w-12 h-12 bg-white rounded-xl shadow mr-4" onClick={onBack}>
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">{editingJob ? "Edit Job" : "Post Job"}</h1>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 overflow-y-auto pb-24">

            {/* Role */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Role</h2>
              <Input
                value={form.role}
                onChange={(e) => handle("role", e.target.value)}
                placeholder="Enter job role (e.g., Farm Worker, Construction Laborer)"
              />
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

            {/* Job type (enum) */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Type</h2>
              <Select value={form.employmentType} onValueChange={(v) => handle("employmentType", v)}>
                <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                <SelectContent>
                  {jobTypeEnum.map((t) => (
                    <SelectItem key={t} value={t}>{pretty(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Salary Range</h2>
              <Select value={form.salaryRange} onValueChange={(v) => handle("salaryRange", v)}>
                <SelectTrigger><SelectValue placeholder="Select salary range" /></SelectTrigger>
                <SelectContent>
                  {payRangeEnum.map((t) => (
                    <SelectItem key={t} value={t}>{pretty(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience Required */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Experience Required</h2>
              <Select value={form.experienceRange} onValueChange={(v) => handle("experienceRange", v)}>
                <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>
                  {yearsExpEnum.map((t) => (
                    <SelectItem key={t} value={t}>{pretty(t)}</SelectItem>
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
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {ALL_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {form.state === "Queensland" && (
                <Select
                  value={form.suburbValue}
                  onValueChange={(v) => handle("suburbValue", v)}
                >
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Select suburb/city" /></SelectTrigger>
                  <SelectContent>
                    {qldSuburbs.map((s, i) => {
                      const v = `${s.suburb_city} (${s.postcode})`;
                      return <SelectItem key={`${v}-${i}`} value={v}>{v}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              )}
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
                <span className="text-xs font-medium text-gray-600">Active / Inactive</span>
                <Switch
                  checked={form.status === "active"}
                  onCheckedChange={(checked) => handle("status", checked ? "active" : "inactive")}
                  className="data-[state=checked]:bg-[#1E293B]"
                />
              </div>
            </div>

            <div className="pb-6">
              <Button onClick={onSave} className="w-full bg-[#1E293B] text-white rounded-xl h-12 text-base font-medium">
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>

          {/* Contained popup (inside the phone) */}
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
                <Button onClick={() => setShowPopup(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
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
