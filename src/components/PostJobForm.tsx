import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Inline Select (no portal)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-inline";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    industryRoleId: editingJob?.industry_role_id ? String(editingJob.industry_role_id) : "",
    description: editingJob?.description || "",
    employmentType: editingJob?.employment_type || "",
    salaryRange: editingJob?.salary_range || "",
    experienceRange: editingJob?.req_experience || "",
    state: editingJob?.state || "",
    suburbValue: editingJob?.suburb_city ? `${editingJob.suburb_city} (${editingJob.postcode})` : "",
    postcode: editingJob?.postcode || "",
    status: (editingJob?.job_status || "draft") as JobStatus,
    startDate: editingJob?.start_date || "",
    licenses: (editingJob?.licenses as number[]) || [],
  });

  const [selectedLicenses, setSelectedLicenses] = useState<number[]>((editingJob?.licenses as number[]) || []);
  const [dateError, setDateError] = useState<string | null>(null);

  const handle = (k: keyof typeof form, v: string) => {
    setForm((prev) => {
      const updated = { ...prev, [k]: v };
      autosave(updated);
      return updated;
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      setDateError("Please select a start date");
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      setDateError("Start date cannot be in the past");
      toast({
        title: "Invalid Date",
        description: "Start date cannot be in the past. Please select today or a future date.",
        variant: "destructive",
      });
      return;
    }
    
    setDateError(null);
    const formattedDate = format(date, "yyyy-MM-dd");
    handle("startDate", formattedDate);
  };

  const autosave = async (draft: any) => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isValidDate = draft.startDate && new Date(draft.startDate) >= today;

    const payload = {
      user_id: uid,
      job_status: draft.status,
      industry_role_id: draft.industryRoleId ? Number(draft.industryRoleId) : null,
      description: draft.description,
      employment_type: draft.employmentType || null,
      salary_range: draft.salaryRange || null,
      req_experience: draft.experienceRange || null,
      state: draft.state,
      suburb_city: draft.suburbValue ? draft.suburbValue.split(" (")[0] : "",
      postcode: draft.postcode,
      start_date: isValidDate ? draft.startDate : null,
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
          })),
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
    if (!form.employmentType) {
      toast({
        title: "Missing Employment Type",
        description: "Please select an employment type before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!form.salaryRange) {
      toast({
        title: "Missing Salary Range",
        description: "Please select a salary range before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!form.experienceRange) {
      toast({
        title: "Missing Experience Range",
        description: "Please select an experience range before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!form.description || form.description.trim() === "") {
      toast({
        title: "Missing Job Description",
        description: "Please enter a job description before saving.",
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
    
    const selectedDate = new Date(form.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Invalid Start Date",
        description: "Start date cannot be in the past. Please select today or a future date.",
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
      description: editingJob ? "Your changes are saved." : "Your job is now active.",
    });
    onBack();
  };

  // enums
  useEffect(() => {
    setPayRangeEnum(["$25-30/hour", "$30-35/hour", "$35-40/hour", "$40-45/hour", "$45+/hour", "Undisclosed"]);
    setYearsExpEnum(["None", "<1", "1-2", "3-4", "5-7", "8-10", "10"]);
    setEmploymentTypeEnum(["Full-time", "Part-time", "Contract", "Casual", "Seasonal"]);
  }, []);

  // fetch employer industry id
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const { data: emp } = await supabase.from("employer").select("industry_id").eq("user_id", uid).single();

      if (emp?.industry_id) setIndustryId(emp.industry_id);
    })();
  }, []);

  // load roles
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
          })),
        );
      }
    })();
  }, [industryId]);

  // ✅ load locations with pagination
  useEffect(() => {
    if (!industryId) return;

    const fetchAllLocations = async () => {
      const pageSize = 1000;
      let allLocations: LocationRow[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from("visa_work_location_rules")
          .select("state, suburb_city, postcode")
          .eq("industry_id", industryId)
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("Error fetching locations:", error);
          break;
        }

        if (!data || data.length === 0) break;

        allLocations = allLocations.concat(data);

        if (data.length < pageSize) break;
        from += pageSize;
      }

      const unique = Array.from(
        new Map(allLocations.map((loc) => [`${loc.suburb_city}-${loc.postcode}`, loc])).values(),
      );
      setLocations(unique);
    };

    fetchAllLocations();
  }, [industryId]);

  // load licenses
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("license").select("license_id, name").order("name");
      if (data) setLicenses(data);
    })();
  }, []);

  const dropdownClasses =
    "w-[var(--radix-select-trigger-width)] max-w-full max-h-40 overflow-y-auto text-sm rounded-xl border bg-white shadow-lg";

  const itemClasses = "py-2 px-3 whitespace-normal break-words leading-snug text-sm";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative overflow-hidden">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-4 flex items-center">
            <Button variant="ghost" size="icon" className="w-12 h-12 bg-white rounded-xl shadow mr-4" onClick={onBack}>
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">{editingJob ? "Edit Job" : "Post Job"}</h1>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 overflow-y-auto pb-24 text-sm">
            {/* Role */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Job Role *</h2>
              <Select value={form.industryRoleId} onValueChange={(v) => handle("industryRoleId", v)}>
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className={dropdownClasses}>
                  {roles.map((r) => (
                    <SelectItem key={r.industry_role_id} value={String(r.industry_role_id)} className={itemClasses}>
                      {r.industry_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employment Type */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Employment Type *</h2>
              <Select value={form.employmentType} onValueChange={(v) => handle("employmentType", v)}>
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent className={dropdownClasses}>
                  {employmentTypeEnum.map((t) => (
                    <SelectItem key={t} value={t} className={itemClasses}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Salary Range *</h2>
              <Select value={form.salaryRange} onValueChange={(v) => handle("salaryRange", v)}>
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select salary range" />
                </SelectTrigger>
                <SelectContent className={dropdownClasses}>
                  {payRangeEnum.map((t) => (
                    <SelectItem key={t} value={t} className={itemClasses}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Experience Required *</h2>
              <Select value={form.experienceRange} onValueChange={(v) => handle("experienceRange", v)}>
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className={dropdownClasses}>
                  {yearsExpEnum.map((t) => (
                    <SelectItem key={t} value={t} className={itemClasses}>
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
                  const chosen = locations.find((loc) => `${loc.suburb_city} (${loc.postcode})` === v);
                  handle("suburbValue", v);
                  handle("state", chosen?.state || "");
                  handle("postcode", chosen?.postcode || "");
                }}
              >
                <SelectTrigger className="h-10 px-3 text-sm">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className={dropdownClasses}>
                  {locations.map((l, idx) => (
                    <SelectItem
                      key={`${l.suburb_city}-${l.postcode}-${idx}`}
                      value={`${l.suburb_city} (${l.postcode})`}
                      className={itemClasses}
                    >
                      {l.suburb_city}, {l.state} {l.postcode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Job Description *</h2>
              <Textarea
                placeholder="Describe the job duties, requirements, and expectations..."
                value={form.description}
                onChange={(e) => handle("description", e.target.value)}
                className="min-h-[120px] text-sm border rounded-lg p-2 resize-y"
              />
            </div>

            {/* Start Date */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Start Date *</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 px-3 text-sm",
                      !form.startDate && "text-muted-foreground",
                      dateError && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.startDate ? format(new Date(form.startDate), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.startDate ? new Date(form.startDate) : undefined}
                    onSelect={handleDateChange}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {dateError && (
                <p className="text-red-500 text-xs mt-1">{dateError}</p>
              )}
            </div>

            {/* Licenses */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Licenses</h2>
              {licenses.map((l) => (
                <label key={l.license_id} className="flex items-center gap-2 text-sm py-1">
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
                  <span className="whitespace-normal break-words">{l.name}</span>
                </label>
              ))}
            </div>

            {/* Save */}
            <div className="pb-6">
              <Button onClick={onSave} className="w-full bg-[#1E293B] text-white rounded-xl h-12 text-sm">
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
