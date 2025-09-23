import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/types/supabase";

type Job = Database["public"]["Tables"]["job"];
type JobInsert = Job["Insert"];

// ✅ Enum values directly from DB
const jobTypes = ["Full-time", "Part-time", "Casual", "Contract", "Seasonal"];
const payRanges = [
  "$25-30/hour",
  "$30-35/hour",
  "$35-40/hour",
  "$40-45/hour",
  "$45+/hour",
  "Undisclosed",
];
const yearsExperience = ["None", "<1", "1-2", "3-4", "5-7", "8-10", "10+"];
const jobStatuses = ["active", "inactive", "draft"];
const states = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

interface PostJobFormProps {
  onBack?: () => void;
  editingJob?: any;
}

const PostJobForm: React.FC<PostJobFormProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // Form state
  const [description, setDescription] = useState("");
  const [industryRoleId, setIndustryRoleId] = useState<number | null>(null);
  const [employmentType, setEmploymentType] = useState<Database["public"]["Enums"]["job_type_enum"]>(jobTypes[0] as Database["public"]["Enums"]["job_type_enum"]);
  const [salaryRange, setSalaryRange] = useState<Database["public"]["Enums"]["pay_range"]>(payRanges[0] as Database["public"]["Enums"]["pay_range"]);
  const [reqExperience, setReqExperience] = useState<Database["public"]["Enums"]["years_experience"]>(yearsExperience[0] as Database["public"]["Enums"]["years_experience"]);
  const [jobStatus, setJobStatus] = useState<Database["public"]["Enums"]["job_status"]>(jobStatuses[0] as Database["public"]["Enums"]["job_status"]);
  const [state, setState] = useState<Database["public"]["Enums"]["state"]>(states[3] as Database["public"]["Enums"]["state"]); // Default: Queensland
  const [suburbCity, setSuburbCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);

  // Load roles and licenses
  useEffect(() => {
    const loadData = async () => {
      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("mvw_emp_location_roles")
        .select("industry_role_id, industry_role")
        .limit(100);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      } else if (rolesData) {
        setRoles(
          rolesData.map((r) => ({
            id: r.industry_role_id,
            name: r.industry_role,
          }))
        );
      }

      // Load licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from("license")
        .select("license_id, name");

      if (licensesError) {
        console.error("Error fetching licenses:", licensesError);
      } else if (licensesData) {
        setLicenses(
          licensesData.map((l) => ({
            id: l.license_id,
            name: l.name,
          }))
        );
      }
    };
    loadData();
  }, []);

  // Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload: JobInsert = {
      industry_role_id: industryRoleId,
      description,
      job_status: jobStatus,
      employment_type: employmentType,
      salary_range: salaryRange,
      req_experience: reqExperience,
      state,
      suburb_city: suburbCity,
      postcode,
      start_date: startDate,
      user_id: user.id,
    };

    console.log("🚀 Attempting to save job payload:", payload);

    const { data: jobData, error } = await supabase.from("job").insert(payload).select().single();

    if (error) {
      console.error("❌ Insert job error:", error);
      alert("Failed to save job: " + error.message);
      return;
    }

    // Save licenses if any selected and job was created successfully
    if (selectedLicenses.length > 0 && jobData) {
      const licensePayload = selectedLicenses.map(licenseId => ({
        job_id: jobData.job_id,
        license_id: licenseId,
      }));

      const { error: licenseError } = await supabase
        .from("job_license")
        .insert(licensePayload);

      if (licenseError) {
        console.error("❌ Insert job licenses error:", licenseError);
        alert("Job saved but failed to save licenses: " + licenseError.message);
      }
    }

    alert("✅ Job saved successfully!");
    if (onBack) {
      onBack();
    } else {
      navigate("/employer/dashboard");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Post a Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div>
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Job description"
          />
        </div>

        {/* Role */}
        <div>
          <Label>Job Role</Label>
          <select
            value={industryRoleId ?? ""}
            onChange={(e) => setIndustryRoleId(Number(e.target.value))}
            className="border rounded-md p-2 w-full bg-background text-foreground z-50"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Type */}
        <div>
          <Label>Employment Type</Label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as Database["public"]["Enums"]["job_type_enum"])}
            className="border rounded-md p-2 w-full bg-background text-foreground z-50"
          >
            {jobTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Salary Range */}
        <div>
          <Label>Salary Range</Label>
          <select
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value as Database["public"]["Enums"]["pay_range"])}
            className="border rounded-md p-2 w-full bg-background text-foreground z-50"
          >
            {payRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>

        {/* Experience */}
        <div>
          <Label>Years of Work Experience Required</Label>
          <select
            value={reqExperience}
            onChange={(e) => setReqExperience(e.target.value as Database["public"]["Enums"]["years_experience"])}
            className="border rounded-md p-2 w-full bg-background text-foreground z-50"
          >
            {yearsExperience.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <Label>State</Label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value as Database["public"]["Enums"]["state"])}
            className="border rounded-md p-2 w-full bg-background text-foreground z-50"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Suburb + Postcode */}
        <div>
          <Label>Suburb / City</Label>
          <Input
            type="text"
            value={suburbCity}
            onChange={(e) => setSuburbCity(e.target.value)}
            placeholder="e.g. Brisbane"
          />
        </div>

        <div>
          <Label>Postcode</Label>
          <Input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. 4000"
          />
        </div>

        {/* Start Date */}
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* Licenses */}
        <div>
          <Label>Required Licenses (Optional)</Label>
          <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-background">
            {licenses.map((license) => (
              <div key={license.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id={`license-${license.id}`}
                  checked={selectedLicenses.includes(license.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLicenses([...selectedLicenses, license.id]);
                    } else {
                      setSelectedLicenses(selectedLicenses.filter(id => id !== license.id));
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor={`license-${license.id}`} className="text-sm">
                  {license.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Job Status */}
        <div>
          <Label>Job Status</Label>
          <select
            value={jobStatus}
            onChange={(e) => setJobStatus(e.target.value as Database["public"]["Enums"]["job_status"])}
            className="border rounded-md p-2 w-full bg-background text-foreground z-50"
          >
            {jobStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full">
          Save Job
        </Button>
      </form>
    </div>
  );
};

export default PostJobForm;
