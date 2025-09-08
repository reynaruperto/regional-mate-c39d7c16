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
  industry: string;
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
  const [licenses, setLicenses] = useState<string[]>([]);
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
          industry: "",
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
    value: string
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
  const toggleLicense = (license: string) => {
    if (licenses.includes(license)) {
      setLicenses(licenses.filter((l) => l !== license));
    } else {
      setLicenses([...licenses, license]);
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

    const userId = user.id;

    // 1. Save work experiences
    for (const exp of workExperiences) {
      const industry = industries.find((i) => i.name === exp.industry);
      const { error: expError } = await supabase
        .from("maker_work_experience")
        .insert({
          user_id: userId,
          company: exp.company,
          position: exp.position,
          start_date: exp.startDate || null,
          end_date: exp.endDate || null,
          location: exp.location,
          industry_id: industry?.id || null,
          job_description: exp.description || null,
        });
      if (expError) console.error("Error saving work experience:", expError);
    }

    // 2. Save job references
    for (const ref of jobReferences) {
      const { error: refError } = await supabase
        .from("maker_reference")
        .insert({
          user_id: userId,
          name: ref.name,
          business_name: ref.businessName,
          email: ref.email,
          mobile_num: ref.phone,
          role: ref.role,
        });
      if (refError) console.error("Error saving job reference:", refError);
    }

    // 3. Save licenses
    for (const licenseName of licenses) {
      const licenseRecord = allLicenses.find((l) => l.name === licenseName);
      if (licenseRecord) {
        const { error: licError } = await supabase.from("maker_license").insert({
          user_id: userId,
          license_id: licenseRecord.id,
          other: licenseName === "Other" ? otherLicense : null,
        });
        if (licError) console.error("Error saving license:", licError);
      }
    }

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
                        value={exp.industry}
                        onValueChange={(value) =>
                          updateWorkExperience(exp.id, "industry", value)
                        }
                      >
                        <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind.id} value={ind.name}>
                              {ind.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Position
                      </Label>
                      <Input
                        type="text"
                        value={exp.position}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "position", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                      />
                    </div>

                    {/* Company */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Company
                      </Label>
                      <Input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "company", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Location
                      </Label>
                      <Input
                        type="text"
                        value={exp.location}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "location", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                      />
                    </div>

                    {/* Job Description */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Job Description
                      </Label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          if (e.target.value.length <= 100) {
                            updateWorkExperience(
                              exp.id,
                              "description",
                              e.target.value
                            );
                          }
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        maxLength={100}
                        className="w-full bg-gray-100 border-0 text-sm p-2 rounded resize-none overflow-hidden"
                        placeholder="Describe your responsibilities (max 100 chars)"
                      />
                      <p className="text-xs text-gray-500">
                        {exp.description.length}/100 characters
                      </p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Start Date
                        </Label>
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateWorkExperience(exp.id, "startDate", e.target.value)
                          }
                          className="h-10 bg-gray-100 border-0 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          End Date
                        </Label>
                        <Input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) =>
                            updateWorkExperience(exp.id, "endDate", e.target.value)
                          }
                          className="h-10 bg-gray-100 border-0 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {workExperiences.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    No work experience added yet. Click "Add" to start.
                  </p>
                )}
              </div>

              {/* Licenses & Tickets */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Licenses & Tickets
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3">
                  {allLicenses.map((license) => (
                    <div key={license.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={license.name}
                        checked={licenses.includes(license.name)}
                        onChange={() => toggleLicense(license.name)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                      />
                      <Label
                        htmlFor={license.name}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {license.name}
                      </Label>
                    </div>
                  ))}
                  {/* Other option */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="Other"
                      checked={licenses.includes("Other")}
                      onChange={() => toggleLicense("Other")}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                    />
                    <Label
                      htmlFor="Other"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Other
                    </Label>
                  </div>
                </div>
                {licenses.includes("Other") && (
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

                {jobReferences.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    No job references added yet. Click "Add" to start.
                  </p>
                )}
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
