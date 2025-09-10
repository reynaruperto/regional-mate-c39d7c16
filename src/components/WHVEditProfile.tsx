import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(1);

  // Personal info
  const [formData, setFormData] = useState({
    givenName: "",
    middleName: "",
    familyName: "",
    dateOfBirth: "",
    nationality: "",
    visaType: "",
    visaExpiry: "",
    phone: "",
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [visaStages, setVisaStages] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any[]>([]);

  // Work preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // Work exp + refs
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // Load initial
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Countries, visas, eligibility
      const { data: c } = await supabase.from("country").select("country_id,name");
      if (c) setCountries(c.map((x) => ({ id: x.country_id, name: x.name })));
      const { data: v } = await supabase.from("visa_stage").select("*");
      if (v) setVisaStages(v);
      const { data: e } = await supabase.from("country_eligibility").select("*");
      if (e) setEligibility(e);

      // User profile
      const { data: profile } = await supabase.from("whv_maker").select("*").eq("user_id", user.id).maybeSingle();
      if (profile) {
        setFormData((f) => ({
          ...f,
          givenName: profile.given_name || "",
          middleName: profile.middle_name || "",
          familyName: profile.family_name || "",
          dateOfBirth: profile.birth_date || "",
          nationality: profile.nationality || "",
          phone: profile.mobile_num || "",
          address1: profile.address_line1 || "",
          address2: profile.address_line2 || "",
          suburb: profile.suburb || "",
          state: profile.state || "",
          postcode: profile.postcode || "",
        }));
        setTagline(profile.tagline || "");
      }

      // Visa
      const { data: visa } = await supabase.from("maker_visa").select("*").eq("user_id", user.id).maybeSingle();
      if (visa) {
        setFormData((f) => ({
          ...f,
          visaType: visa.stage_id?.toString() || "",
          visaExpiry: visa.expiry_date || "",
        }));
      }

      // Industries
      const { data: inds } = await supabase.from("industry").select("industry_id,name");
      if (inds) setIndustries(inds.map((i) => ({ id: i.industry_id, name: i.name })));

      // Roles
      const { data: r } = await supabase.from("industry_role").select("industry_role_id,role,industry_id");
      if (r) setRoles(r.map((x) => ({ id: x.industry_role_id, name: x.role, industryId: x.industry_id })));

      // Regions
      const { data: reg } = await supabase.from("region_rules").select("region_rules_id,state,area");
      if (reg) setRegions(reg);

      // Licenses
      const { data: l } = await supabase.from("license").select("license_id,name");
      if (l) setAllLicenses(l.map((x) => ({ id: x.license_id, name: x.name })));
    };
    load();
  }, []);

  // Save step
  const saveStep = async (step: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (step === 1) {
      await supabase.from("whv_maker").upsert({
        user_id: user.id,
        given_name: formData.givenName,
        middle_name: formData.middleName || null,
        family_name: formData.familyName,
        birth_date: formData.dateOfBirth,
        nationality: formData.nationality,
        mobile_num: formData.phone,
        address_line1: formData.address1,
        address_line2: formData.address2 || null,
        suburb: formData.suburb,
        state: formData.state as any,
        postcode: formData.postcode,
      } as any, { onConflict: "user_id" });

      await supabase.from("maker_visa").upsert({
        user_id: user.id,
        country_id: countries.find(c => c.name === formData.nationality)?.id || 0,
        stage_id: Number(formData.visaType),
        dob: formData.dateOfBirth,
        expiry_date: formData.visaExpiry,
      } as any, { onConflict: "user_id" });
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
        const { error } = await supabase.from("maker_preference").insert(preferenceRows);
        if (error) console.warn("Preference insert skipped:", error.message);
      }
    }

    if (step === 3) {
      const validRows = workExperiences.filter((exp) =>
        exp.company && exp.position && exp.industryId && exp.startDate && exp.endDate
      );
      if (validRows.length > 0) {
        await supabase.from("maker_work_experience").insert(validRows.map((exp) => ({
          user_id: user.id,
          company: exp.company,
          position: exp.position,
          start_date: exp.startDate,
          end_date: exp.endDate,
          location: exp.location || null,
          industry_id: exp.industryId!,
          job_description: exp.description || null,
        })) as any);
      }
      if (jobReferences.length > 0) {
        await supabase.from("maker_reference").insert(jobReferences.map((ref) => ({
          user_id: user.id,
          name: ref.name,
          business_name: ref.businessName,
          email: ref.email,
          mobile_num: ref.phone,
          role: ref.role,
        })) as any);
      }
      if (licenses.length > 0) {
        await supabase.from("maker_license").upsert(licenses.map((lid) => ({
          user_id: user.id,
          license_id: lid,
          other: allLicenses.find((l) => l.id === lid)?.name === "Other" ? otherLicense : null,
        })) as any, { onConflict: "user_id,license_id" });
      }
    }
  };

  // Step navigation
  const nextStep = async () => { await saveStep(currentStep); setCurrentStep((s) => Math.min(3, s + 1)); };
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleIndustry = (id: number) =>
    setSelectedIndustries((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
  const toggleRole = (id: number) =>
    setSelectedRoles((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleState = (st: string) =>
    setPreferredStates((s) => s.includes(st) ? s.filter((x) => x !== st) : s.length < 3 ? [...s, st] : s);
  const toggleArea = (a: string) =>
    setPreferredAreas((s) => s.includes(a) ? s.filter((x) => x !== a) : [...s, a]);

  const addWorkExperience = () =>
    setWorkExperiences([...workExperiences, { id: Date.now().toString(), industryId: null, position: "", company: "", location: "", startDate: "", endDate: "", description: "" }]);
  const updateWorkExperience = (id: string, field: keyof WorkExperience, val: any) =>
    setWorkExperiences(workExperiences.map((exp) => exp.id === id ? { ...exp, [field]: val } : exp));
  const removeWorkExperience = (id: string) =>
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));

  const addJobReference = () =>
    setJobReferences([...jobReferences, { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" }]);
  const updateJobReference = (id: string, field: keyof JobReference, val: any) =>
    setJobReferences(jobReferences.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const removeJobReference = (id: string) =>
    setJobReferences(jobReferences.filter((r) => r.id !== id));

  const toggleLicense = (lid: number) =>
    setLicenses((s) => s.includes(lid) ? s.filter((x) => x !== lid) : [...s, lid]);

  // UI
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Progress */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-3 h-3 rounded-full ${currentStep === s ? "bg-orange-500" : "bg-gray-300"}`} />
            ))}
          </div>

          {/* Carousel */}
          <div className="flex-1 flex transition-transform duration-500" style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}>
            {/* Step 1 */}
            <div className="w-full flex-shrink-0 p-6 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <Label>Given Name</Label><Input name="givenName" value={formData.givenName} onChange={handleChange} />
              <Label>Middle Name</Label><Input name="middleName" value={formData.middleName} onChange={handleChange} />
              <Label>Family Name</Label><Input name="familyName" value={formData.familyName} onChange={handleChange} />
              <Label>Nationality</Label><Input value={formData.nationality} disabled />
              <Label>Date of Birth</Label><Input type="date" value={formData.dateOfBirth} disabled />
              <Label>Visa Type</Label>
              <Select value={formData.visaType} onValueChange={(v) => setFormData({ ...formData, visaType: v })}>
                <SelectTrigger><SelectValue placeholder="Select visa" /></SelectTrigger>
                <SelectContent>{visaStages.map((v) => <SelectItem key={v.stage_id} value={String(v.stage_id)}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
              <Label>Visa Expiry</Label><Input type="date" name="visaExpiry" value={formData.visaExpiry} onChange={handleChange} />
              <Label>Phone</Label><Input name="phone" value={formData.phone} onChange={handleChange} />
              <Label>Address Line 1</Label><Input name="address1" value={formData.address1} onChange={handleChange} />
              <Label>Address Line 2</Label><Input name="address2" value={formData.address2} onChange={handleChange} />
              <Label>Suburb</Label><Input name="suburb" value={formData.suburb} onChange={handleChange} />
              <Label>State</Label><Input name="state" value={formData.state} onChange={handleChange} />
              <Label>Postcode</Label><Input name="postcode" value={formData.postcode} onChange={handleChange} />
            </div>

            {/* Step 2 */}
            <div className="w-full flex-shrink-0 p-6 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Work Preferences</h2>
              <Label>Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              <Label>Industries (max 3)</Label>
              {industries.map((ind) => (
                <label key={ind.id} className="flex items-center space-x-2">
                  <input type="checkbox" checked={selectedIndustries.includes(ind.id)} onChange={() => toggleIndustry(ind.id)} />
                  <span>{ind.name}</span>
                </label>
              ))}
              {selectedIndustries.map((iid) => {
                const industry = industries.find((i) => i.id === iid);
                const industryRoles = roles.filter((r) => r.industryId === iid);
                return (
                  <div key={iid}>
                    <Label>Roles for {industry?.name}</Label>
                    <div className="flex flex-wrap gap-2">
                      {industryRoles.map((role) => (
                        <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                          className={`px-3 py-1 rounded-full text-sm border ${selectedRoles.includes(role.id) ? "bg-orange-500 text-white" : "bg-white"}`}>
                          {role.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <Label>States (max 3)</Label>
              {[...new Set(regions.map((r) => r.state))].map((s) => (
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

            {/* Step 3 */}
            <div className="w-full flex-shrink-0 p-6 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Work Experience & References</h2>
              <Button type="button" onClick={addWorkExperience} className="bg-orange-500 text-white">Add Experience</Button>
              {workExperiences.map((exp) => (
                <div key={exp.id} className="border p-3 rounded-lg space-y-2">
                  <Label>Industry</Label>
                  <Select value={exp.industryId ? String(exp.industryId) : ""} onValueChange={(v) => updateWorkExperience(exp.id, "industryId", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{industries.map((ind) => <SelectItem key={ind.id} value={String(ind.id)}>{ind.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Label>Position</Label><Input value={exp.position} onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)} />
                  <Label>Company</Label><Input value={exp.company} onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)} />
                  <Label>Location</Label><Input value={exp.location} onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)} />
                  <Label>Description</Label><Input value={exp.description} onChange={(e) => updateWorkExperience(exp.id, "description", e.target.value)} />
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
                  <Label>Name</Label><Input value={ref.name} onChange={(e) => updateJobReference(ref.id, "name", e.target.value)} />
                  <Label>Business</Label><Input value={ref.businessName} onChange={(e) => updateJobReference(ref.id, "businessName", e.target.value)} />
                  <Label>Email</Label><Input value={ref.email} onChange={(e) => updateJobReference(ref.id, "email", e.target.value)} />
                  <Label>Phone</Label><Input value={ref.phone} onChange={(e) => updateJobReference(ref.id, "phone", e.target.value)} />
                  <Label>Role</Label><Input value={ref.role} onChange={(e) => updateJobReference(ref.id, "role", e.target.value)} />
                  <Button type="button" onClick={() => removeJobReference(ref.id)} className="bg-red-500 text-white">Remove</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            {currentStep > 1 && <Button onClick={prevStep} className="bg-gray-200 text-gray-800"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>}
            {currentStep < 3 ? (
              <Button onClick={nextStep} className="ml-auto bg-orange-500 text-white">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
            ) : (
              <Button onClick={async () => { await saveStep(3); }} className="ml-auto bg-green-600 text-white"><Check className="w-4 h-4 mr-1" /> Save & Finish</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
