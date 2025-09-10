// src/pages/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ---------------- Types ----------------
interface VisaStage {
  stage_id: number;
  label: string;
  sub_class: string;
  stage: number;
}
interface Industry {
  id: number;
  name: string;
}
interface Role {
  id: number;
  name: string;
  industryId: number;
}
interface Region {
  state: string;
  area: string;
  region_rules_id: number;
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

// ---------------- Validation ----------------
const isValidAUPhone = (phone: string) => /^(\+614\d{8}|04\d{8})$/.test(phone);
const isValidExpiry = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const expiryDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate > today;
};

// ---------------- Component ----------------
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Core info
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [visaType, setVisaType] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });

  // Preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // Work Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ---------------- Load Data ----------------
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile
      const { data: maker } = await supabase
        .from("whv_maker")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (maker) {
        setNationality(maker.nationality);
        setDob(maker.birth_date);
        setTagline(maker.tagline || "");
        setPhone(maker.mobile_num || "");
        setAddress({
          address1: maker.address_line1 || "",
          address2: maker.address_line2 || "",
          suburb: maker.suburb || "",
          state: maker.state || "",
          postcode: maker.postcode || "",
        });
      }

      // Visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("expiry_date, stage_id, visa_stage(label)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (visa) {
        setVisaType(visa.visa_stage.label);
        setVisaExpiry(visa.expiry_date);
      }
      const { data: stageData } = await supabase.from("visa_stage").select("*");
      if (stageData) setVisaStages(stageData);

      // Industries + Roles
      const { data: industryData } = await supabase.from("industry").select("*");
      if (industryData) {
        setIndustries(
          industryData.map((i: any) => ({ id: i.industry_id, name: i.name }))
        );
      }
      const { data: roleData } = await supabase.from("industry_role").select("*");
      if (roleData) {
        setRoles(
          roleData.map((r: any) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      // Regions
      const { data: regionData } = await supabase.from("region_rules").select("*");
      if (regionData) setRegions(regionData);

      // Work Experience
      const { data: exp } = await supabase
        .from("maker_work_experience")
        .select("*")
        .eq("user_id", user.id);
      if (exp) {
        setWorkExperiences(
          exp.map((e: any) => ({
            id: e.work_experience_id.toString(),
            industryId: e.industry_id,
            position: e.position,
            company: e.company,
            location: e.location,
            startDate: e.start_date,
            endDate: e.end_date,
            description: e.job_description,
          }))
        );
      }

      // References
      const { data: refs } = await supabase
        .from("maker_reference")
        .select("*")
        .eq("user_id", user.id);
      if (refs) {
        setJobReferences(
          refs.map((r: any) => ({
            id: r.reference_id.toString(),
            name: r.name,
            businessName: r.business_name,
            email: r.email,
            phone: r.mobile_num,
            role: r.role,
          }))
        );
      }

      setLoading(false);
    };
    loadData();
  }, []);

  // ---------------- Save Handler ----------------
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newErrors: any = {};
    if (!isValidAUPhone(phone)) newErrors.phone = "Invalid Australian phone";
    if (!isValidExpiry(visaExpiry)) newErrors.visaExpiry = "Expiry must be in the future";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    if (step === 1) {
      await supabase
        .from("whv_maker")
        .update({
          mobile_num: phone,
          address_line1: address.address1,
          address_line2: address.address2,
          suburb: address.suburb,
          state: address.state,
          postcode: address.postcode,
        })
        .eq("user_id", user.id);

      await supabase
        .from("maker_visa")
        .update({
          expiry_date: visaExpiry,
          stage_id: visaStages.find((v) => v.label === visaType)?.stage_id,
        })
        .eq("user_id", user.id);
    }

    if (step === 2) {
      await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);
      // TODO: clear + reinsert maker_preference (industries/roles/regions)
    }

    if (step === 3) {
      for (let exp of workExperiences) {
        await supabase.from("maker_work_experience").upsert({
          user_id: user.id,
          industry_id: exp.industryId,
          company: exp.company,
          position: exp.position,
          location: exp.location,
          start_date: exp.startDate,
          end_date: exp.endDate,
          job_description: exp.description,
        });
      }
      for (let ref of jobReferences) {
        await supabase.from("maker_reference").upsert({
          user_id: user.id,
          name: ref.name,
          business_name: ref.businessName,
          email: ref.email,
          mobile_num: ref.phone,
          role: ref.role,
        });
      }
    }

    toast({ title: "Saved", description: `Step ${step} updated` });
  };

  if (loading) return <p>Loading...</p>;

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-12 pb-4 border-b flex items-center justify-between">
            <button
              onClick={() => navigate("/whv/dashboard")}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-medium">Edit Profile</h1>
            <button
              onClick={handleSave}
              className="text-orange-500 font-medium flex items-center"
            >
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Visa & Personal Info</h2>
                <p><strong>Nationality:</strong> {nationality}</p>
                <p><strong>DOB:</strong> {dob}</p>

                <Select value={visaType} onValueChange={setVisaType}>
                  <SelectTrigger><SelectValue placeholder="Select visa" /></SelectTrigger>
                  <SelectContent>
                    {visaStages.map((v) => (
                      <SelectItem key={v.stage_id} value={v.label}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} />
                {errors.visaExpiry && <p className="text-red-500">{errors.visaExpiry}</p>}

                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="04xxxxxxxx or +614xxxxxxxx"
                />
                {errors.phone && <p className="text-red-500">{errors.phone}</p>}

                <Input value={address.address1} onChange={(e) => setAddress({ ...address, address1: e.target.value })} placeholder="Address Line 1" />
                <Input value={address.address2} onChange={(e) => setAddress({ ...address, address2: e.target.value })} placeholder="Address Line 2" />
                <Input value={address.suburb} onChange={(e) => setAddress({ ...address, suburb: e.target.value })} placeholder="Suburb" />
                <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State" />
                <Input value={address.postcode} onChange={(e) => setAddress({ ...address, postcode: e.target.value })} placeholder="Postcode" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Work Preferences</h2>
                <Textarea
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Profile tagline"
                />
                {/* industries, roles, states, areas omitted for brevity */}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                <Button
                  onClick={() =>
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
                    ])
                  }
                >
                  <Plus size={16} className="mr-1" /> Add
                </Button>
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="border p-3 rounded space-y-2">
                    <Input
                      value={exp.company}
                      onChange={(e) =>
                        setWorkExperiences(
                          workExperiences.map((w) =>
                            w.id === exp.id ? { ...w, company: e.target.value } : w
                          )
                        )
                      }
                      placeholder="Company"
                    />
                    <Input
                      value={exp.position}
                      onChange={(e) =>
                        setWorkExperiences(
                          workExperiences.map((w) =>
                            w.id === exp.id ? { ...w, position: e.target.value } : w
                          )
                        )
                      }
                      placeholder="Position"
                    />
                    <Input
                      type="date"
                      value={exp.startDate}
                      onChange={(e) =>
                        setWorkExperiences(
                          workExperiences.map((w) =>
                            w.id === exp.id ? { ...w, startDate: e.target.value } : w
                          )
                        )
                      }
                    />
                    <Input
                      type="date"
                      value={exp.endDate}
                      onChange={(e) =>
                        setWorkExperiences(
                          workExperiences.map((w) =>
                            w.id === exp.id ? { ...w, endDate: e.target.value } : w
                          )
                        )
                      }
                    />
                    <Textarea
                      value={exp.description}
                      onChange={(e) =>
                        setWorkExperiences(
                          workExperiences.map((w) =>
                            w.id === exp.id ? { ...w, description: e.target.value } : w
                          )
                        )
                      }
                      placeholder="Description"
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setWorkExperiences(workExperiences.filter((w) => w.id !== exp.id))
                      }
                    >
                      <X size={16} /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stepper */}
          <div className="p-4 flex flex-col items-center">
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-6 rounded-full ${
                    step === i ? "bg-orange-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between w-full">
              <Button
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                disabled={step === 3}
                onClick={() => setStep(step + 1)}
                className="bg-orange-500 text-white"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
