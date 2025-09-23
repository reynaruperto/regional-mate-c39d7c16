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
  const [employmentType, setEmploymentType] = useState<Database["public"]["Enums"]["employment_type"]>(jobTypes[0] as Database["public"]["Enums"]["employment_type"]);
  const [salaryRange, setSalaryRange] = useState<Database["public"]["Enums"]["pay_range"]>(payRanges[0] as Database["public"]["Enums"]["pay_range"]);
  const [reqExperience, setReqExperience] = useState<Database["public"]["Enums"]["years_experience"]>(yearsExperience[0] as Database["public"]["Enums"]["years_experience"]);
  const [jobStatus, setJobStatus] = useState<Database["public"]["Enums"]["job_status"]>(jobStatuses[0] as Database["public"]["Enums"]["job_status"]);
  const [state, setState] = useState<Database["public"]["Enums"]["state"]>(states[3] as Database["public"]["Enums"]["state"]); // Default: Queensland
  const [suburbCity, setSuburbCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  // Load roles (can later be tied to industry selection if needed)
  useEffect(() => {
    const loadRoles = async () => {
      const { data, error } = await supabase
        .from("mvw_emp_location_roles")
        .select("industry_role_id, industry_role")
        .limit(100);

      if (error) {
        console.error("Error fetching roles:", error);
      } else if (data) {
        setRoles(
          data.map((r) => ({
            id: r.industry_role_id,
            name: r.industry_role,
          }))
        );
      }
    };
    loadRoles();
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

    const { error } = await supabase.from("job").insert(payload);

    if (error) {
      console.error("❌ Insert job error:", error);
      alert("Failed to save job: " + error.message);
    } else {
      alert("✅ Job saved successfully!");
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
            className="border rounded-md p-2 w-full"
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
            onChange={(e) => setEmploymentType(e.target.value as Database["public"]["Enums"]["employment_type"])}
            className="border rounded-md p-2 w-full"
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
            className="border rounded-md p-2 w-full"
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
            className="border rounded-md p-2 w-full"
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
            className="border rounded-md p-2 w-full"
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

        {/* Job Status */}
        <div>
          <Label>Job Status</Label>
          <select
            value={jobStatus}
            onChange={(e) => setJobStatus(e.target.value as Database["public"]["Enums"]["job_status"])}
            className="border rounded-md p-2 w-full"
          >
            {jobStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full bg-orange-500 text-white">
          Save Job
        </Button>
      </form>
    </div>
  );
};

export default PostJobForm;
