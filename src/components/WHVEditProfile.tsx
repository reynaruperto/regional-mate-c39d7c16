// src/pages/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ---------------- Load Data ----------------
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile
      const { data: maker } = await supabase.from("whv_maker").select("*").eq("user_id", user.id).single();
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

      // Eligible industries/roles
      const { data: eligibility } = await supabase.from("temp_eligibility").select("*").eq("country_name", maker?.nationality);
      if (eligibility) {
        setIndustries(eligibility.map((e: any) => ({ id: e.industry_id, name: e.industry_name })));
        const { data: roleData } = await supabase.from("industry_role").select("*").in("industry_id", eligibility.map((e: any) => e.industry_id));
        if (roleData) {
          setRoles(roleData.map((r: any) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          })));
        }
      }

      // Regions
      const { data: regionData } = await supabase.from("region_rules").select("*");
      if (regionData) setRegions(regionData);

      // Work Experience
      const { data: exp } = await supabase.from("maker_work_experience").select("*").eq("user_id", user.id);
      if (exp) {
        setWorkExperiences(exp.map((e: any) => ({
          id: e.work_experience_id.toString(),
          industryId: e.industry_id,
          position: e.position,
          company: e.company,
          location: e.location,
          startDate: e.start_date,
          endDate: e.end_date,
          description: e.job_description,
        })));
      }

      // References
      const { data: refs } = await supabase.from("maker_reference").select("*").eq("user_id", user.id);
      if (refs) {
        setJobReferences(refs.map((r: any) => ({
          id: r.reference_id.toString(),
          name: r.name,
          businessName: r.business_name,
          email: r.email,
          phone: r.mobile_num,
          role: r.role,
        })));
      }

      // Licenses
      const { data: licData } = await supabase.from("license").select("*");
      if (licData) setAllLicenses(licData.map((l: any) => ({ id: l.license_id, name: l.name })));
      const { data: makerLic } = await supabase.from("maker_license").select("*").eq("user_id", user.id);
      if (makerLic) {
        setLicenses(makerLic.map((l: any) => l.license_id));
        const other = makerLic.find((l: any) => l.other)?.other;
        if (other) setOtherLicense(other);
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
      await supabase.from("whv_maker").update({
        mobile_num: phone,
        address_line1: address.address1,
        address_line2: address.address2,
        suburb: address.suburb,
        state: address.state,
        postcode: address.postcode,
      }).eq("user_id", user.id);

      await supabase.from("maker_visa").update({
        expiry_date: visaExpiry,
        stage_id: visaStages.find((v) => v.label === visaType)?.stage_id,
      }).eq("user_id", user.id);
    }

    if (step === 2) {
      await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);
      await supabase.from("maker_preference").delete().eq("user_id", user.id);

      for (let roleId of selectedRoles) {
        for (let state of preferredStates) {
          for (let area of preferredAreas) {
            const region = regions.find(r => r.state === state && r.area === area);
            if (region) {
              await supabase.from("maker_preference").insert({
                user_id: user.id,
                industry_role_id: roleId,
                region_rules_id: region.region_rules_id,
              });
            }
          }
        }
      }
    }

    if (step === 3) {
      // Work experiences
      await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
      for (let exp of workExperiences.slice(0, 8)) {
        await supabase.from("maker_work_experience").insert({
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

      // Licenses
      await supabase.from("maker_license").delete().eq("user_id", user.id);
      for (let lic of licenses) {
        await supabase.from("maker_license").insert({
          user_id: user.id,
          license_id: lic,
          other: allLicenses.find((l) => l.id === lic)?.name === "Other" ? otherLicense : null,
        });
      }

      // References
      await supabase.from("maker_reference").delete().eq("user_id", user.id);
      for (let ref of jobReferences.slice(0, 5)) {
        await supabase.from("maker_reference").insert({
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
            <button onClick={() => navigate("/whv/dashboard")} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-medium">Edit Profile</h1>
            <button onClick={handleSave} className="text-orange-500 font-medium flex items-center">
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* TODO: render step 1, 2, 3 content exactly as before (with labels, limits, licenses etc.) */}
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
