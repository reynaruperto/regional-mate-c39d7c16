import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
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

interface PostJobFormProps {
  onBack: () => void;
  editingJob?: {
    job_id: number;
    role: string;
    job_status: "active" | "inactive" | "draft";
    industry_role_id?: number | null;
    type_id?: number | null;
    salary_range?: string | null;
    req_experience?: string | null;
    state_suburb_id?: number | null;
    start_date?: string | null; // YYYY-MM-DD
    description?: string | null;
  } | null;
}

type RoleRow = { industry_role_id: number; role: string };
type JobTypeRow = { type_id: number; type: string };
type SuburbRow = { id: number; sa3name: string };

const STATES = [
  "Queensland",
  "New South Wales",
  "Victoria",
  "South Australia",
  "Western Australia",
  "Tasmania",
  "Northern Territory",
  "Australian Capital Territory",
];

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack, editingJob }) => {
  const { toast } = useToast();

  // dropdowns
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeRow[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [experienceRanges, setExperienceRanges] = useState<string[]>([]);
  const [qldSuburbs, setQldSuburbs] = useState<SuburbRow[]>([]);
  const [loading, setLoading] = useState(true);

  // popup for future states
  const [showFuturePopup, setShowFuturePopup] = useState(false);

  // form state (store ids as strings for Select)
  const [formData, setFormData] = useState({
    roleId: "",               // industry_role_id (string)
    roleText: "",             // redundant but saved to job.role (text)
    description: "",
    jobTypeId: "",            // job_type.type_id (string)
    payRange: "",             // enum value
    experienceRange: "",      // enum value
    state: "",
    stateSuburbId: "",        // state_suburb.id (string)
    status: (editingJob?.job_status ?? "active") as "active" | "inactive" | "draft",
    startDate: editingJob?.start_date ?? todayISO(),
  });

  // load employer industry, roles, job types, enums, suburbs (QLD only)
  useEffect(() => {
    const loadAll = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          toast({ title: "Not signed in", description: "Please sign in first.", variant: "destructive" });
          onBack();
          return;
        }

        // 1) employer industry_id
        const { data: emp, error: empErr } = await supabase
          .from("employer")
          .select("industry_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (empErr) throw empErr;

        // 2) Roles for employer industry
        if (emp?.industry_id) {
          const { data: rolesData, error: rolesErr } = await supabase
            .from("industry_role")
            .select("industry_role_id, role")
            .eq("industry_id", emp.industry_id)
            .order("role", { ascending: true });

          if (rolesErr) throw rolesErr;
          setRoles(rolesData ?? []);
        } else {
          setRoles([]);
        }

        // 3) Job types (table)
        const { data: jtData, error: jtErr } = await supabase
          .from("job_type")
          .select("type_id, type")
          .order("type", { ascending: true });
        if (jtErr) throw jtErr;
        setJobTypes(jtData ?? []);

        // 4) Enums via RPC with safe fallbacks
        let payEnum: string[] = [];
        try {
          const { data } = await supabase.rpc("get_enum_values", { enum_name: "pay_range" });
          payEnum = data ?? [];
        } catch {
          payEnum = ["$25-30/hour", "$30-35/hour", "$35-40/hour", "$40-45/hour", "$45+/hour"];
        }
        setPayRanges(payEnum);

        let expEnum: string[] = [];
        try {
          const { data } = await supabase.rpc("get_enum_values", { enum_name: "years_experience" });
          expEnum = data ?? [];
        } catch {
          expEnum = ["0-1 years", "1-3 years", "3-5 years", "5+ years"];
        }
        setExperienceRanges(expEnum);

        // 5) QLD suburbs (state_suburb)
        const { data: suburbs, error: ssErr } = await supabase
          .from("state_suburb")
          .select("id, sa3name, state")
          .eq("state", "Queensland")
          .order("sa3name", { ascending: true });
        if (ssErr) throw ssErr;
        setQldSuburbs((suburbs ?? []).map((s) => ({ id: Number(s.id), sa3name: s.sa3name as string })));

        // 6) If editing, prefill
        if (editingJob) {
          // fetch role text if needed
          let roleText = editingJob.role ?? "";
          if (!roleText && editingJob.industry_role_id) {
            const { data: r } = await supabase
              .from("industry_role")
              .select("role")
              .eq("industry_role_id", editingJob.industry_role_id)
              .maybeSingle();
            roleText = r?.role ?? "";
          }

          setFormData((prev) => ({
            ...prev,
            roleId: editingJob.industry_role_id ? String(editingJob.industry_role_id) : "",
            roleText,
            description: editingJob.description ?? "",
            jobTypeId: editingJob.type_id ? String(editingJob.type_id) : "",
            payRange: editingJob.salary_range ?? "",
            experienceRange: editingJob.req_experience ?? "",
            // if job has state_suburb_id and it belongs to QLD, we'll show it
            state: editingJob.state_suburb_id ? "Queensland" : "",
            stateSuburbId: editingJob.state_suburb_id ? String(editingJob.state_suburb_id) : "",
            status: editingJob.job_status,
            startDate: editingJob.start_date ?? todayISO(),
          }));
        }
      } catch (e: any) {
        console.error(e);
        toast({ title: "Error loading data", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleTextFromId = useMemo(() => {
    if (!formData.roleId) return "";
    const r = roles.find((x) => String(x.industry_role_id) === formData.roleId);
    return r?.role ?? "";
  }, [formData.roleId, roles]);

  const onSave = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in first.", variant: "destructive" });
        return;
      }

      // basic validation
      if (!formData.roleId) {
        toast({ title: "Missing role", description: "Please select a job role.", variant: "destructive" });
        return;
      }
      if (!formData.startDate) {
        toast({ title: "Missing start date", description: "Please select a start date.", variant: "destructive" });
        return;
      }

      const payload = {
        role: roleTextFromId || formData.roleText || "",
        description: formData.description || "",
        job_status: formData.status as "active" | "inactive" | "draft",
        user_id: user.id,
        industry_role_id: Number(formData.roleId),
        type_id: formData.jobTypeId ? Number(formData.jobTypeId) : null,
        salary_range: formData.payRange || null,
        req_experience: formData.experienceRange || null,
        state_suburb_id: formData.state === "Queensland" && formData.stateSuburbId ? Number(formData.stateSuburbId) : null,
        start_date: formData.startDate,
      };

      let error;
      if (editingJob?.job_id) {
        const { error: upErr } = await supabase.from("job").update(payload).eq("job_id", editingJob.job_id);
        error = upErr;
      } else {
        const { error: inErr } = await supabase.from("job").insert(payload);
        error = inErr;
      }

      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        return;
      }

      toast({
        title: editingJob ? "Job updated" : "Job posted",
        description: editingJob ? "Your job has been updated." : "Your job has been posted.",
      });
      onBack();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Unexpected error", description: e.message, variant: "destructive" });
    }
  };

  const handleStateChange = (value: string) => {
    if (value !== "Queensland") {
      setShowFuturePopup(true);
      return;
    }
    setFormData((p) => ({ ...p, state: value, stateSuburbId: "" }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex items-center justify-center">
            <div className="text-gray-500">Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* Phone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-2" />

          {/* Header */}
          <div className="px-6 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-gray-100 rounded-xl shadow-sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {editingJob ? "Edit Job" : "Post Job"}
            </h1>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 overflow-y-auto pb-24 bg-gray-100">
            {/* Job Role */}
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Role</h2>
              <Select
                value={formData.roleId}
                onValueChange={(val) => setFormData((p) => ({ ...p, roleId: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.industry_role_id} value={String(r.industry_role_id)}>
                      {r.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Description</h2>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role…"
                className="bg-gray-50 border-gray-200 rounded-xl text-sm min-h-[80px] resize-none"
              />
            </div>

            {/* Job Type */}
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Type</h2>
              <Select
                value={formData.jobTypeId}
                onValueChange={(val) => setFormData((p) => ({ ...p, jobTypeId: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((jt) => (
                    <SelectItem key={jt.type_id} value={String(jt.type_id)}>
                      {jt.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Salary Range</h2>
              <Select
                value={formData.payRange}
                onValueChange={(val) => setFormData((p) => ({ ...p, payRange: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10">
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
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Experience Required</h2>
              <Select
                value={formData.experienceRange}
                onValueChange={(val) => setFormData((p) => ({ ...p, experienceRange: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10">
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
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Location</h2>
              <Select value={formData.state} onValueChange={handleStateChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.state === "Queensland" && (
                <Select
                  value={formData.stateSuburbId}
                  onValueChange={(val) => setFormData((p) => ({ ...p, stateSuburbId: val }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10 mt-2">
                    <SelectValue placeholder="Select suburb/area" />
                  </SelectTrigger>
                  <SelectContent>
                    {qldSuburbs.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.sa3name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Start date */}
            <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Start Date</h2>
              <input
                type="date"
                min={todayISO()}
                value={formData.startDate}
                onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm"
              />
            </div>

            {/* Job Status */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Job Status</h2>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Active / Inactive</span>
                <Switch
                  checked={formData.status === "active"}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({ ...p, status: checked ? "active" : "inactive" }))
                  }
                  className="data-[state=checked]:bg-[#1E293B]"
                />
              </div>
            </div>

            {/* Save */}
            <div className="pb-8">
              <Button
                onClick={onSave}
                className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90 text-white rounded-xl h-12 text-base font-medium"
              >
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t rounded-b-[48px] flex-shrink-0">
            <BottomNavigation />
          </div>

          {/* In-frame future states popup */}
          {showFuturePopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="bg-white rounded-2xl p-8 w-[85%] max-w-sm shadow-xl">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    These functions are for future phases
                  </h2>
                  <p className="text-gray-600">We’ll be back</p>
                </div>
                <Button
                  onClick={() => setShowFuturePopup(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium"
                >
                  Back
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
