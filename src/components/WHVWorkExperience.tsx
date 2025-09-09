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

interface License {
  id: number;
  name: string;
}

interface WorkExperience {
  id: string;
  industryId: number | null;
  position: string;
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
  const [allLicenses, setAllLicenses] = useState<License[]>([]);

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // ==========================
  // Load industries + licenses
  // ==========================
  useEffect(() => {
    const loadData = async () => {
      const { data: industryData } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (industryData) {
        setIndustries(
          industryData.map((i) => ({ id: i.industry_id, name: i.name }))
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
          position: "",
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
    setWorkExperiences(
      workExperiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
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
    setJobReferences(
      jobReferences.map((ref) =>
        ref.id === id ? { ...ref, [field]: value } : ref
      )
    );
  };

  const removeJobReference = (id: string) => {
    setJobReferences(jobReferences.filter((ref) => ref.id !== id));
  };

  // ==========================
  // License handlers
  // ==========================
  const toggleLicense = (licenseId: number) => {
    if (licenses.includes(licenseId)) {
      setLicenses(licenses.filter((l) => l !== licenseId));
    } else {
      setLicenses([...licenses, licenseId]);
    }
  };

  // ==========================
  // Save helpers
  // ==========================
  const saveWorkExperiences = async (userId: string) => {
    if (workExperiences.length === 0) return;

    const validRows = workExperiences.filter(
      (exp) =>
        exp.company.trim() &&
        exp.position.trim() &&
        exp.industryId !== null &&
        exp.startDate &&
        exp.endDate
    );

    if (validRows.length === 0) {
      console.warn("⚠️ No valid work experiences to save.");
      return;
    }

    const workRows = validRows.map((exp) => ({
      user_id: userId,
      company: exp.company.trim(),
      position: exp.position.trim(),
      start_date: exp.startDate,
      end_date: exp.endDate,
      location: exp.location || null,
      industry_id: exp.industryId!,
      job_description: exp.description || null,
    }));

    console.log("📦 Inserting work experiences:", workRows);

    const { error: expError } = await supabase
      .from("maker_work_experience")
      .insert(workRows);

    if (expError) {
      console.error("❌ Work experience insert failed");
      console.error("Message:", expError.message);
      console.error("Details:", expError.details);
      console.error("Hint:", expError.hint);
    } else {
      console.log("✅ Work experiences saved!");
    }
  };

  const saveJobReferences = async (userId: string) => {
    if (jobReferences.length === 0) return;

    const refRows = jobReferences.map((ref) => ({
      user_id: userId,
      name: ref.name || null,
      business_name: ref.businessName || null,
      email: ref.email || null,
      mobile_num: ref.phone || null,
      role: ref.role || null,
    }));

    const { error: refError } = await supabase
      .from("maker_reference")
      .insert(refRows);

    if (refError) {
      console.error("❌ Job reference insert failed:", refError);
    } else {
      console.log("✅ Job references saved!");
    }
  };

  const saveLicenses = async (userId: string) => {
    if (licenses.length === 0) return;

    const licRows = licenses.map((licenseId) => ({
      user_id: userId,
      license_id: licenseId,
      other:
        allLicenses.find((l) => l.id === licenseId)?.name === "Other"
          ? otherLicense
          : null,
    }));

    const { error: licError } = await supabase
      .from("maker_license")
      .upsert(licRows as any, { onConflict: "user_id,license_id" });

    if (licError) {
      console.error("❌ License insert failed:", licError);
    } else {
      console.log("✅ Licenses saved!");
    }
  };

  // ==========================
  // Submit handler
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("Not logged in");
      return;
    }

    const userId = user.id; // matches profile.user_id

    await saveWorkExperiences(userId);
    await saveJobReferences(userId);
    await saveLicenses(userId);

    navigate("/whv/photo-upload");
  };

  // ==========================
  // Render
  // ==========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-5 border-b bg-white flex-shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/work-preferences")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">
                Work Experience
              </h1>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">5/6</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-10">
            <form onSubmit={handleSubmit} className="space-y-10 pb-20">
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
                          updateWorkExperience(
                            exp.id,
                            "industryId",
                            Number(value)
                          )
                        }
                      >
                        <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind.id} value={String(ind.id)}>
                              {ind.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position */}
                    <Input
                      type="text"
                      value={exp.position}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "position", e.target.value)
                      }
                      className="h-10 bg-gray-100 border-0 text-sm"
                      placeholder="Position"
                      required
                    />

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

              {/* Continue Button */}
              <div className="pt-10 pb-6">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
                >
                  Continue →
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkExperience;

