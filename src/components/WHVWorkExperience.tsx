// src/components/WHVWorkExperience.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
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
  roleIds: number[];
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

  // ========== LOAD DATA ==========
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
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          })),
        );

      const { data: licData } = await supabase.from("license").select("license_id, name");
      if (licData) setAllLicenses(licData.map((l) => ({ id: l.license_id, name: l.name })));

      const { data: expData } = await supabase.from("maker_work_experience").select("*").eq("user_id", user.id);
      if (expData)
        setWorkExperiences(
          expData.map((e) => ({
            id: String(e.work_experience_id),
            industryId: e.industry_id,
            roleIds: roles.filter((r) => r.role === e.position).map((r) => r.id),
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

  // ========== HANDLERS ==========
  const addWorkExperience = () => {
    if (workExperiences.length < 8)
      setWorkExperiences([
        ...workExperiences,
        {
          id: Date.now().toString(),
          industryId: null,
          roleIds: [],
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

  const toggleRole = (expId: string, roleId: number) => {
    setWorkExperiences((prev) =>
      prev.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              roleIds: exp.roleIds.includes(roleId)
                ? exp.roleIds.filter((r) => r !== roleId)
                : [...exp.roleIds, roleId],
            }
          : exp,
      ),
    );
  };

  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) => (prev.includes(licenseId) ? prev.filter((l) => l !== licenseId) : [...prev, licenseId]));
  };

  const addJobReference = () => {
    if (jobReferences.length < 5)
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
  };

  const updateJobReference = (id: string, field: keyof JobReference, value: string) => {
    setJobReferences((prev) => prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // ========== SAVE ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Save experiences
    await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
    const workRows = workExperiences
      .filter((exp) => exp.industryId && exp.roleIds.length)
      .map((exp) => ({
        user_id: user.id,
        company: exp.company,
        industry_id: exp.industryId!,
        position: roles.find((r) => r.id === exp.roleIds[0])?.name || "",
        start_date: exp.startDate,
        end_date: exp.endDate,
        location: exp.location,
        job_description: exp.description,
      }));
    if (workRows.length) await supabase.from("maker_work_experience").insert(workRows);

    // Save references
    await supabase.from("maker_reference").delete().eq("user_id", user.id);
    if (jobReferences.length)
      await supabase.from("maker_reference").insert(
        jobReferences.map((ref) => ({
          user_id: user.id,
          name: ref.name,
          business_name: ref.businessName,
          email: ref.email,
          mobile_num: ref.phone,
          role: ref.role,
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

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative overflow-hidden">
        <div className="w-full h-full bg-white rounded-[54px] overflow-hidden flex flex-col relative">
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

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {workExperiences.map((exp, index) => (
              <div key={exp.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-800">Experience {index + 1}</h3>
                  <Button variant="ghost" onClick={() => removeWorkExperience(exp.id)} className="text-red-500">
                    <X size={16} />
                  </Button>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  {industries.map((ind) => (
                    <label key={ind.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="radio"
                        checked={exp.industryId === ind.id}
                        onChange={() => updateWorkExperience(exp.id, "industryId", ind.id)}
                        className="h-4 w-4"
                      />
                      <span>{ind.name}</span>
                    </label>
                  ))}
                </div>

                {/* Role */}
                {exp.industryId && (
                  <div className="space-y-2">
                    <Label>Roles *</Label>
                    <div className="flex flex-wrap gap-2">
                      {roles
                        .filter((r) => r.industryId === exp.industryId)
                        .map((r) => (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => toggleRole(exp.id, r.id)}
                            className={`px-3 py-1.5 rounded-full text-xs border ${
                              exp.roleIds.includes(r.id)
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-white text-gray-700 border-gray-300"
                            }`}
                          >
                            {r.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <Input
                  value={exp.company}
                  onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                  placeholder="Company"
                />
                <Input
                  value={exp.location}
                  onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)}
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
                {allLicenses.map((license) => (
                  <label key={license.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={licenses.includes(license.id)}
                      onChange={() => toggleLicense(license.id)}
                    />
                    <span>{license.name}</span>
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

          {/* Continue */}
          <div className="absolute bottom-0 left-0 w-full bg-white px-6 py-4 border-t z-20 rounded-b-[54px]">
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
