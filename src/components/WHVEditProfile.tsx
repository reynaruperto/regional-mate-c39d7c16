import React, { useState, useEffect } from "react";
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
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------
interface Country {
  country_id: number;
  name: string;
}
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

// ---------- Main ----------
const WHVEditProfile: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // General
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [eligibility, setEligibility] = useState<{ country_id: number; stage_id: number }[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);

  // Step 1: Personal Info
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

  // Step 2: Preferences
  const [tagline, setTagline] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // Step 3: Work Experience, Licenses, References
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // ---------- Load data ----------
  useEffect(() => {
    const fetchData = async () => {
      const { data: c } = await supabase.from("country").select("*").order("name");
      if (c) setCountries(c as Country[]);

      const { data: s } = await supabase.from("visa_stage").select("*").order("stage");
      if (s) setVisaStages(s as VisaStage[]);

      const { data: e } = await supabase.from("country_eligibility").select("*");
      if (e) setEligibility(e);

      const { data: ind } = await supabase.from("industry").select("industry_id, name");
      if (ind) setIndustries(ind.map((i) => ({ id: i.industry_id, name: i.name })));

      const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role, industry_id");
      if (roleData) {
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      const { data: regionData } = await supabase.from("region_rules").select("region_rules_id, state, area");
      if (regionData) {
        const uniqueRegions = regionData.filter(
          (r, idx, arr) => arr.findIndex((x) => x.state === r.state && x.area === r.area) === idx
        );
        setRegions(uniqueRegions.map((r) => ({ ...r })));
      }

      const { data: licenseData } = await supabase.from("license").select("license_id, name");
      if (licenseData) {
        setAllLicenses(licenseData.map((l) => ({ id: l.license_id, name: l.name })));
      }

      // Prefill existing user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: whv } = await supabase.from("whv_maker").select("*").eq("user_id", user.id).maybeSingle();
        if (whv) {
          setFormData((f) => ({
            ...f,
            givenName: whv.given_name,
            middleName: whv.middle_name || "",
            familyName: whv.family_name,
            dateOfBirth: whv.birth_date,
            countryId: countries.find((c) => c.name === whv.nationality)?.country_id || null,
            phone: whv.mobile_num,
            address1: whv.address_line1,
            address2: whv.address_line2 || "",
            suburb: whv.suburb,
            state: whv.state,
            postcode: whv.postcode,
          }));
          setTagline(whv.tagline || "");
        }
      }
    };
    fetchData();
  }, []);

  // ---------- Handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value });
  };

  const toggleIndustry = (id: number) => {
    if (selectedIndustries.includes(id)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== id));
      setSelectedRoles(selectedRoles.filter((r) => roles.find((ro) => ro.id === r)?.industryId !== id));
    } else if (selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, id]);
    }
  };

  const toggleRole = (id: number) => {
    setSelectedRoles(
      selectedRoles.includes(id) ? selectedRoles.filter((r) => r !== id) : [...selectedRoles, id]
    );
  };

  const toggleState = (state: string) => {
    if (preferredStates.includes(state)) {
      setPreferredStates(preferredStates.filter((s) => s !== state));
      setPreferredAreas(preferredAreas.filter((a) => regions.find((r) => r.state === state)?.area !== a));
    } else if (preferredStates.length < 3) {
      setPreferredStates([...preferredStates, state]);
    }
  };

  const toggleArea = (area: string) => {
    setPreferredAreas(
      preferredAreas.includes(area) ? preferredAreas.filter((a) => a !== area) : [...preferredAreas, area]
    );
  };

  const toggleLicense = (id: number) => {
    setLicenses(licenses.includes(id) ? licenses.filter((l) => l !== id) : [...licenses, id]);
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      { id: Date.now().toString(), industryId: null, position: "", company: "", location: "", startDate: "", endDate: "", description: "" },
    ]);
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences(workExperiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
  };

  const addJobReference = () => {
    setJobReferences([
      ...jobReferences,
      { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" },
    ]);
  };

  const updateJobReference = (id: string, field: keyof JobReference, value: string) => {
    setJobReferences(jobReferences.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const removeJobReference = (id: string) => {
    setJobReferences(jobReferences.filter((ref) => ref.id !== id));
  };

  // ---------- Save per step ----------
  const saveStep = async (step: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (step === 1) {
      await supabase.from("whv_maker").upsert({
        user_id: user.id,
        given_name: formData.givenName,
        middle_name: formData.middleName,
        family_name: formData.familyName,
        birth_date: formData.dateOfBirth,
        nationality: countries.find((c) => c.country_id === formData.countryId)?.name || "",
        mobile_num: formData.phone,
        address_line1: formData.address1,
        address_line2: formData.address2,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
      }, { onConflict: "user_id" });

      const stage = visaStages.find((v) => v.label === formData.visaType);
      if (stage && formData.countryId) {
        await supabase.from("maker_visa").upsert({
          user_id: user.id,
          country_id: formData.countryId,
          stage_id: stage.stage_id,
          dob: formData.dateOfBirth,
          expiry_date: formData.visaExpiry,
        }, { onConflict: "user_id" });
      }
    }

    if (step === 2) {
      await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);

      const preferenceRows: Array<{ user_id: string; industry_role_id: number; region_rules_id: number }> = [];
      selectedRoles.forEach((roleId) => {
        preferredStates.forEach((state) => {
          preferredAreas.forEach((area) => {
            const region = regions.find((r) => r.state === state && r.area === area);
            if (region) preferenceRows.push({ user_id: user.id, industry_role_id: roleId, region_rules_id: region.region_rules_id });
          });
        });
      });
      if (preferenceRows.length > 0) {
        await supabase.from("maker_preference").insert(preferenceRows).catch(() => {});
      }
    }

    if (step === 3) {
      const validExps = workExperiences.filter((exp) => exp.company && exp.position && exp.industryId);
      if (validExps.length > 0) {
        await supabase.from("maker_work_experience").insert(
          validExps.map((exp) => ({
            user_id: user.id,
            company: exp.company,
            position: exp.position,
            location: exp.location,
            start_date: exp.startDate,
            end_date: exp.endDate,
            industry_id: exp.industryId!,
            job_description: exp.description,
          }))
        );
      }

      if (jobReferences.length > 0) {
        await supabase.from("maker_reference").insert(
          jobReferences.map((ref) => ({
            user_id: user.id,
            name: ref.name,
            business_name: ref.businessName,
            email: ref.email,
            mobile_num: ref.phone,
            role: ref.role,
          }))
        );
      }

      if (licenses.length > 0) {
        await supabase.from("maker_license").upsert(
          licenses.map((l) => ({
            user_id: user.id,
            license_id: l,
            other: allLicenses.find((x) => x.id === l)?.name === "Other" ? otherLicense : null,
          })),
          { onConflict: "user_id,license_id" }
        );
      }
    }
  };

  const nextStep = async () => {
    await saveStep(currentStep);
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => setCurrentStep(currentStep - 1);

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl overflow-hidden">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col relative">
          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-3 h-3 rounded-full ${s === currentStep ? "bg-orange-500" : "bg-gray-300"}`} />
            ))}
          </div>

          {/* Carousel */}
          <div className="flex-1 flex transition-transform duration-500"
            style={{ transform: `translateX(-${(currentStep - 1) * 100}%)`, width: "300%" }}>
            
            {/* Step 1: Personal Info */}
            <div className="w-full flex-shrink-0 p-6 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <Label>Given Name</Label>
              <Input name="givenName" value={formData.givenName} onChange={handleChange} />
              <Label>Middle Name</Label>
              <Input name="middleName" value={formData.middleName} onChange={handleChange} />
              <Label>Family Name</Label>
              <Input name="familyName" value={formData.familyName} onChange={handleChange} />
              <Label>Nationality</Label>
              <Input value={countries.find((c) => c.country_id === formData.countryId)?.name || ""} disabled />
              <Label>Date of Birth</Label>
              <Input type="date" value={formData.dateOfBirth} disabled />
              <Label>Visa Type</Label>
              <Select value={formData.visaType} onValueChange={(v) => handleSelect("visaType", v)}>
                <SelectTrigger><SelectValue placeholder="Select visa" /></SelectTrigger>
                <SelectContent>
                  {visaStages
                    .filter((v) => formData.countryId && eligibility.some((e) => e.country_id === formData.countryId && e.stage_id === v.stage_id))
                    .map((v) => (
                      <SelectItem key={v.stage_id} value={v.label}>{v.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Label>Visa Expiry</Label>
              <Input type="date" name="visaExpiry" value={formData.visaExpiry} onChange={handleChange} />
              <Label>Phone</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} />
              <Label>Address Line 1</Label>
              <Input name="address1" value={formData.address1} onChange={handleChange} />
              <Label>Address Line 2</Label>
              <Input name="address2" value={formData.address2} onChange={handleChange} />
              <Label>Suburb</Label>
              <Input name="suburb" value={formData.suburb} onChange={handleChange} />
              <Label>State</Label>
              <Input name="state" value={formData.state} onChange={handleChange} />
              <Label>Postcode</Label>
              <Input name="postcode" value={formData.postcode} onChange={handleChange} />
            </div>

            {/* Step 2: Preferences */}
            <div className="w-full flex-shrink-0 p-6 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Work Preferences</h2>
              <Label>Tagline</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              <Label>Industries (max 3)</Label>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button key={ind.id} type="button" onClick={() => toggleIndustry(ind.id)}
                    className={`px-3 py-1 rounded-full border ${selectedIndustries.includes(ind.id) ? "bg-orange-500 text-white" : "bg-gray-100"}`}>
                    {ind.name}
                  </button>
                ))}
              </div>
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2">
                {roles.filter((r) => selectedIndustries.includes(r.industryId)).map((role) => (
                  <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                    className={`px-2 py-1 rounded-full border text-xs ${selectedRoles.includes(role.id) ? "bg-orange-500 text-white" : "bg-gray-100"}`}>
                    {role.name}
                  </button>
                ))}
              </div>
              <Label>States (max 3)</Label>
              {Array.from(new Set(regions.map((r) => r.state))).map((s) => (
                <div key={s}>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={preferredStates.includes(s)} onChange={() => toggleState(s)} />
                    <span>{s}</span>
                  </label>
                  {preferredStates.includes(s) && (
                    <div className="ml-6 flex flex-wrap gap-2">
                      {regions.filter((r) => r.state === s).map((r) => (
                        <label key={r.area} className="flex items-center space-x-2">
                          <input type="checkbox" checked={preferredAreas.includes(r.area)} onChange={() => toggleArea(r.area)} />
                          <span>{r.area}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step 3: Work Exp & References */}
            <div className="w-full flex-shrink-0 p-6 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Work Experience & References</h2>
              <Button type="button" onClick={addWorkExperience} className="bg-orange-500 text-white">Add Experience</Button>
              {workExperiences.map((exp) => (
                <div key={exp.id} className="border p-3 rounded-lg space-y-2">
                  <Label>Industry</Label>
                  <Select value={exp.industryId ? String(exp.industryId) : ""} onValueChange={(v) => updateWorkExperience(exp.id, "industryId", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => <SelectItem key={ind.id} value={String(ind.id)}>{ind.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Label>Position</Label>
                  <Input value={exp.position} onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)} />
                  <Label>Company</Label>
                  <Input value={exp.company} onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)} />
                  <Label>Location</Label>
                  <Input value={exp.location} onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)} />
                  <Label>Description</Label>
                  <Input value={exp.description} onChange={(e) => updateWorkExperience(exp.id, "description", e.target.value)} />
                  <div className="flex gap-2">
                    <Input type="date" value={exp.startDate} onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)} />
                    <Input type="date" value={exp.endDate} onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)} />
                  </div>
                  <Button type="button" onClick={() => removeWorkExperience(exp.id)} className="bg-red-500 text-white">Remove</Button>
                </div>
              ))}

              <h3 className="text-lg font-semibold mt-4">Licenses</h3>
              {allLicenses.map((l) => (
                <label key={l.id} className="flex items-center space-x-2">
                  <input type="checkbox" checked={licenses.includes(l.id)} onChange={() => toggleLicense(l.id)} />
                  <span>{l.name}</span>
                </label>
              ))}
              {licenses.some((id) => allLicenses.find((l) => l.id === id)?.name === "Other") && (
                <Input value={otherLicense} onChange={(e) => setOtherLicense(e.target.value)} placeholder="Other license" />
              )}

              <h3 className="text-lg font-semibold mt-4">References</h3>
              <Button type="button" onClick={addJobReference} className="bg-orange-500 text-white">Add Reference</Button>
              {jobReferences.map((ref) => (
                <div key={ref.id} className="border p-3 rounded-lg space-y-2">
                  <Label>Name</Label>
                  <Input value={ref.name} onChange={(e) => updateJobReference(ref.id, "name", e.target.value)} />
                  <Label>Business</Label>
                  <Input value={ref.businessName} onChange={(e) => updateJobReference(ref.id, "businessName", e.target.value)} />
                  <Label>Email</Label>
                  <Input value={ref.email} onChange={(e) => updateJobReference(ref.id, "email", e.target.value)} />
                  <Label>Phone</Label>
                  <Input value={ref.phone} onChange={(e) => updateJobReference(ref.id, "phone", e.target.value)} />
                  <Label>Role</Label>
                  <Input value={ref.role} onChange={(e) => updateJobReference(ref.id, "role", e.target.value)} />
                  <Button type="button" onClick={() => removeJobReference(ref.id)} className="bg-red-500 text-white">Remove</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            {currentStep > 1 && (
              <Button onClick={prevStep} className="bg-gray-200 text-gray-800">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={nextStep} className="ml-auto bg-orange-500 text-white">
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={async () => { await saveStep(3); }} className="ml-auto bg-green-600 text-white">
                <Check className="w-4 h-4 mr-1" /> Save & Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
