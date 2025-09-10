import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ==========================
// Types
// ==========================
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
interface CountryEligibility {
  country_id: number;
  stage_id: number;
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

// ==========================
// Component
// ==========================
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 – Profile
  const [formData, setFormData] = useState({
    givenName: "",
    middleName: "",
    familyName: "",
    dateOfBirth: "",
    countryId: null as number | null,
    countryName: "",
    visaType: "",
    visaExpiry: "",
    phone: "",
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [eligibility, setEligibility] = useState<CountryEligibility[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Step 2 – Preferences
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
  });

  // Step 3 – Work Exp
  const [industriesWork, setIndustriesWork] = useState<Industry[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [expandedSections3, setExpandedSections3] = useState({
    workExp: true,
    licenses: false,
    references: false,
  });

  // ==========================
  // Load Step 1 Data
  // ==========================
  useEffect(() => {
    if (step !== 1) return;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("whv_maker").select("*").eq("user_id", user.id).maybeSingle();
      if (profile) {
        setFormData(prev => ({
          ...prev,
          givenName: profile.given_name,
          middleName: profile.middle_name || "",
          familyName: profile.family_name,
          dateOfBirth: profile.birth_date,
          countryName: profile.nationality,
          phone: profile.mobile_num,
          address1: profile.address_line1,
          address2: profile.address_line2 || "",
          suburb: profile.suburb,
          state: profile.state,
          postcode: profile.postcode,
        }));
      }

      const { data: visa } = await supabase.from("maker_visa").select("*").eq("user_id", user.id).maybeSingle();
      if (visa) {
        setFormData(prev => ({
          ...prev,
          visaType: visa.stage_id?.toString() || "",
          visaExpiry: visa.expiry_date,
          countryId: visa.country_id,
        }));
      }

      const { data: countriesData } = await supabase.from("country").select("*").order("name");
      const { data: stagesData } = await supabase.from("visa_stage").select("*").order("stage");
      const { data: eligibilityData } = await supabase.from("country_eligibility").select("*");
      if (countriesData) setCountries(countriesData as any);
      if (stagesData) setVisaStages(stagesData as any);
      if (eligibilityData) setEligibility(eligibilityData as any);
    };

    fetchData();
  }, [step]);

  // ==========================
  // Save Step 1
  // ==========================
  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("whv_maker").update({
      given_name: formData.givenName,
      middle_name: formData.middleName || null,
      family_name: formData.familyName,
      mobile_num: formData.phone,
      address_line1: formData.address1,
      address_line2: formData.address2 || null,
      suburb: formData.suburb,
      state: formData.state,
      postcode: formData.postcode,
    }).eq("user_id", user.id);

    await supabase.from("maker_visa").update({
      expiry_date: formData.visaExpiry,
      stage_id: Number(formData.visaType),
    }).eq("user_id", user.id);

    setStep(2);
  };

