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
  description: string;
  startDate: string;
  endDate: string;
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
  const [licenses, setLicenses] = useState<License[]>([]);

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  useEffect(() => {
    const fetchData = async () => {
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
        setLicenses(
          licenseData.map((l) => ({ id: l.license_id, name: l.name }))
        );
      }
    };

    fetchData();
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
          industry: "",
          position: "",
          company: "",
          location: "",
          description: "",
          startDate: "",
          endDate: "",
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
  // Job References Handlers
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
  // License Handlers
  // ==========================
  const toggleLicense = (id: number) => {
    if (selectedLicenses.includes(id)) {
      setSelectedLicenses(selectedLicenses.filter((l) => l !== id));
    } else {
      setSelectedLicenses([...selectedLicenses, id]);
    }
  };

  // ==========================
  // Save to Supabase
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Save work experiences
      if (workExperiences.length > 0) {
        const workRows = workExperiences.map((exp) => ({
          user_id: user.id,
          industry_id: industries.find((i) => i.name === exp.industry)?.id || null,
          position: exp.position,
          company: exp.company,
          location: exp.location,
          job_description: exp.description,
          start_date: exp.startDate,
          end_date: exp.endDate,
        }));

        await supabase.from("maker_work_experience").insert(workRows);
      }

      // 2. Save job references
      if (jobReferences.length > 0) {
        const refRows = jobReferences.map((ref) => ({
          user_id: user.id,
          name: ref.name,
          business_name: ref.businessName,
          email: ref.email,
          mobile_num: ref.phone,
          role: ref.role,
        }));

        await supabase.from("maker_reference").insert(refRows);
      }

      // 3. Save licenses
      if (selectedLicenses.length > 0) {
        const rows = selectedLicenses.map((id) => {
          const licenseName = licenses.find((l) => l.id === id)?.name;
          return {
            user_id: user.id,
            license_id: id,
            other: licenseName === "Other" ? otherLicense : null,
          };
        });

        await supabase.from("maker_license").insert(rows);
      }

      navigate("/whv/photo-upload");
    } catch (err) {
      console.error("Error saving work experience:", err);
    }
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

                    {/* Position, Company, Location */}
                    <Input
                      type="text"
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "position", e.target.value)
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "company", e.target.value)
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Location"
                      value={exp.location}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "location", e.target.value)
                      }
                    />

                    {/* Description */}
                    <Input
                      type="text"
                      placeholder="Job Description (max 100 chars)"
                      value={exp.description}
                      maxLength={100}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "description", e.target.value)
                      }
                    />

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Start Date (MM/YYYY)"
                        value={exp.startDate}
                        maxLength={7}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "startDate", e.target.value)
                        }
                      />
                      <Input
                        type="text"
                        placeholder="End Date (MM/YYYY)"
                        value={exp.endDate}
                        maxLength={7}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "endDate", e.target.value)
                        }
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
                  {licenses.map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLicenses.includes(l.id)}
                        onChange={() => toggleLicense(l.id)}
                      />
                      <Label className="text-sm">{l.name}</Label>
                    </div>
                  ))}
                </div>

                {/* Other license text */}
                {selectedLicenses.some(
                  (id) => licenses.find((l) => l.id === id)?.name === "Other"
                ) && (
                  <Input
                    type="text"
                    value={otherLicense}
                    maxLength={100}
                    onChange={(e) => setOtherLicense(e.target.value)}
                    placeholder="Specify other license"
                  />
                )}
              </div>

              {/* Job References */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Job References
                </h2>
                <Button
                  type="button"
                  onClick={addJobReference}
                  disabled={jobReferences.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>

                {jobReferences.map((ref, index) => (
                  <div
                    key={ref.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-2"
                  >
                    <h3 className="font-medium">Reference {index + 1}</h3>
                    <Input
                      placeholder="Name"
                      value={ref.name}
                      onChange={(e) =>
                        updateJobReference(ref.id, "name", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Business Name"
                      value={ref.businessName}
                      onChange={(e) =>
                        updateJobReference(ref.id, "businessName", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Email"
                      value={ref.email}
                      onChange={(e) =>
                        updateJobReference(ref.id, "email", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Phone"
                      value={ref.phone}
                      onChange={(e) =>
                        updateJobReference(ref.id, "phone", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Role"
                      value={ref.role}
                      onChange={(e) =>
                        updateJobReference(ref.id, "role", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Continue */}
              <div className="pt-10 pb-6">
                <Button type="submit" className="w-full h-14 bg-orange-500 text-white">
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

