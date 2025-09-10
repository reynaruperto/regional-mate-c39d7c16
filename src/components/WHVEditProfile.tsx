// src/components/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ==============================
// Types
// ==============================
type AustralianState =
  | "Australian Capital Territory"
  | "New South Wales"
  | "Northern Territory"
  | "Queensland"
  | "South Australia"
  | "Tasmania"
  | "Victoria"
  | "Western Australia";

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
interface VisaStage {
  stage_id: number;
  label: string;
  sub_class: string;
  stage: number;
}
interface CountryEligibility {
  stage_id: number;
}

// ==============================
// Validation helpers
// ==============================
const isValidAUPhone = (phone: string) =>
  /^(\+614\d{8}|04\d{8})$/.test(phone);

const isValidExpiry = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const expiryDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate > today;
};

// ==============================
// Component
// ==============================
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Core state
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [visaType, setVisaType] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<{
    address1: string;
    address2: string;
    suburb: string;
    state: AustralianState | "";
    postcode: string;
  }>({
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });

  // Work preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    industries: true,
    states: false,
    summary: false,
    workExp: false,
    references: false,
  });

  // Work exp + licenses + refs
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ==============================
  // Fetch on mount
  // ==============================
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Maker
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
          state: (maker.state as AustralianState) || "",
          postcode: maker.postcode || "",
        });
      }

      // Visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          `dob, expiry_date, stage_id, country_id,
           visa_stage(stage, sub_class, label),
           country(name)`
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (visa) {
        setVisaType(visa.visa_stage.label);
        setVisaExpiry(visa.expiry_date);
        const { data: eligibility } = await supabase
          .from("country_eligibility")
          .select("stage_id")
          .eq("country_id", visa.country_id);
        if (eligibility) {
          const { data: allStages } = await supabase
            .from("visa_stage")
            .select("*");
          setVisaStages(
            allStages.filter((s) =>
              (eligibility as CountryEligibility[]).some(
                (e) => e.stage_id === s.stage_id
              )
            )
          );
        }
      }

      // Industries + roles
      const { data: industryData } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (industryData) {
        setIndustries(
          industryData.map((i: any) => ({
            id: i.industry_id,
            name: i.name,
          }))
        );
      }
      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
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
      const { data: regionData } = await supabase
        .from("region_rules")
        .select("region_rules_id, state, area");
      if (regionData) {
        const uniqueRegions = regionData.filter(
          (r, idx, arr) =>
            arr.findIndex(
              (x) => x.state === r.state && x.area === r.area
            ) === idx
        );
        setRegions(uniqueRegions);
      }

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

      // Licenses
      const { data: licData } = await supabase
        .from("license")
        .select("license_id, name");
      if (licData) {
        setAllLicenses(
          licData.map((l: any) => ({
            id: l.license_id,
            name: l.name,
          }))
        );
      }
      const { data: makerLic } = await supabase
        .from("maker_license")
        .select("*")
        .eq("user_id", user.id);
      if (makerLic) {
        setLicenses(makerLic.map((l: any) => l.license_id));
        const other = makerLic.find((l: any) => l.other)?.other;
        if (other) setOtherLicense(other);
      }

      setLoading(false);
    };
    loadProfile();
  }, []);

  // ==============================
  // Handlers
  // ==============================
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId)
        ? selectedRoles.filter((r) => r !== roleId)
        : [...selectedRoles, roleId]
    );
  };

  const toggleIndustry = (industryId: number) => {
    if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(
        selectedIndustries.filter((i) => i !== industryId)
      );
      const industryRoles = roles
        .filter((r) => r.industryId === industryId)
        .map((r) => r.id);
      setSelectedRoles(
        selectedRoles.filter((id) => !industryRoles.includes(id))
      );
    } else if (selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    }
  };

  const togglePreferredState = (state: string) => {
    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;
    setPreferredStates(newStates);

    const validAreas = regions
      .filter((r) => newStates.includes(r.state))
      .map((r) => r.area);
    setPreferredAreas(
      preferredAreas.filter((a) => validAreas.includes(a))
    );
  };

  const togglePreferredArea = (area: string) => {
    setPreferredAreas(
      preferredAreas.includes(area)
        ? preferredAreas.filter((a) => a !== area)
        : preferredAreas.length < 3
        ? [...preferredAreas, area]
        : preferredAreas
    );
  };

  // ==============================
  // TODO: Save handler (same as before)
  // ==============================

  // ==============================
  // Render
  // ==============================
  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Step 1, Step 2, Step 3 rendering here (omitted for brevity) */}
          {/* Make sure the State Select looks like this: */}
          <Select
            value={address.state}
            onValueChange={(v) =>
              setAddress({ ...address, state: v as AustralianState })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {[...new Set(regions.map((r) => r.state))].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
