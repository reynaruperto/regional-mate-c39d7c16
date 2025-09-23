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
  editingJob?: any | null;
}

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [payRangeEnum, setPayRangeEnum] = useState<string[]>([]);
  const [yearsExpEnum, setYearsExpEnum] = useState<string[]>([]);
  const [jobTypeEnum, setJobTypeEnum] = useState<string[]>([]);
  const [locations, setLocations] = useState<SuburbRow[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);

  const [form, setForm] = useState({
    job_id: editingJob?.job_id || null,
    industryRoleId: editingJob?.industry_role_id?.toString() || "",
    industryRoleName: editingJob?.role || "",
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
  });

  const [selectedLicenses, setSelectedLicenses] = useState<number[]>(
    editingJob?.licenses || []
  );
  const [showPopup, setShowPopup] = useState(false);

  const handle = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    autosave({ ...form, [k]: v });
  };

  // ✅ Autosave Draft Function
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
      suburb_city: draft.suburbValue.split(" (")[0] || "",
      postcode: draft.postcode,
      start_date: draft.startDate || null,
    };

    if (draft.job_id) {
      await supabase.from("job").update(payload).eq("job_id", draft.job_id);
    } else {
      const { data } = await supabase
        .from("job")
        .insert({ ...payload, job_status: "draft" })
        .select("job_id")
        .single();
      if (data?.job_id) setForm((p) => ({ ...p, job_id: data.job_id }));
    }

    // Sync licenses
    if (draft.job_id) {
      await supabase.from("job_license").delete().eq("job_id", draft.job_id);
      if (selectedLicenses.length) {
        await supabase.from("job_license").insert(
          selectedLicenses.map((lid) => ({
            job_id: draft.job_id,
            license_id: lid,
          }))
        );
      }
    }
  };

  // ✅ Final Save = Publish
  const onSave = async () => {
    await autosave({ ...form, status: "active" });
    toast({
      title: editingJob ? "Job updated" : "Job posted",
      description: editingJob
        ? "Your changes are saved."
        : "Your job is now active.",
    });
    onBack();
  };

  // Load enums (hardcoded from Supabase definition)
  useEffect(() => {
    setJobTypeEnum(["Full-time", "Part-time", "Casual", "Contract"]);

    setPayRangeEnum([
      "$25-30/hour",
      "$30-35/hour",
      "$35-40/hour",
      "$40-45/hour",
      "$45+/hour",
      "Undisclosed",
    ]);

    setYearsExpEnum(["None", "<1", "1-2", "3-4", "5-7", "8-10", "10+"]);
  }, []);

  // Load roles + locations from materialized view
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const { data: emp, error: empError } = await supabase
        .from("employer")
        .select("industry_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (empError) {
        console.error("Error fetching employer:", empError);
        return;
      }

      if (!emp?.industry_id) return;

      const { data: roleData, error } = await supabase
        .from("mvw_emp_location_roles")
        .select("industry_role_id, industry_role, state, suburb_city, postcode", {
          distinct: true,
        })
        .eq("industry_id", emp.industry_id)
        .order("industry_role")
        .range(0, 39999);

      if (error) {
        console.error("Error fetching roles:", error);
      }

      if (roleData) {
        setRoles(roleData);

        // Deduplicate locations
        const locMap = new Map<string, SuburbRow>();
        roleData.forEach((r) => {
          const key = `${r.suburb_city}-${r.postcode}`;
          if (!locMap.has(key)) {
            locMap.set(key, {
              suburb_city: r.suburb_city,
              postcode: r.postcode,
              state: r.state,
            });
          }
        });
        setLocations(Array.from(locMap.values()));
      }
    })();
  }, []);

  // Load licenses
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("license")
        .select("license_id, name")
        .order("name");
      if (data) setLicenses(data);
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

  const handleStateChange = (state: string) => {
    if (state !== "Queensland") {
      setShowPopup(true);
      return;
    }
    handle("state", state);
  };

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
          <div className="flex-1 px-6 overflow-y-auto pb-24">
            {/* Role */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Job Role</h2>
              <Select
                value={form.industryRoleId}
                onValueChange={(v) => handle("industryRoleId", v)}
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
                      {t}
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
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">
                Years of Work Experience Required
              </h2>
              <Select
                value={form.experienceRange}
                onValueChange={(v) => handle("experienceRange", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select years of work experience" />
                </SelectTrigger>
                <SelectContent>
                  {yearsExpEnum.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">State</h2>
              <Select value={form.state} onValueChange={handleStateChange}>
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
            </div>

            {/* Suburb + Postcode */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Location</h2>
              <Select
                value={form.suburbValue}
                onValueChange={(v) => handle("suburbValue", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select suburb/postcode" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l, idx) => (
                    <SelectItem
                      key={`${l.suburb_city}-${l.postcode}-${idx}`}
                      value={`${l.suburb_city} (${l.postcode})`}
                    >
                      {`${l.suburb_city} (${l.postcode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Licenses */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Licenses Required</h2>
              {licenses.map((l) => (
                <label key={l.license_id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLicenses.includes(l.license_id)}
                    onChange={() => {
                      const newLicenses = selectedLicenses.includes(l.license_id)
                        ? selectedLicenses.filter((id) => id !== l.license_id)
                        : [...selectedLicenses, l.license_id];
                      setSelectedLicenses(newLicenses);
                      autosave({ ...form, licenses: newLicenses });
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
                className="w-full bg-[#1E293B] text-white rounded-xl h-12"
              >
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white">
            <BottomNavigation />
          </div>

          {/* Popup */}
          {showPopup && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
                <h2 className="text-lg font-semibold mb-3">Not Eligible</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Only Queensland is eligible at this time.
                </p>
                <Button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-slate-800 text-white rounded-lg"
                >
                  OK
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostJobForm;
