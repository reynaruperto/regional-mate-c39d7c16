// src/components/WHVWorkExperience.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [openSelector, setOpenSelector] = useState<{
    id: string;
    type: "industry" | "role" | null;
  } | null>(null);

  // ==========================
  // Load Data
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

      const { data: experiences } = await supabase.from("maker_work_experience").select("*").eq("user_id", user.id);
      if (experiences)
        setWorkExperiences(
          experiences.map((e) => ({
            id: String(e.work_experience_id),
            industryId: e.industry_id,
            roleId: roleData?.find((r) => r.role === e.position)?.industry_role_id || null,
            company: e.company || "",
            location: e.location || "",
            startDate: e.start_date || "",
            endDate: e.end_date || "",
            description: e.job_description || "",
          })),
        );

      const { data: refs } = await supabase.from("maker_reference").select("*").eq("user_id", user.id);
      if (refs)
        setJobReferences(
          refs.map((r) => ({
            id: String(r.reference_id),
            name: r.name || "",
            businessName: r.business_name || "",
            email: r.email || "",
            phone: r.mobile_num || "",
            role: r.role || "",
          })),
        );

      const { data: savedLic } = await supabase
        .from("maker_license")
        .select("license_id, other")
        .eq("user_id", user.id);
      if (savedLic) {
        setLicenses(savedLic.map((l) => l.license_id));
        const other = savedLic.find((l) => l.other)?.other;
        if (other) setOtherLicense(other);
      }
    };
    loadData();
  }, []);

  // ==========================
  // Handlers
  // ==========================
  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences((prev) => prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

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

  const removeWorkExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
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

  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) => (prev.includes(licenseId) ? prev.filter((l) => l !== licenseId) : [...prev, licenseId]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
    if (workExperiences.length)
      await supabase.from("maker_work_experience").insert(
        workExperiences.map((exp) => ({
          user_id: user.id,
          company: exp.company,
          industry_id: exp.industryId,
          position: roles.find((r) => r.id === exp.roleId)?.name || "",
          start_date: exp.startDate,
          end_date: exp.endDate,
          location: exp.location,
          job_description: exp.description,
        })),
      );

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

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative overflow-hidden">
        <div className="w-full h-full bg-white rounded-[54px] overflow-hidden flex flex-col relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-20"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between bg-white z-10">
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
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative">
            <form onSubmit={handleSubmit} className="space-y-10 pb-40">
              {/* Work Experience Section */}
              {workExperiences.map((exp, index) => (
                <div key={exp.id} className="border rounded-lg p-4 space-y-4 relative">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">Experience {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeWorkExperience(exp.id)}
                      className="text-red-500"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  {/* Industry Picker */}
                  <div>
                    <Label>Industry *</Label>
                    <button
                      type="button"
                      onClick={() => setOpenSelector({ id: exp.id, type: "industry" })}
                      className="w-full h-10 bg-gray-100 border rounded px-3 text-left text-sm"
                    >
                      {industries.find((i) => i.id === exp.industryId)?.name || "Select industry"}
                    </button>
                  </div>

                  {/* Role Picker */}
                  <div>
                    <Label>Position *</Label>
                    <button
                      type="button"
                      disabled={!exp.industryId}
                      onClick={() => setOpenSelector({ id: exp.id, type: "role" })}
                      className={`w-full h-10 border rounded px-3 text-left text-sm ${
                        exp.industryId ? "bg-gray-100" : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {roles.find((r) => r.id === exp.roleId)?.name || "Select position"}
                    </button>
                  </div>

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

              <Button type="button" onClick={addWorkExperience} className="bg-orange-500 text-white w-full rounded-xl">
                + Add Work Experience
              </Button>

              {/* Licenses */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Licenses & Tickets</h2>
                <div className="max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3 space-y-2">
                  {allLicenses.map((license) => (
                    <label key={license.id} className="flex items-center space-x-3">
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

              {/* Job References */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Job References</h2>
                {jobReferences.map((ref, i) => (
                  <div key={ref.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-800">Reference {i + 1}</h3>
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
                <Button type="button" onClick={addJobReference} className="bg-orange-500 text-white w-full rounded-xl">
                  + Add Reference
                </Button>
              </div>
            </form>
          </div>

          {/* Modal Selector */}
          {openSelector && (
            <div className="absolute inset-0 bg-white z-50 flex flex-col rounded-[54px]">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {openSelector.type === "industry" ? "Select Industry" : "Select Position"}
                </h2>
                <Button variant="ghost" onClick={() => setOpenSelector(null)} className="text-gray-600">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(openSelector.type === "industry"
                  ? industries
                  : roles.filter(
                      (r) => r.industryId === workExperiences.find((w) => w.id === openSelector.id)?.industryId,
                    )
                ).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (openSelector.type === "industry") {
                        updateWorkExperience(openSelector.id, "industryId", item.id);
                        updateWorkExperience(openSelector.id, "roleId", null);
                      } else {
                        updateWorkExperience(openSelector.id, "roleId", item.id);
                      }
                      setOpenSelector(null);
                    }}
                    className="py-3 border-b cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
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
