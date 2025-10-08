// src/components/WHVWorkExperience.tsx
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
  const [openDropdown, setOpenDropdown] = useState<{ id: string; type: "industry" | "role" } | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: indData } = await supabase.from("industry").select("industry_id, name");
      if (indData) setIndustries(indData.map((i) => ({ id: i.industry_id, name: i.name })));

      const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role, industry_id");
      if (roleData)
        setRoles(roleData.map((r) => ({ id: r.industry_role_id, name: r.role, industryId: r.industry_id })));

      const { data: licData } = await supabase.from("license").select("license_id, name");
      if (licData) setAllLicenses(licData.map((l) => ({ id: l.license_id, name: l.name })));

      const { data: expData } = await supabase.from("maker_work_experience").select("*").eq("user_id", user.id);
      if (expData)
        setWorkExperiences(
          expData.map((e: any) => ({
            id: String(e.work_experience_id),
            industryId: e.industry_id,
            roleId:
              roleData?.find((r) => r.role === e.position && r.industry_id === e.industry_id)?.industry_role_id || null,
            company: e.company || "",
            location: e.location || "",
            startDate: e.start_date || "",
            endDate: e.end_date || "",
            description: e.job_description || "",
          })),
        );

      const { data: refData } = await supabase.from("maker_reference").select("*").eq("user_id", user.id);
      if (refData)
        setJobReferences(
          refData.map((r) => ({
            id: String(r.reference_id),
            name: r.name || "",
            businessName: r.business_name || "",
            email: r.email || "",
            phone: r.mobile_num || "",
            role: r.role || "",
          })),
        );

      const { data: licSaved } = await supabase
        .from("maker_license")
        .select("license_id, other")
        .eq("user_id", user.id);
      if (licSaved) {
        setLicenses(licSaved.map((l) => l.license_id));
        const other = licSaved.find((l) => l.other)?.other;
        if (other) setOtherLicense(other);
      }
    };
    loadData();
  }, []);

  // Click outside dropdown to close
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helpers
  const addWorkExperience = () => {
    if (workExperiences.length < 8)
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
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences((prev) => prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) => (prev.includes(licenseId) ? prev.filter((l) => l !== licenseId) : [...prev, licenseId]));
  };

  const addJobReference = () => {
    if (jobReferences.length < 5)
      setJobReferences([
        ...jobReferences,
        { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" },
      ]);
  };

  const updateJobReference = (id: string, field: keyof JobReference, value: string) => {
    setJobReferences((prev) => prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Save work experiences
    await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
    const rows = workExperiences
      .filter((e) => e.industryId && e.roleId)
      .map((e) => ({
        user_id: user.id,
        company: e.company,
        industry_id: e.industryId!,
        position: roles.find((r) => r.id === e.roleId)?.name || "",
        start_date: e.startDate,
        end_date: e.endDate,
        location: e.location,
        job_description: e.description,
      }));
    if (rows.length) await supabase.from("maker_work_experience").insert(rows);

    // Save job references
    await supabase.from("maker_reference").delete().eq("user_id", user.id);
    if (jobReferences.length)
      await supabase.from("maker_reference").insert(
        jobReferences.map((r) => ({
          user_id: user.id,
          name: r.name,
          business_name: r.businessName,
          email: r.email,
          mobile_num: r.phone,
          role: r.role,
        })),
      );

    // Save licenses
    await supabase.from("maker_license").delete().eq("user_id", user.id);
    if (licenses.length)
      await supabase.from("maker_license").insert(
        licenses.map((id) => ({
          user_id: user.id,
          license_id: id,
          other: allLicenses.find((l) => l.id === id)?.name === "Other" ? otherLicense : null,
        })),
      );

    navigate("/whv/photo-upload");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative overflow-hidden">
        <div className="w-full h-full bg-white rounded-[54px] flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between">
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
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {workExperiences.map((exp, i) => (
              <div key={exp.id} className="border rounded-lg p-4 space-y-4 relative" ref={dropdownRef}>
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-800">Experience {i + 1}</h3>
                  <Button variant="ghost" onClick={() => removeWorkExperience(exp.id)} className="text-red-500">
                    <X size={16} />
                  </Button>
                </div>

                {/* Custom Dropdown - Industry */}
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown((prev) =>
                        prev?.id === exp.id && prev?.type === "industry" ? null : { id: exp.id, type: "industry" },
                      )
                    }
                    className="w-full h-10 bg-gray-100 border rounded px-3 text-left text-sm flex items-center justify-between"
                  >
                    {industries.find((i) => i.id === exp.industryId)?.name || "Select industry"}
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {openDropdown?.id === exp.id && openDropdown?.type === "industry" && (
                    <div className="absolute mt-1 w-full bg-white border rounded-lg shadow max-h-40 overflow-y-auto z-30">
                      {industries.map((ind) => (
                        <div
                          key={ind.id}
                          onClick={() => {
                            updateWorkExperience(exp.id, "industryId", ind.id);
                            updateWorkExperience(exp.id, "roleId", null);
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {ind.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Dropdown - Role */}
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <button
                    type="button"
                    disabled={!exp.industryId}
                    onClick={() =>
                      setOpenDropdown((prev) =>
                        prev?.id === exp.id && prev?.type === "role" ? null : { id: exp.id, type: "role" },
                      )
                    }
                    className={`w-full h-10 border rounded px-3 text-left text-sm flex items-center justify-between ${
                      exp.industryId ? "bg-gray-100" : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {roles.find((r) => r.id === exp.roleId)?.name || "Select position"}
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {openDropdown?.id === exp.id && openDropdown?.type === "role" && (
                    <div className="absolute mt-1 w-full bg-white border rounded-lg shadow max-h-40 overflow-y-auto z-30">
                      {roles
                        .filter((r) => r.industryId === exp.industryId)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              updateWorkExperience(exp.id, "roleId", r.id);
                              setOpenDropdown(null);
                            }}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          >
                            {r.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Rest of Fields */}
                <Input
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                />
                <Input
                  placeholder="Location"
                  value={exp.location}
                  onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)}
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
                  />
                  <Input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button type="button" onClick={addWorkExperience} className="w-full bg-orange-500 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> Add Work Experience
            </Button>

            {/* Licenses */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Licenses & Tickets</h2>
              <div className="max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3 space-y-2">
                {allLicenses.map((l) => (
                  <label key={l.id} className="flex items-center gap-3">
                    <input type="checkbox" checked={licenses.includes(l.id)} onChange={() => toggleLicense(l.id)} />
                    <span>{l.name}</span>
                  </label>
                ))}
              </div>
              {licenses.some((id) => allLicenses.find((l) => l.id === id)?.name === "Other") && (
                <Input
                  value={otherLicense}
                  onChange={(e) => setOtherLicense(e.target.value)}
                  placeholder="Specify other license"
                />
              )}
            </div>

            {/* References */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Job References</h2>
              {jobReferences.map((ref, i) => (
                <div key={ref.id} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800">Reference {i + 1}</h3>
                    <Button variant="ghost" onClick={() => removeJobReference(ref.id)} className="text-red-500">
                      <X size={16} />
                    </Button>
                  </div>
                  <Input
                    value={ref.name}
                    onChange={(e) => updateJobReference(ref.id, "name", e.target.value)}
                    placeholder="Name"
                  />
                  <Input
                    value={ref.businessName}
                    onChange={(e) => updateJobReference(ref.id, "businessName", e.target.value)}
                    placeholder="Business Name"
                  />
                  <Input
                    type="email"
                    value={ref.email}
                    onChange={(e) => updateJobReference(ref.id, "email", e.target.value)}
                    placeholder="Email"
                  />
                  <Input
                    value={ref.phone}
                    onChange={(e) => updateJobReference(ref.id, "phone", e.target.value)}
                    placeholder="Phone"
                  />
                  <Input
                    value={ref.role}
                    onChange={(e) => updateJobReference(ref.id, "role", e.target.value)}
                    placeholder="Role"
                  />
                </div>
              ))}
              <Button type="button" onClick={addJobReference} className="w-full bg-orange-500 text-white rounded-xl">
                + Add Reference
              </Button>
            </div>
          </div>

          {/* Continue Button */}
          <div className="absolute bottom-0 left-0 w-full bg-white px-6 py-4 border-t rounded-b-[54px]">
            <Button
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
