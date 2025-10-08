import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, X, ChevronDown } from "lucide-react";
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // 🧩 New multi-ref system to prevent auto-closing all dropdowns
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isInsideAny = Object.values(dropdownRefs.current).some((ref) => ref && ref.contains(event.target as Node));
      if (!isInsideAny) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================
  // Load data from Supabase
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: industryData } = await supabase.from("industry").select("industry_id, name");
      if (industryData) setIndustries(industryData.map((i) => ({ id: i.industry_id, name: i.name })));

      const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role, industry_id");
      if (roleData)
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          })),
        );

      const { data: licenseData } = await supabase.from("license").select("license_id, name");
      if (licenseData) setAllLicenses(licenseData.map((l) => ({ id: l.license_id, name: l.name })));

      const { data: savedExperiences } = await supabase
        .from("maker_work_experience")
        .select("*")
        .eq("user_id", user.id);

      if (savedExperiences && savedExperiences.length > 0 && roleData) {
        const mapped = savedExperiences.map((exp) => {
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
        setWorkExperiences(mapped);
      }

      const { data: savedReferences } = await supabase.from("maker_reference").select("*").eq("user_id", user.id);
      if (savedReferences)
        setJobReferences(
          savedReferences.map((ref) => ({
            id: ref.reference_id.toString(),
            name: ref.name || "",
            businessName: ref.business_name || "",
            email: ref.email || "",
            phone: ref.mobile_num || "",
            role: ref.role || "",
          })),
        );

      const { data: savedLicenses } = await supabase
        .from("maker_license")
        .select("license_id, other")
        .eq("user_id", user.id);
      if (savedLicenses) {
        setLicenses(savedLicenses.map((l) => l.license_id));
        const otherLic = savedLicenses.find((l) => l.other);
        if (otherLic?.other) setOtherLicense(otherLic.other);
      }
    };
    loadData();
  }, []);

  // ==========================
  // Work Experience Handlers
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

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences((prev) => prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  // ==========================
  // Job Reference Handlers
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

  const updateJobReference = (id: string, field: keyof JobReference, value: string) => {
    setJobReferences((prev) => prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // ==========================
  // License Handlers
  // ==========================
  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) => (prev.includes(licenseId) ? prev.filter((l) => l !== licenseId) : [...prev, licenseId]));
  };

  // ==========================
  // Save and Submit
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
    await supabase.from("maker_reference").delete().eq("user_id", user.id);
    await supabase.from("maker_license").delete().eq("user_id", user.id);

    if (workExperiences.length) {
      const expRows = workExperiences.map((exp) => ({
        user_id: user.id,
        company: exp.company.trim(),
        industry_id: exp.industryId!,
        position: roles.find((r) => r.id === exp.roleId)?.name || "",
        start_date: exp.startDate,
        end_date: exp.endDate,
        location: exp.location || null,
        job_description: exp.description || null,
      }));
      await supabase.from("maker_work_experience").insert(expRows);
    }

    if (jobReferences.length) {
      const refRows = jobReferences.map((ref) => ({
        user_id: user.id,
        name: ref.name.trim(),
        business_name: ref.businessName.trim(),
        email: ref.email.trim(),
        mobile_num: ref.phone.trim().substring(0, 10),
        role: ref.role.trim(),
      }));
      await supabase.from("maker_reference").insert(refRows);
    }

    if (licenses.length) {
      const licRows = licenses.map((id) => ({
        user_id: user.id,
        license_id: id,
        other: allLicenses.find((l) => l.id === id)?.name === "Other" ? otherLicense : null,
      }));
      await supabase.from("maker_license").insert(licRows);
    }

    navigate("/whv/photo-upload");
  };

  // ==========================
  // Render UI
  // ==========================
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl overflow-hidden">
        <div className="w-full h-full bg-white rounded-[54px] flex flex-col relative overflow-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full"></div>

          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between bg-white">
            <button
              onClick={() => navigate("/whv/work-preferences")}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Work Experience</h1>
            <span className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-sm">5/6</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-10 pb-40">
              {/* Work Experience Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                  <Button
                    type="button"
                    onClick={addWorkExperience}
                    disabled={workExperiences.length >= 8}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                {workExperiences.map((exp) => (
                  <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">Experience</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeWorkExperience(exp.id)}
                        className="text-red-500"
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    {/* Industry Dropdown */}
                    <div className="relative space-y-2" ref={(el) => (dropdownRefs.current[exp.id + "industry"] = el)}>
                      <Label className="text-sm font-medium text-gray-700">Industry *</Label>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdown(openDropdown === exp.id + "industry" ? null : exp.id + "industry")
                        }
                        className="w-full h-10 bg-gray-100 border rounded px-3 text-left text-sm flex justify-between items-center"
                      >
                        <span>{industries.find((i) => i.id === exp.industryId)?.name || "Select industry"}</span>
                        <ChevronDown size={16} />
                      </button>

                      {openDropdown === exp.id + "industry" && (
                        <div className="absolute top-full left-0 w-full bg-gray-100 rounded mt-1 max-h-40 overflow-y-auto z-10 shadow">
                          {industries.map((ind) => (
                            <div
                              key={ind.id}
                              onClick={() => {
                                updateWorkExperience(exp.id, "industryId", ind.id);
                                updateWorkExperience(exp.id, "roleId", null);
                                setOpenDropdown(null);
                              }}
                              className="px-3 py-2 text-sm hover:bg-gray-200 cursor-pointer"
                            >
                              {ind.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Role Dropdown */}
                    <div className="relative space-y-2" ref={(el) => (dropdownRefs.current[exp.id + "role"] = el)}>
                      <Label className="text-sm font-medium text-gray-700">Position *</Label>
                      <button
                        type="button"
                        disabled={!exp.industryId}
                        onClick={() => setOpenDropdown(openDropdown === exp.id + "role" ? null : exp.id + "role")}
                        className={`w-full h-10 border rounded px-3 text-left text-sm flex justify-between items-center ${
                          exp.industryId ? "bg-gray-100" : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        <span>{roles.find((r) => r.id === exp.roleId)?.name || "Select position"}</span>
                        <ChevronDown size={16} />
                      </button>

                      {openDropdown === exp.id + "role" && (
                        <div className="absolute top-full left-0 w-full bg-gray-100 rounded mt-1 max-h-40 overflow-y-auto z-10 shadow">
                          {roles
                            .filter((r) => r.industryId === exp.industryId)
                            .map((role) => (
                              <div
                                key={role.id}
                                onClick={() => {
                                  updateWorkExperience(exp.id, "roleId", role.id);
                                  setOpenDropdown(null);
                                }}
                                className="px-3 py-2 text-sm hover:bg-gray-200 cursor-pointer"
                              >
                                {role.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Company & Details */}
                    <Input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Company"
                      required
                    />
                    <Input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Location"
                    />
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(exp.id, "description", e.target.value)}
                      className="w-full bg-gray-100 border-0 text-sm p-2 rounded"
                      placeholder="Describe your responsibilities (max 100 chars)"
                      maxLength={100}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                        required
                      />
                      <Input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Licenses */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Licenses & Tickets</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3">
                  {allLicenses.map((license) => (
                    <div key={license.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={licenses.includes(license.id)}
                        onChange={() => toggleLicense(license.id)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                      />
                      <Label className="text-sm text-gray-700">{license.name}</Label>
                    </div>
                  ))}
                </div>
                {licenses.some((id) => allLicenses.find((l) => l.id === id)?.name === "Other") && (
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
                  <h2 className="text-xl font-semibold text-gray-900">Job References</h2>
                  <Button
                    type="button"
                    onClick={addJobReference}
                    disabled={jobReferences.length >= 5}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                {jobReferences.map((ref) => (
                  <div key={ref.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">Reference</h3>
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
                      onChange={(e) => updateJobReference(ref.id, "name", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Name"
                    />
                    <Input
                      type="text"
                      value={ref.businessName}
                      onChange={(e) => updateJobReference(ref.id, "businessName", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Business Name"
                    />
                    <Input
                      type="email"
                      value={ref.email}
                      onChange={(e) => updateJobReference(ref.id, "email", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Email"
                    />
                    <Input
                      type="text"
                      value={ref.phone}
                      onChange={(e) => updateJobReference(ref.id, "phone", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Phone Number"
                    />
                    <Input
                      type="text"
                      value={ref.role}
                      onChange={(e) => updateJobReference(ref.id, "role", e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Role"
                    />
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Continue Button */}
          <div className="absolute bottom-0 left-0 w-full bg-white px-6 py-4 border-t rounded-b-[54px]">
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
