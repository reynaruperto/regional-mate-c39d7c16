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

  // ==========================
  // Load industries, roles, licenses
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

      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
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

  const updateWorkExperience = (
    id: string,
    field: keyof WorkExperience,
    value: any
  ) => {
    setWorkExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
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
    setJobReferences((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref))
    );
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // ==========================
  // License handlers
  // ==========================
  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) =>
      prev.includes(licenseId)
        ? prev.filter((l) => l !== licenseId)
        : [...prev, licenseId]
    );
  };

  // ==========================
  // Save helpers
  // ==========================
  const saveWorkExperiences = async (userId: string) => {
    await supabase.from("maker_work_experience").delete().eq("user_id", userId);

    const validRows = workExperiences.filter(
      (exp) =>
        exp.company.trim() &&
        exp.roleId !== null &&
        exp.industryId !== null &&
        exp.startDate &&
        exp.endDate
    );

    if (validRows.length === 0) return;

    const workRows = validRows.map((exp) => {
      const roleName = roles.find((r) => r.id === exp.roleId)?.name || "";
      return {
        user_id: userId,
        company: exp.company.trim(),
        industry_id: exp.industryId!,
        position: roleName, // ✅ save role name
        start_date: exp.startDate,
        end_date: exp.endDate,
        location: exp.location || null,
        job_description: exp.description || null,
      };
    });

    const { error } = await supabase.from("maker_work_experience").insert(workRows);
    if (error) console.error("❌ Work experience insert failed:", error);
  };

  const saveJobReferences = async (userId: string) => {
    await supabase.from("maker_reference").delete().eq("user_id", userId);

    if (jobReferences.length === 0) return;

    const refRows = jobReferences.map((ref) => ({
      user_id: userId,
      name: ref.name?.trim() || null,
      business_name: ref.businessName?.trim() || null,
      email: ref.email?.trim() || null,
      mobile_num: ref.phone?.trim() || null,
      role: ref.role?.trim() || null,
    }));

    const { error } = await supabase.from("maker_reference").insert(refRows);
    if (error) console.error("❌ Job reference insert failed:", error);
  };

  const saveLicenses = async (userId: string) => {
    await supabase.from("maker_license").delete().eq("user_id", userId);

    if (licenses.length === 0) return;

    const licRows = licenses.map((licenseId) => ({
      user_id: userId,
      license_id: licenseId,
      other:
        allLicenses.find((l) => l.id === licenseId)?.name === "Other"
          ? otherLicense
          : null,
    }));

    const { error } = await supabase.from("maker_license").insert(licRows);
    if (error) console.error("❌ License insert failed:", error);
  };

  // ==========================
  // Submit handler
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const userId = user.id;

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
              {/* ... (keep your JSX form rendering here unchanged) ... */}

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