  // ==========================
  // Load Step 2 Data
  // ==========================
  useEffect(() => {
    if (step !== 2) return;

    const loadPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("whv_maker").select("tagline").eq("user_id", user.id).maybeSingle();
      if (profile) setTagline(profile.tagline || "");

      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, visa_stage:visa_stage(stage, sub_class, label), country:country(name)")
        .eq("user_id", user.id).maybeSingle();

      if (!visa) return;

      const { data: eligibleIndustries } = await supabase
        .from("temp_eligibility")
        .select("industry_id, industry_name")
        .eq("sub_class", visa.visa_stage.sub_class)
        .eq("stage", visa.visa_stage.stage)
        .eq("country_name", visa.country.name)
        .returns<{ industry_id: number; industry_name: string }[]>();

      if (eligibleIndustries) {
        setIndustries(eligibleIndustries.map(i => ({ id: i.industry_id, name: i.industry_name })));
        const industryIds = eligibleIndustries.map(i => i.industry_id);

        const { data: roleData } = await supabase.from("industry_role").select("industry_role_id, role, industry_id").in("industry_id", industryIds);
        if (roleData) setRoles(roleData.map(r => ({ id: r.industry_role_id, name: r.role, industryId: r.industry_id })));
      }

      const { data: regionData } = await supabase.from("region_rules").select("region_rules_id, state, area");
      if (regionData) {
        const uniqueRegions = regionData.filter((r, idx, arr) =>
          arr.findIndex(x => x.state === r.state && x.area === r.area) === idx
        );
        setRegions(uniqueRegions.map(r => ({ state: r.state, area: r.area, region_rules_id: r.region_rules_id })));
      }

      const { data: prefs } = await supabase.from("maker_preference").select("industry_role_id, region_rules_id").eq("user_id", user.id);
      if (prefs && prefs.length > 0) {
        setSelectedRoles(prefs.map(p => p.industry_role_id));
      }
    };
    loadPreferences();
  }, [step]);

  // ==========================
  // Save Step 2
  // ==========================
  const handleSavePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("whv_maker").update({ tagline }).eq("user_id", user.id);
    await supabase.from("maker_preference").delete().eq("user_id", user.id);

    const preferenceRows: Array<{ user_id: string; industry_role_id: number; region_rules_id: number }> = [];
    selectedRoles.forEach(roleId => {
      preferredStates.forEach(state => {
        preferredAreas.forEach(area => {
          const region = regions.find(r => r.state === state && r.area === area);
          if (region) {
            preferenceRows.push({ user_id: user.id, industry_role_id: roleId, region_rules_id: region.region_rules_id });
          }
        });
      });
    });

    if (preferenceRows.length > 0) {
      await supabase.from("maker_preference").insert(preferenceRows);
    }

    setStep(3);
  };

  // ==========================
  // Load Step 3 Data
  // ==========================
  useEffect(() => {
    if (step !== 3) return;

    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: industryData } = await supabase.from("industry").select("industry_id, name");
      if (industryData) setIndustriesWork(industryData.map(i => ({ id: i.industry_id, name: i.name })));

      const { data: licenseData } = await supabase.from("license").select("license_id, name");
      if (licenseData) setAllLicenses(licenseData.map(l => ({ id: l.license_id, name: l.name })));

      const { data: expData } = await supabase.from("maker_work_experience").select("*").eq("user_id", user.id);
      if (expData) {
        setWorkExperiences(expData.map((e: any) => ({
          id: e.id || Date.now().toString(),
          industryId: e.industry_id,
          position: e.position,
          company: e.company,
          location: e.location || "",
          startDate: e.start_date,
          endDate: e.end_date,
          description: e.job_description || "",
        })));
      }

      const { data: refData } = await supabase.from("maker_reference").select("*").eq("user_id", user.id);
      if (refData) {
        setJobReferences(refData.map((r: any) => ({
          id: r.id || Date.now().toString(),
          name: r.name,
          businessName: r.business_name,
          email: r.email,
          phone: r.mobile_num,
          role: r.role,
        })));
      }

      const { data: userLicenses } = await supabase.from("maker_license").select("*").eq("user_id", user.id);
      if (userLicenses) {
        setLicenses(userLicenses.map((l: any) => l.license_id));
        const other = userLicenses.find((l: any) => l.other);
        if (other) setOtherLicense(other.other);
      }
    };
    loadData();
  }, [step]);

  // ==========================
  // Save Step 3
  // ==========================
  const handleSaveWork = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
    await supabase.from("maker_reference").delete().eq("user_id", user.id);
    await supabase.from("maker_license").delete().eq("user_id", user.id);

    if (workExperiences.length > 0) {
      const rows = workExperiences
        .filter(e => e.company && e.position && e.industryId)
        .map(e => ({
          user_id: user.id,
          company: e.company,
          position: e.position,
          start_date: e.startDate,
          end_date: e.endDate,
          location: e.location || null,
          industry_id: e.industryId!,
          job_description: e.description || null,
        }));
      if (rows.length > 0) await supabase.from("maker_work_experience").insert(rows);
    }

    if (jobReferences.length > 0) {
      const rows = jobReferences.map(r => ({
        user_id: user.id,
        name: r.name,
        business_name: r.businessName,
        email: r.email,
        mobile_num: r.phone,
        role: r.role,
      }));
      if (rows.length > 0) await supabase.from("maker_reference").insert(rows);
    }

    if (licenses.length > 0) {
      const rows = licenses.map(lid => ({
        user_id: user.id,
        license_id: lid,
        other: allLicenses.find(l => l.id === lid)?.name === "Other" ? otherLicense : null,
      }));
      if (rows.length > 0) await supabase.from("maker_license").insert(rows);
    }

    navigate("/whv/dashboard");
  };

  // ==========================
  // Render
  // ==========================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <button onClick={() => navigate("/whv/dashboard")} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Profile</h1>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><span>1/3</span></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Label>Given Name</Label>
              <Input value={formData.givenName} onChange={e => setFormData({ ...formData, givenName: e.target.value })} />
              <Label>Middle Name</Label>
              <Input value={formData.middleName} onChange={e => setFormData({ ...formData, middleName: e.target.value })} />
              <Label>Family Name</Label>
              <Input value={formData.familyName} onChange={e => setFormData({ ...formData, familyName: e.target.value })} />

              <Label>Nationality</Label>
              <Input value={formData.countryName} disabled />

              <Label>Date of Birth</Label>
              <Input value={formData.dateOfBirth} disabled />

              <Label>Visa Expiry</Label>
              <Input type="date" value={formData.visaExpiry} onChange={e => setFormData({ ...formData, visaExpiry: e.target.value })} />

              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />

              <Label>Address 1</Label>
              <Input value={formData.address1} onChange={e => setFormData({ ...formData, address1: e.target.value })} />
              <Label>Address 2</Label>
              <Input value={formData.address2} onChange={e => setFormData({ ...formData, address2: e.target.value })} />
              <Label>Suburb</Label>
              <Input value={formData.suburb} onChange={e => setFormData({ ...formData, suburb: e.target.value })} />
              <Label>State</Label>
              <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
              <Label>Postcode</Label>
              <Input value={formData.postcode} onChange={e => setFormData({ ...formData, postcode: e.target.value })} />
            </div>

            <div className="p-4 border-t flex justify-end">
              <Button className="bg-orange-500 text-white" onClick={handleSaveProfile}>Save & Continue</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <button onClick={() => setStep(1)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Preferences</h1>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><span>2/3</span></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Tagline */}
              <div className="border rounded-lg">
                <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, tagline: !prev.tagline }))} className="w-full flex justify-between p-4">
                  <span>Tagline</span>{expandedSections.tagline ? <ChevronDown /> : <ChevronRight />}
                </button>
                {expandedSections.tagline && (
                  <div className="px-4 pb-4 border-t">
                    <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Ready for farm work" />
                  </div>
                )}
              </div>
              {/* Industries & Roles */}
              <div className="border rounded-lg">
                <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, industries: !prev.industries }))} className="w-full flex justify-between p-4">
                  <span>Industries & Roles</span>{expandedSections.industries ? <ChevronDown /> : <ChevronRight />}
                </button>
                {expandedSections.industries && (
                  <div className="px-4 pb-4 border-t">
                    {industries.map(ind => (
                      <div key={ind.id}>
                        <label>
                          <input type="checkbox" checked={selectedIndustries.includes(ind.id)} onChange={() => {
                            if (selectedIndustries.includes(ind.id)) setSelectedIndustries(selectedIndustries.filter(i => i !== ind.id));
                            else setSelectedIndustries([...selectedIndustries, ind.id]);
                          }} /> {ind.name}
                        </label>
                        {selectedIndustries.includes(ind.id) && (
                          <div className="ml-6">
                            {roles.filter(r => r.industryId === ind.id).map(r => (
                              <button key={r.id} type="button" onClick={() => setSelectedRoles(
                                selectedRoles.includes(r.id) ? selectedRoles.filter(x => x !== r.id) : [...selectedRoles, r.id]
                              )} className={`px-3 py-1.5 rounded-full text-xs border m-1 ${selectedRoles.includes(r.id) ? "bg-orange-500 text-white" : ""}`}>{r.name}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Locations */}
              <div className="border rounded-lg">
                <button type="button" onClick={() => setExpandedSections(prev => ({ ...prev, states: !prev.states }))} className="w-full flex justify-between p-4">
                  <span>Preferred Locations</span>{expandedSections.states ? <ChevronDown /> : <ChevronRight />}
                </button>
                {expandedSections.states && (
                  <div className="px-4 pb-4 border-t">
                    {[...new Set(regions.map(r => r.state))].map(state => (
                      <div key={state}>
                        <label>
                          <input type="checkbox" checked={preferredStates.includes(state)} onChange={() =>
                            setPreferredStates(preferredStates.includes(state) ? preferredStates.filter(s => s !== state) : [...preferredStates, state])
                          } /> {state}
                        </label>
                        {preferredStates.includes(state) && (
                          <div className="ml-6">
                            {regions.filter(r => r.state === state).map(r => (
                              <label key={r.region_rules_id} className="block">
                                <input type="checkbox" checked={preferredAreas.includes(r.area)} onChange={() =>
                                  setPreferredAreas(preferredAreas.includes(r.area) ? preferredAreas.filter(a => a !== r.area) : [...preferredAreas, r.area])
                                } /> {r.area}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="bg-orange-500 text-white" onClick={handleSavePreferences}>Save & Continue</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <button onClick={() => setStep(2)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Work Experience</h1>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><span>3/3</span></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Work Experience */}
              <div className="border rounded-lg">
                <button type="button" onClick={() => setExpandedSections3(prev => ({ ...prev, workExp: !prev.workExp }))} className="w-full flex justify-between p-4">
                  <span>Work Experience</span>{expandedSections3.workExp ? <ChevronDown /> : <ChevronRight />}
                </button>
                {expandedSections3.workExp && (
                  <div className="px-4 pb-4 border-t">
                    <Button type="button" onClick={() => {
                      if (workExperiences.length < 8) setWorkExperiences([...workExperiences, {
                        id: Date.now().toString(), industryId: null, position: "", company: "", location: "", startDate: "", endDate: "", description: ""
                      }]);
                    }} className="bg-orange-500 text-white my-2"><Plus size={16} className="mr-1" /> Add</Button>
                    {workExperiences.map((exp, idx) => (
                      <div key={exp.id} className="border rounded-lg p-2 mb-2">
                        <div className="flex justify-between">
                          <span>Experience {idx + 1}</span>
                          <button onClick={() => setWorkExperiences(workExperiences.filter(e => e.id !== exp.id))}><X size={16} className="text-red-500" /></button>
                        </div>
                        <Label>Industry</Label>
                        <select value={exp.industryId ?? ""} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, industryId: Number(e.target.value) } : x))} className="w-full border rounded p-2">
                          <option value="">Select industry</option>
                          {industriesWork.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                        </select>
                        <Input placeholder="Position" value={exp.position} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, position: e.target.value } : x))} />
                        <Input placeholder="Company" value={exp.company} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} />
                        <Input placeholder="Location" value={exp.location} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, location: e.target.value } : x))} />
                        <textarea placeholder="Description" value={exp.description} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, description: e.target.value } : x))} className="w-full border rounded p-2" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="date" value={exp.startDate} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, startDate: e.target.value } : x))} />
                          <Input type="date" value={exp.endDate} onChange={e => setWorkExperiences(workExperiences.map(x => x.id === exp.id ? { ...x, endDate: e.target.value } : x))} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Licenses */}
              <div className="border rounded-lg">
                <button type="button" onClick={() => setExpandedSections3(prev => ({ ...prev, licenses: !prev.licenses }))} className="w-full flex justify-between p-4">
                  <span>Licenses</span>{expandedSections3.licenses ? <ChevronDown /> : <ChevronRight />}
                </button>
                {expandedSections3.licenses && (
                  <div className="px-4 pb-4 border-t">
                    {allLicenses.map(lic => (
                      <div key={lic.id}>
                        <input type="checkbox" checked={licenses.includes(lic.id)} onChange={() =>
                          setLicenses(licenses.includes(lic.id) ? licenses.filter(l => l !== lic.id) : [...licenses, lic.id])
                        } /> {lic.name}
                      </div>
                    ))}
                    {licenses.some(id => allLicenses.find(l => l.id === id)?.name === "Other") && (
                      <Input placeholder="Specify other" value={otherLicense} onChange={e => setOtherLicense(e.target.value)} />
                    )}
                  </div>
                )}
              </div>

              {/* References */}
              <div className="border rounded-lg">
                <button type="button" onClick={() => setExpandedSections3(prev => ({ ...prev, references: !prev.references }))} className="w-full flex justify-between p-4">
                  <span>References</span>{expandedSections3.references ? <ChevronDown /> : <ChevronRight />}
                </button>
                {expandedSections3.references && (
                  <div className="px-4 pb-4 border-t">
                    <Button type="button" onClick={() => {
                      if (jobReferences.length < 5) setJobReferences([...jobReferences, { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" }]);
                    }} className="bg-orange-500 text-white my-2"><Plus size={16} className="mr-1" /> Add</Button>
                    {jobReferences.map((ref, idx) => (
                      <div key={ref.id} className="border rounded-lg p-2 mb-2">
                        <div className="flex justify-between">
                          <span>Reference {idx + 1}</span>
                          <button onClick={() => setJobReferences(jobReferences.filter(r => r.id !== ref.id))}><X size={16} className="text-red-500" /></button>
                        </div>
                        <Input placeholder="Name" value={ref.name} onChange={e => setJobReferences(jobReferences.map(x => x.id === ref.id ? { ...x, name: e.target.value } : x))} />
                        <Input placeholder="Business" value={ref.businessName} onChange={e => setJobReferences(jobReferences.map(x => x.id === ref.id ? { ...x, businessName: e.target.value } : x))} />
                        <Input placeholder="Email" value={ref.email} onChange={e => setJobReferences(jobReferences.map(x => x.id === ref.id ? { ...x, email: e.target.value } : x))} />
                        <Input placeholder="Phone" value={ref.phone} onChange={e => setJobReferences(jobReferences.map(x => x.id === ref.id ? { ...x, phone: e.target.value } : x))} />
                        <Input placeholder="Role" value={ref.role} onChange={e => setJobReferences(jobReferences.map(x => x.id === ref.id ? { ...x, role: e.target.value } : x))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button className="bg-orange-500 text-white" onClick={handleSaveWork}>Save</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default WHVEditProfile;
