import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Types
interface Country {
  country_id: number;
  name: string;
}
interface VisaStage {
  stage_id: number;
  label: string;
  sub_class: string;
  stage: number | null;
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

const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Steps
  const [step, setStep] = useState(1);

  // Personal info
  const [formData, setFormData] = useState({
    givenName: "",
    middleName: "",
    familyName: "",
    dateOfBirth: "",
    countryId: null as number | null,
    visaType: "",
    visaExpiry: "",
    phone: "",
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

  // Work experience & references
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // Licenses
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // Expanded sections (collapsible)
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    preferences: false,
    experience: false,
    licenses: false,
    references: false,
  });

  // DB Data
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [eligibility, setEligibility] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: c } = await supabase.from("country").select("*").order("name");
      if (c) setCountries(c);

      const { data: s } = await supabase.from("visa_stage").select("*").order("stage");
      if (s) setVisaStages(s);

      const { data: e } = await supabase.from("country_eligibility").select("*");
      if (e) setEligibility(e);

      const { data: ind } = await supabase.from("industry").select("industry_id, name");
      if (ind) setIndustries(ind.map(i => ({ id: i.industry_id, name: i.name })));

      const { data: lic } = await supabase.from("license").select("license_id, name");
      if (lic) setAllLicenses(lic.map(l => ({ id: l.license_id, name: l.name })));

      const { data: reg } = await supabase.from("region_rules").select("region_rules_id, state, area");
      if (reg) {
        const uniqueRegions = reg.filter(
          (r: any, idx: number, arr: any[]) =>
            arr.findIndex(x => x.state === r.state && x.area === r.area) === idx
        );
        setRegions(uniqueRegions);
      }
    };
    loadData();
  }, []);

  // Handlers
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSelect = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleIndustrySelect = (industryId: number) => {
    if (!selectedIndustries.includes(industryId) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(selectedIndustries.filter(id => id !== industryId));
      const industryRoles = roles.filter(r => r.industryId === industryId).map(r => r.id);
      setSelectedRoles(selectedRoles.filter(rid => !industryRoles.includes(rid)));
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId)
        ? selectedRoles.filter(r => r !== roleId)
        : [...selectedRoles, roleId]
    );
  };

  const togglePreferredState = (state: string) => {
    const newStates = preferredStates.includes(state)
      ? preferredStates.filter(s => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;
    setPreferredStates(newStates);

    const validAreas = regions.filter(r => newStates.includes(r.state)).map(r => r.area);
    setPreferredAreas(preferredAreas.filter(a => validAreas.includes(a)));
  };

  const togglePreferredArea = (area: string) => {
    setPreferredAreas(
      preferredAreas.includes(area)
        ? preferredAreas.filter(a => a !== area)
        : preferredAreas.length < 3
        ? [...preferredAreas, area]
        : preferredAreas
    );
  };

  const getAreasForState = (state: string) =>
    regions.filter(r => r.state === state).map(r => r.area);

  const toggleLicense = (licenseId: number) => {
    if (licenses.includes(licenseId)) {
      setLicenses(licenses.filter(l => l !== licenseId));
    } else {
      setLicenses([...licenses, licenseId]);
    }
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      { id: Date.now().toString(), industryId: null, position: "", company: "", location: "", startDate: "", endDate: "", description: "" }
    ]);
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences(workExperiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter(exp => exp.id !== id));
  };

  const addJobReference = () => {
    setJobReferences([
      ...jobReferences,
      { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" }
    ]);
  };

  const updateJobReference = (id: string, field: keyof JobReference, value: any) => {
    setJobReferences(jobReferences.map(ref => ref.id === id ? { ...ref, [field]: value } : ref));
  };

  const removeJobReference = (id: string) => {
    setJobReferences(jobReferences.filter(ref => ref.id !== id));
  };

  // Save (simplified, you can expand with proper upserts)
  const saveStep = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (step === 1) {
      await supabase.from("whv_maker").upsert({
        user_id: user.id,
        given_name: formData.givenName,
        family_name: formData.familyName,
        birth_date: formData.dateOfBirth,
        nationality: countries.find(c => c.country_id === formData.countryId)?.name || "",
        mobile_num: formData.phone,
        address_line1: formData.address1,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
      } as any, { onConflict: "user_id" });
    }

    if (step === 2) {
      await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);
    }

    if (step === 3) {
      if (workExperiences.length > 0) {
        const rows = workExperiences.map(exp => ({
          user_id: user.id,
          company: exp.company,
          position: exp.position,
          start_date: exp.startDate,
          end_date: exp.endDate,
          industry_id: exp.industryId,
          location: exp.location,
          job_description: exp.description
        }));
        await supabase.from("maker_work_experience").insert(rows);
      }
      if (licenses.length > 0) {
        const licRows = licenses.map(lid => ({
          user_id: user.id,
          license_id: lid,
          other: allLicenses.find(l => l.id === lid)?.name === "Other" ? otherLicense : null,
        }));
        await supabase.from("maker_license").upsert(licRows as any, { onConflict: "user_id,license_id" });
      }
      if (jobReferences.length > 0) {
        const refRows = jobReferences.map(ref => ({
          user_id: user.id,
          name: ref.name,
          business_name: ref.businessName,
          email: ref.email,
          mobile_num: ref.phone,
          role: ref.role
        }));
        await supabase.from("maker_reference").insert(refRows);
      }
    }

    toast({ title: "Saved", description: `Step ${step} saved successfully` });
  };

  // Render collapsible sections inside each step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Personal Information</h2>
            <Label>Given Name</Label>
            <Input value={formData.givenName} onChange={e => handleSelect("givenName", e.target.value)} />
            <Label>Family Name</Label>
            <Input value={formData.familyName} onChange={e => handleSelect("familyName", e.target.value)} />
            <Label>Date of Birth (locked)</Label>
            <Input value={formData.dateOfBirth} disabled />
            <Label>Nationality (locked)</Label>
            <Input value={countries.find(c => c.country_id === formData.countryId)?.name || ""} disabled />
            <Label>Visa Expiry</Label>
            <Input type="date" value={formData.visaExpiry} onChange={e => handleSelect("visaExpiry", e.target.value)} />
            <Label>Phone</Label>
            <Input value={formData.phone} onChange={e => handleSelect("phone", e.target.value)} />
            <Label>Address Line 1</Label>
            <Input value={formData.address1} onChange={e => handleSelect("address1", e.target.value)} />
            <Label>Suburb</Label>
            <Input value={formData.suburb} onChange={e => handleSelect("suburb", e.target.value)} />
            <Label>State</Label>
            <Input value={formData.state} onChange={e => handleSelect("state", e.target.value)} />
            <Label>Postcode</Label>
            <Input value={formData.postcode} onChange={e => handleSelect("postcode", e.target.value)} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Work Preferences</h2>
            <Label>Tagline</Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} />
            <Label>Industries (max 3)</Label>
            {industries.map(ind => (
              <div key={ind.id}>
                <input
                  type="checkbox"
                  checked={selectedIndustries.includes(ind.id)}
                  onChange={() => handleIndustrySelect(ind.id)}
                />
                <span>{ind.name}</span>
              </div>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Work Experience & References</h2>
            <Button onClick={addWorkExperience}>+ Add Work Experience</Button>
            {workExperiences.map(exp => (
              <div key={exp.id} className="border p-2 rounded">
                <Label>Company</Label>
                <Input value={exp.company} onChange={e => updateWorkExperience(exp.id, "company", e.target.value)} />
                <Label>Position</Label>
                <Input value={exp.position} onChange={e => updateWorkExperience(exp.id, "position", e.target.value)} />
              </div>
            ))}
            <h3>Licenses</h3>
            {allLicenses.map(l => (
              <div key={l.id}>
                <input
                  type="checkbox"
                  checked={licenses.includes(l.id)}
                  onChange={() => toggleLicense(l.id)}
                />
                <span>{l.name}</span>
              </div>
            ))}
            <h3>References</h3>
            <Button onClick={addJobReference}>+ Add Reference</Button>
            {jobReferences.map(ref => (
              <div key={ref.id} className="border p-2 rounded">
                <Input value={ref.name} onChange={e => updateJobReference(ref.id, "name", e.target.value)} placeholder="Name" />
                <Input value={ref.businessName} onChange={e => updateJobReference(ref.id, "businessName", e.target.value)} placeholder="Business" />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl flex flex-col">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-2"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <button onClick={() => navigate("/whv/dashboard")}>
              <ArrowLeft />
            </button>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
            <span className="text-sm">{step}/3</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">{renderStep()}</div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t bg-white">
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)} variant="outline">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={async () => {
                  await saveStep();
                  setStep(step + 1);
                }}
                className="bg-orange-500 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  await saveStep();
                  navigate("/whv/dashboard");
                }}
                className="bg-orange-500 text-white"
              >
                Save & Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
