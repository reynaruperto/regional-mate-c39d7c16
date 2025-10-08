// src/components/WHVWorkExperience.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Industry {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  industryId: number;
}

interface License {
  id: number;
  name: string;
}

interface WorkExperience {
  id: string;
  industryId: number | null;
  roleId: number | null;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface JobReference {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  role: string;
}

const WHVWorkExperience: React.FC = () => {
  const navigate = useNavigate();

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [workExperienceDateErrors, setWorkExperienceDateErrors] = useState<Record<string, boolean>>({});

  // ==========================
  // Load industries, roles, licenses + existing data
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load lookup tables
      const { data: industryData } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (industryData) {
        setIndustries(
          industryData.map((i) => ({ id: i.industry_id, name: i.name }))
        );
      }

      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      const { data: licenseData } = await supabase
        .from("license")
        .select("license_id, name");
      if (licenseData) {
        setAllLicenses(
          licenseData.map((l) => ({ id: l.license_id, name: l.name }))
        );
      }

      // Load existing work experiences
      const { data: savedExperiences } = await supabase
        .from("maker_work_experience")
        .select("*")
        .eq("user_id", user.id);

      if (savedExperiences && savedExperiences.length > 0 && roleData) {
        const mappedExperiences: WorkExperience[] = savedExperiences.map((exp) => {
          const role = roleData.find((r) => r.role === exp.position);
          return {
            id: exp.work_experience_id.toString(),
            industryId: exp.industry_id,
            roleId: role?.industry_role_id || null,
            company: exp.company || "",
            location: exp.location || "",
            startDate: exp.start_date || "",
            endDate: exp.end_date || "",
            description: exp.job_description || "",
          };
        });
        setWorkExperiences(mappedExperiences);
      }

      // Load existing references
      const { data: savedReferences } = await supabase
        .from("maker_reference")
        .select("*")
        .eq("user_id", user.id);

      if (savedReferences && savedReferences.length > 0) {
        const mappedReferences: JobReference[] = savedReferences.map((ref) => ({
          id: ref.reference_id.toString(),
          name: ref.name || "",
          businessName: ref.business_name || "",
          email: ref.email || "",
          phone: ref.mobile_num || "",
          role: ref.role || "",
        }));
        setJobReferences(mappedReferences);
      }

      // Load existing licenses
      const { data: savedLicenses } = await supabase
        .from("maker_license")
        .select("license_id, other")
        .eq("user_id", user.id);

      if (savedLicenses && savedLicenses.length > 0) {
        setLicenses(savedLicenses.map((l) => l.license_id));
        const otherLic = savedLicenses.find((l) => l.other);
        if (otherLic?.other) setOtherLicense(otherLic.other);
      }
    };
    loadData();
  }, []);

  // ==========================
  // Work Experience handlers
  // ==========================
  const addWorkExperience = () => {
    if (workExperiences.length < 8) {
      setWorkExperiences([
        ...workExperiences,
        {
          id: Date.now().toString(),
          industryId: null,
          roleId: null,
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ]);
    }
  };

  const updateWorkExperience = (
    id: string,
    field: keyof WorkExperience,
    value: any
  ) => {
    setWorkExperiences((prev) => {
      const updated = prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp));
      // Clear error when dates are updated and valid
      if (field === 'startDate' || field === 'endDate') {
        const exp = updated.find(e => e.id === id);
        if (exp && exp.startDate && exp.endDate) {
          const hasError = new Date(exp.startDate) > new Date(exp.endDate);
          setWorkExperienceDateErrors(prev => {
            if (hasError) {
              return { ...prev, [id]: true };
            } else {
              const newErrors = { ...prev };
              delete newErrors[id];
              return newErrors;
            }
          });
        }
      }
      return updated;
    });
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  // ==========================
  // Job Reference handlers
  // ==========================
  const addJobReference = () => {
    if (jobReferences.length < 5) {
      setJobReferences([
        ...jobReferences,
        {
          id: Date.now().toString(),
          name: "",
          businessName: "",
          email: "",
          phone: "",
          role: "",
        },
      ]);
    }
  };

  const updateJobReference = (
    id: string,
    field: keyof JobReference,
    value: string
  ) => {
    setJobReferences((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref))
    );
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // ==========================
  // License handlers
  // ==========================
  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) =>
      prev.includes(licenseId)
        ? prev.filter((l) => l !== licenseId)
        : [...prev, licenseId]
    );
  };

  // ==========================
  // Save helpers
  // ==========================
  const saveWorkExperiences = async (userId: string) => {
    await supabase.from("maker_work_experience" as any).delete().eq("user_id", userId);

    if (workExperiences.length === 0) return;

    const validRows = workExperiences.filter(
      (exp) =>
        exp.company.trim() &&
        exp.roleId !== null &&
        exp.industryId !== null &&
        exp.startDate &&
        exp.endDate
    );

    if (validRows.length === 0) return;

    const workRows = validRows.map((exp) => {
      const roleName = roles.find((r) => r.id === exp.roleId)?.name || "";
      return {
        user_id: userId,
        company: exp.company.trim(),
        industry_id: exp.industryId!,
        position: roleName,
        start_date: exp.startDate,
        end_date: exp.endDate,
        location: exp.location || null,
        job_description: exp.description || null,
      };
    });

    const { error } = await supabase.from("maker_work_experience" as any).insert(workRows);
    if (error) console.error("❌ Work experience insert failed:", error);
  };

  const saveJobReferences = async (userId: string) => {
    await supabase.from("maker_reference" as any).delete().eq("user_id", userId);

    if (jobReferences.length === 0) return;

    const refRows = jobReferences.map((ref) => ({
      user_id: userId,
      name: ref.name?.trim() || null,
      business_name: ref.businessName?.trim() || null,
      email: ref.email?.trim() || null,
      mobile_num: ref.phone?.trim()?.substring(0, 10) || null, // Limit to 10 characters
      role: ref.role?.trim() || null,
    }));

    const { error } = await supabase.from("maker_reference" as any).insert(refRows);
    if (error) console.error("❌ Job reference insert failed:", error);
  };

  const saveLicenses = async (userId: string) => {
    await supabase.from("maker_license" as any).delete().eq("user_id", userId);

    if (licenses.length === 0) return;

    const licRows = licenses.map((licenseId) => ({
      user_id: userId,
      license_id: licenseId,
      other:
        allLicenses.find((l) => l.id === licenseId)?.name === "Other"
          ? otherLicense
          : null,
    }));

    const { error } = await supabase.from("maker_license" as any).insert(licRows);
    if (error) console.error("❌ License insert failed:", error);
  };

  // ==========================
  // Submit handler
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date ranges
    const invalidExperiences = workExperiences.filter(exp => {
      if (!exp.startDate || !exp.endDate) return false;
      return new Date(exp.startDate) > new Date(exp.endDate);
    });

    if (invalidExperiences.length > 0) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Validation Error",
        description: "Please fix invalid date ranges in work experience. End date cannot be before start date.",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("Not logged in");
      return;
    }

    const userId = user.id;

    await saveWorkExperiences(userId);
    await saveJobReferences(userId);
    await saveLicenses(userId);

    navigate("/whv/photo-upload");
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* Outer frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative overflow-hidden">
        {/* Inner screen */}
        <div className="w-full h-full bg-white rounded-[54px] overflow-hidden flex flex-col relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-20"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between flex-shrink-0 bg-white z-10">
            <button
              onClick={() => navigate("/whv/work-preferences")}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Work Experience</h1>
            <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-sm">5/6</span>
          </div>

          {/* Scrollable Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-10 pb-40">
              {/* Work Experience Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Work Experience
                  </h2>
                  <Button
                    type="button"
                    onClick={addWorkExperience}
                    disabled={workExperiences.length >= 8}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                {workExperiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">
                        Experience {index + 1}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeWorkExperience(exp.id)}
                        className="text-red-500"
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Industry <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={exp.industryId ? String(exp.industryId) : ""}
                        onValueChange={(value) =>
                          updateWorkExperience(exp.id, "industryId", Number(value))
                        }
                      >
                        <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[200px] overflow-y-auto rounded-lg shadow-lg bg-white border z-50">
                          {industries.map((ind) => (
                            <SelectItem key={ind.id} value={String(ind.id)}>
                              {ind.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Role / Position */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={exp.roleId ? String(exp.roleId) : ""}
                        onValueChange={(value) =>
                          updateWorkExperience(exp.id, "roleId", Number(value))
                        }
                      >
                        <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[200px] overflow-y-auto rounded-lg shadow-lg bg-white border z-50">
                          {roles
                            .filter((r) => r.industryId === exp.industryId)
                            .map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Company */}
                    <Input
                      type="text"
                      value={exp.company}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "company", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Company"
                      required
                    />

                    {/* Location */}
                    <Input
                      type="text"
                      value={exp.location}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "location", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Location"
                    />

                    {/* Description */}
                    <textarea
                      value={exp.description}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "description", e.target.value)
                      }
                      className="w-full bg-gray-100 border-0 text-sm p-2 rounded"
                      placeholder="Describe your responsibilities (max 100 chars)"
                      maxLength={100}
                    />

                    {/* Dates */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateWorkExperience(
                              exp.id,
                              "startDate",
                              e.target.value
                            )
                          }
                          className="h-10 bg-gray-100 border-0 text-sm"
                          required
                        />
                        <Input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) =>
                            updateWorkExperience(exp.id, "endDate", e.target.value)
                          }
                          className="h-10 bg-gray-100 border-0 text-sm"
                          required
                        />
                      </div>
                      {workExperienceDateErrors[exp.id] && (
                        <p className="text-red-500 text-xs mt-1">
                          End date cannot be before start date
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Licenses */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Licenses & Tickets
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3">
                  {allLicenses.map((license) => (
                    <div key={license.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`license-${license.id}`}
                        checked={licenses.includes(license.id)}
                        onChange={() => toggleLicense(license.id)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                      />
                      <Label
                        htmlFor={`license-${license.id}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {license.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {licenses.some(
                  (id) => allLicenses.find((l) => l.id === id)?.name === "Other"
                ) && (
                  <Input
                    type="text"
                    value={otherLicense}
                    onChange={(e) => setOtherLicense(e.target.value)}
                    className="h-10 bg-gray-100 border-0 text-sm mt-2"
                    placeholder="Specify other license"
                  />
                )}
              </div>

              {/* Job References */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Job References
                  </h2>
                  <Button
                    type="button"
                    onClick={addJobReference}
                    disabled={jobReferences.length >= 5}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                {jobReferences.map((ref, index) => (
                  <div
                    key={ref.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">
                        Reference {index + 1}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeJobReference(ref.id)}
                        className="text-red-500"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    <Input
                      type="text"
                      value={ref.name}
                      onChange={(e) =>
                        updateJobReference(ref.id, "name", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Name"
                    />
                    <Input
                      type="text"
                      value={ref.businessName}
                      onChange={(e) =>
                        updateJobReference(ref.id, "businessName", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Business Name"
                    />
                    <Input
                      type="email"
                      value={ref.email}
                      onChange={(e) =>
                        updateJobReference(ref.id, "email", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Email"
                    />
                    <Input
                      type="text"
                      value={ref.phone}
                      onChange={(e) =>
                        updateJobReference(ref.id, "phone", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Phone Number"
                    />
                    <Input
                      type="text"
                      value={ref.role}
                      onChange={(e) =>
                        updateJobReference(ref.id, "role", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Role"
                    />
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Fixed Continue Button */}
          <div className="absolute bottom-0 left-0 w-full bg-white px-6 py-4 border-t z-20 rounded-b-[54px]">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl"
            >
              Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkExperience;
