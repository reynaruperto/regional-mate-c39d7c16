import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";

// Industry list aligned with WHV categories
const industries = [
  "Agriculture & Farming",
  "Construction",
  "Mining",
  "Hospitality & Tourism",
  "Fishing & Pearling",
  "Forestry",
  "Aged Care & Disability Services",
];

const licenseOptions = [
  "Driver's License",
  "Forklift License",
  "White Card (Construction)",
  "RSA (Responsible Service of Alcohol)",
  "First Aid Certificate",
  "Heavy Vehicle License",
  "Other",
];

interface WorkExperience {
  id: string;
  industry: string;
  position: string;
  company: string;
  location: string;
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

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  const addWorkExperience = () => {
    if (workExperiences.length < 8) {
      setWorkExperiences([
        ...workExperiences,
        { id: Date.now().toString(), industry: "", position: "", company: "", location: "", startDate: "", endDate: "" },
      ]);
    }
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string) => {
    setWorkExperiences(workExperiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
  };

  const addJobReference = () => {
    if (jobReferences.length < 5) {
      setJobReferences([
        ...jobReferences,
        { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" },
      ]);
    }
  };

  const updateJobReference = (id: string, field: keyof JobReference, value: string) => {
    setJobReferences(jobReferences.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const removeJobReference = (id: string) => {
    setJobReferences(jobReferences.filter((ref) => ref.id !== id));
  };

  const toggleLicense = (license: string) => {
    if (licenses.includes(license)) {
      setLicenses(licenses.filter((l) => l !== license));
    } else {
      setLicenses([...licenses, license]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Work Experiences:", workExperiences);
    console.log("Licenses:", licenses, otherLicense);
    console.log("Job References:", jobReferences);

    navigate("/whv/photo-upload");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-6 flex-shrink-0"></div>

          {/* Header */}
          <div className="px-4 py-5 border-b bg-white flex-shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/whv/work-preferences")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Work Experience</h1>
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

                {workExperiences.map((exp, index) => (
                  <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">Experience {index + 1}</h3>
                      <Button type="button" variant="ghost" onClick={() => removeWorkExperience(exp.id)} className="text-red-500">
                        <X size={16} />
                      </Button>
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Industry <span className="text-red-500">*</span>
                      </Label>
                      <Select value={exp.industry} onValueChange={(value) => updateWorkExperience(exp.id, "industry", value)}>
                        <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position, Company, Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Position</Label>
                      <Input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Company</Label>
                      <Input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Location</Label>
                      <Input
                        type="text"
                        value={exp.location}
                        onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                        <Input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)}
                          className="h-10 bg-gray-100 border-0 text-sm"
                          placeholder="MM/YYYY"
                          maxLength={7}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">End Date</Label>
                        <Input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                          className="h-10 bg-gray-100 border-0 text-sm"
                          placeholder="MM/YYYY"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {workExperiences.length === 0 && (
                  <p className="text-gray-500 text-sm">No work experience added yet. Click "Add" to start.</p>
                )}
              </div>

              {/* Licenses & Tickets */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Licenses & Tickets</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3">
                  {licenseOptions.map((license) => (
                    <div key={license} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={license}
                        checked={licenses.includes(license)}
                        onChange={() => toggleLicense(license)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                      />
                      <Label htmlFor={license} className="text-sm text-gray-700 cursor-pointer">
                        {license}
                      </Label>
                    </div>
                  ))}
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

                {jobReferences.map((ref, index) => (
                  <div key={ref.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">Reference {index + 1}</h3>
                      <Button type="button" variant="ghost" onClick={() => removeJobReference(ref.id)} className="text-red-500">
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

                {jobReferences.length === 0 && (
                  <p className="text-gray-500 text-sm">No job references added yet. Click "Add" to start.</p>
                )}
              </div>

              {/* Continue Button */}
              <div className="pt-10 pb-6">
                <Button type="submit" className="w-full h-14 text-lg rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium">
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