// src/components/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, Check, Plus, X } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  // Core info
  const [givenName, setGivenName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState(""); // read-only
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [visaStageId, setVisaStageId] = useState<number | null>(null);
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
  const [expandedSections, setExpandedSections] = useState({
    tagline: true,
    industries: false,
    states: false,
    work: false,
    references: false,
    licenses: false,
  });

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
        setGivenName(maker.given_name);
        setMiddleName(maker.middle_name || "");
        setFamilyName(maker.family_name);
        setNationality(maker.nationality); // nationality is fixed
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

        // Visa stages eligible for this nationality
        if (maker.country_id) {
          const { data: visaStagesData } = await supabase
            .from("country_eligibility")
            .select("stage_id, visa_stage(label, sub_class, stage)")
            .eq("country_id", maker.country_id);

          if (visaStagesData) {
            const uniqueStages = Array.from(
              new Map(
                visaStagesData.map((v: any) => [
                  v.stage_id,
                  { stage_id: v.stage_id, ...v.visa_stage },
                ])
              ).values()
            );
            setVisaStages(uniqueStages);
          }
        }
      }

      // User’s visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("expiry_date, stage_id, visa_stage(label)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (visa) {
        setVisaStageId(visa.stage_id);
        setVisaExpiry(visa.expiry_date);
      }

      // Work experience
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

  // ---------------- Load Dependent Data ----------------
  useEffect(() => {
    if (!visaStageId) return;

    const loadDependencies = async () => {
      // Industries
      const { data: eligibility } = await supabase
        .from("temp_eligibility")
        .select("industry_id, industry_name")
        .eq("stage_id", visaStageId);

      if (eligibility) {
        const uniqueIndustries = Array.from(
          new Map(eligibility.map((e: any) => [e.industry_id, { id: e.industry_id, name: e.industry_name }])).values()
        );
        setIndustries(uniqueIndustries);

        // Roles
        const { data: roleData } = await supabase
          .from("industry_role")
          .select("*")
          .in("industry_id", uniqueIndustries.map((i) => i.id));

        if (roleData) {
          const uniqueRoles = Array.from(
            new Map(
              roleData.map((r: any) => [r.industry_role_id, { id: r.industry_role_id, name: r.role, industryId: r.industry_id }])
            ).values()
          );
          setRoles(uniqueRoles);
        }
      }

      // Regions
      const { data: regionData } = await supabase
        .from("region_rules")
        .select("*")
        .eq("stage_id", visaStageId);

      if (regionData) {
        const uniqueRegions = Array.from(
          new Map(regionData.map((r: any) => [`${r.state}-${r.area}`, r])).values()
        );
        setRegions(uniqueRegions);
      }
    };

    loadDependencies();
  }, [visaStageId]);

  // ---------------- Save Handler ----------------
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newErrors: any = {};
    if (!isValidAUPhone(phone)) newErrors.phone = "Invalid Australian phone";
    if (!isValidExpiry(visaExpiry)) newErrors.visaExpiry = "Expiry must be in the future";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    toast({ title: "Profile saved", description: "Your changes have been updated." });
  };

  if (loading) return <p>Loading...</p>;

  // ---------------- Render ----------------
  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Nationality */}
      <div>
        <Label>Nationality</Label>
        <Input value={nationality} disabled className="bg-gray-100 text-gray-700" />
      </div>

      {/* Visa */}
      <div>
        <Label>Visa Type</Label>
        <Select onValueChange={(val) => setVisaStageId(Number(val))} value={visaStageId?.toString() || ""}>
          <SelectTrigger>
            <SelectValue placeholder="Select visa" />
          </SelectTrigger>
          <SelectContent>
            {visaStages.map((vs) => (
              <SelectItem key={vs.stage_id} value={vs.stage_id.toString()}>
                {vs.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Collapsible: Tagline */}
      <div>
        <button
          className="flex justify-between items-center w-full py-2"
          onClick={() => setExpandedSections({ ...expandedSections, tagline: !expandedSections.tagline })}
        >
          <span className="font-medium">Tagline</span>
          {expandedSections.tagline ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.tagline && (
          <Textarea value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Add a short tagline" />
        )}
      </div>

      {/* Collapsible: Industries */}
      <div>
        <button
          className="flex justify-between items-center w-full py-2"
          onClick={() => setExpandedSections({ ...expandedSections, industries: !expandedSections.industries })}
        >
          <span className="font-medium">Industries & Roles</span>
          {expandedSections.industries ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.industries && (
          <div className="space-y-3">
            {industries.map((ind) => (
              <div key={ind.id} className="border rounded p-2">
                <label className="font-medium">{ind.name}</label>
                <div className="ml-3 space-y-1">
                  {roles.filter((r) => r.industryId === ind.id).map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRoles([...selectedRoles, role.id]);
                          else setSelectedRoles(selectedRoles.filter((id) => id !== role.id));
                        }}
                      />
                      <span>{role.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible: States */}
      <div>
        <button
          className="flex justify-between items-center w-full py-2"
          onClick={() => setExpandedSections({ ...expandedSections, states: !expandedSections.states })}
        >
          <span className="font-medium">Preferred States & Areas</span>
          {expandedSections.states ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.states && (
          <div className="space-y-2">
            {regions.map((region) => (
              <div key={region.region_rules_id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={
                    preferredStates.includes(region.state) &&
                    preferredAreas.includes(region.area)
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPreferredStates([...new Set([...preferredStates, region.state])]);
                      setPreferredAreas([...new Set([...preferredAreas, region.area])]);
                    } else {
                      setPreferredStates(preferredStates.filter((s) => s !== region.state));
                      setPreferredAreas(preferredAreas.filter((a) => a !== region.area));
                    }
                  }}
                />
                <span>{region.state} – {region.area}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible: Work Experience */}
      <div>
        <button
          className="flex justify-between items-center w-full py-2"
          onClick={() => setExpandedSections({ ...expandedSections, work: !expandedSections.work })}
        >
          <span className="font-medium">Work Experience</span>
          {expandedSections.work ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.work && (
          <div className="space-y-2">
            {workExperiences.map((exp) => (
              <div key={exp.id} className="border rounded p-2">
                <p className="font-medium">{exp.position} at {exp.company}</p>
                <p className="text-sm">{exp.startDate} - {exp.endDate || "Present"}</p>
                <p className="text-sm">{exp.location}</p>
                <p className="text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible: References */}
      <div>
        <button
          className="flex justify-between items-center w-full py-2"
          onClick={() => setExpandedSections({ ...expandedSections, references: !expandedSections.references })}
        >
          <span className="font-medium">References</span>
          {expandedSections.references ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.references && (
          <div className="space-y-2">
            {jobReferences.map((ref) => (
              <div key={ref.id} className="border rounded p-2">
                <p className="font-medium">{ref.name}</p>
                <p className="text-sm">{ref.businessName}</p>
                <p className="text-sm">{ref.email} | {ref.phone}</p>
                <p className="text-sm">{ref.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible: Licenses */}
      <div>
        <button
          className="flex justify-between items-center w-full py-2"
          onClick={() => setExpandedSections({ ...expandedSections, licenses: !expandedSections.licenses })}
        >
          <span className="font-medium">Licenses</span>
          {expandedSections.licenses ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.licenses && (
          <div className="space-y-2">
            {allLicenses.map((lic) => (
              <div key={lic.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={licenses.includes(lic.id)}
                  onChange={(e) => {
                    if (e.target.checked) setLicenses([...licenses, lic.id]);
                    else setLicenses(licenses.filter((id) => id !== lic.id));
                  }}
                />
                <span>{lic.name}</span>
              </div>
            ))}
            <Input
              value={otherLicense}
              onChange={(e) => setOtherLicense(e.target.value)}
              placeholder="Other license"
            />
          </div>
        )}
      </div>

      {/* Save button */}
      <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default WHVEditProfile;
