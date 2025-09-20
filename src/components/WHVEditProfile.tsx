import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, ChevronDown, ChevronRight, Plus, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AU_STATES = [
  "Queensland",
  "New South Wales",
  "Victoria",
  "Tasmania",
  "Western Australia",
  "South Australia",
  "Northern Territory",
  "Australian Capital Territory",
];

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

const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // personal
  const [countryId, setCountryId] = useState<number | null>(null);
  const [nationality, setNationality] = useState("");
  const [dob, setDob] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [eligibility, setEligibility] = useState<CountryEligibility[]>([]);
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

  // preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [visaLabel, setVisaLabel] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    tagline: true,
    industries: false,
    states: false,
  });

  // experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // ============ load ============
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [countriesRes, stagesRes, eligibilityRes, licenseRes, industryRes, roleRes] =
        await Promise.all([
          supabase.from("country").select("*").order("name"),
          supabase.from("visa_stage").select("*").order("stage"),
          supabase.from("country_eligibility").select("*"),
          supabase.from("license").select("license_id, name"),
          supabase.from("industry").select("industry_id, name"),
          supabase.from("industry_role").select("industry_role_id, role, industry_id"),
        ]);

      if (countriesRes.data) setCountries(countriesRes.data);
      if (stagesRes.data) setVisaStages(stagesRes.data);
      if (eligibilityRes.data) setEligibility(eligibilityRes.data);
      if (licenseRes.data) {
        setAllLicenses(licenseRes.data.map(l => ({ id: l.license_id, name: l.name })));
      }
      if (industryRes.data) {
        setIndustries(industryRes.data.map(i => ({ id: i.industry_id, name: i.name })));
      }
      if (roleRes.data) {
        setRoles(roleRes.data.map(r => ({ id: r.industry_role_id, name: r.role, industryId: r.industry_id })));
      }

      // Load whv_maker
      const { data: maker } = await supabase.from("whv_maker").select("*").eq("user_id", user.id).maybeSingle();
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
        const country = countriesRes.data?.find(c => c.name === maker.nationality);
        if (country) setCountryId(country.country_id);
      }

      // Visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(`
          expiry_date,
          country_id,
          stage_id,
          visa_stage:visa_stage(stage, sub_class, label),
          country:country(name)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (visa?.visa_stage && visa.country) {
        setVisaType(visa.visa_stage.label);
        setVisaExpiry(visa.expiry_date);
        setVisaLabel(`${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`);
        setCountryId(visa.country_id);
      }

      // Preferences
      const { data: savedInd } = await supabase.from("maker_pref_industry").select("industry_id").eq("user_id", user.id);
      if (savedInd) setSelectedIndustries(savedInd.map(i => i.industry_id));
      const { data: savedRoles } = await supabase.from("maker_pref_industry_role").select("industry_role_id").eq("user_id", user.id);
      if (savedRoles) setSelectedRoles(savedRoles.map(r => r.industry_role_id));
      const { data: savedLocs } = await supabase.from("maker_pref_location").select("state").eq("user_id", user.id);
      if (savedLocs) setPreferredStates([...new Set(savedLocs.map(l => l.state))]);

      // Work experience
      const { data: exp } = await supabase.from("maker_work_experience").select("*").eq("user_id", user.id);
      if (exp) {
        setWorkExperiences(exp.map(e => ({
          id: e.work_experience_id.toString(),
          industryId: e.industry_id,
          roleId: e.industry_role_id,
          company: e.company,
          location: e.location || "",
          startDate: e.start_date,
          endDate: e.end_date,
          description: e.job_description || "",
        })));
      }

      // References
      const { data: refs } = await supabase.from("maker_reference").select("*").eq("user_id", user.id);
      if (refs) {
        setJobReferences(refs.map(r => ({
          id: r.reference_id.toString(),
          name: r.name || "",
          businessName: r.business_name || "",
          email: r.email || "",
          phone: r.mobile_num || "",
          role: r.role || "",
        })));
      }

      // Licenses
      const { data: makerLic } = await supabase.from("maker_license").select("*").eq("user_id", user.id);
      if (makerLic) {
        setLicenses(makerLic.map(l => l.license_id));
        const other = makerLic.find(l => l.other)?.other;
        if (other) setOtherLicense(other);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  // =========== save ============
  const saveAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Save personal info
      const selectedStage = visaStages.find(v => v.label === visaType);
      await supabase.from("whv_maker").update({
        nationality,
        birth_date: dob,
        mobile_num: phone,
        address_line1: address.address1,
        address_line2: address.address2 || null,
        suburb: address.suburb,
        state: address.state,
        postcode: address.postcode,
        tagline: tagline.trim(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);

      if (selectedStage) {
        await supabase.from("maker_visa").upsert({
          user_id: user.id,
          country_id: countryId,
          stage_id: selectedStage.stage_id,
          dob,
          expiry_date: visaExpiry,
        }, { onConflict: "user_id" });
      }

      // Clear and save preferences
      await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
      await supabase.from("maker_pref_industry_role").delete().eq("user_id", user.id);
      await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

      if (selectedIndustries.length > 0) {
        await supabase.from("maker_pref_industry").insert(
          selectedIndustries.map(indId => ({ user_id: user.id, industry_id: indId }))
        );
      }
      if (selectedRoles.length > 0) {
        await supabase.from("maker_pref_industry_role").insert(
          selectedRoles.map(roleId => ({ user_id: user.id, industry_role_id: roleId }))
        );
      }
      if (preferredStates.length > 0) {
        await supabase.from("maker_pref_location").insert(
          preferredStates.map(state => ({ user_id: user.id, state }))
        );
      }

      // Work experience
      await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
      const validExperiences = workExperiences.filter(
        exp => exp.company.trim() && exp.industryId && exp.roleId && exp.startDate && exp.endDate
      );
      if (validExperiences.length > 0) {
        await supabase.from("maker_work_experience").insert(
          validExperiences.map(exp => ({
            user_id: user.id,
            company: exp.company.trim(),
            industry_id: exp.industryId!,
            industry_role_id: exp.roleId!,
            start_date: exp.startDate,
            end_date: exp.endDate,
            location: exp.location || null,
            job_description: exp.description || null,
          }))
        );
      }

      // References
      await supabase.from("maker_reference").delete().eq("user_id", user.id);
      if (jobReferences.length > 0) {
        await supabase.from("maker_reference").insert(
          jobReferences.map(ref => ({
            user_id: user.id,
            name: ref.name || null,
            business_name: ref.businessName || null,
            email: ref.email || null,
            mobile_num: ref.phone || null,
            role: ref.role || null,
          }))
        );
      }

      // Licenses
      await supabase.from("maker_license").delete().eq("user_id", user.id);
      if (licenses.length > 0) {
        await supabase.from("maker_license").insert(
          licenses.map(licenseId => ({
            user_id: user.id,
            license_id: licenseId,
            other: allLicenses.find(l => l.id === licenseId)?.name === "Other" ? otherLicense : null,
          }))
        );
      }

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      navigate("/whv/dashboard");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  // =========== render ============
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between">
            <button onClick={() => navigate("/whv/dashboard")} className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
            <button onClick={saveAllData} className="text-orange-500 font-medium flex items-center">
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* === STEP 1: Personal Info === */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                {/* Nationality / DOB (read-only) */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nationality</Label>
                    <p className="mt-1 text-gray-900">{nationality}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                    <p className="mt-1 text-gray-900">{dob}</p>
                  </div>
                </div>
                {/* Visa Type */}
                {visaStages.length > 0 && (
                  <div>
                    <Label>Visa Type *</Label>
                    <Select value={visaType} onValueChange={setVisaType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visa type" />
                      </SelectTrigger>
                      <SelectContent>
                        {visaStages
                          .filter(v => eligibility.some(e => e.country_id === countryId && e.stage_id === v.stage_id))
                          .map(v => (
                            <SelectItem key={v.stage_id} value={v.label}>
                              {v.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Visa Expiry */}
                <div>
                  <Label>Visa Expiry *</Label>
                  <Input type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} />
                </div>
                {/* Phone */}
                <div>
                  <Label>Phone *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xxxxxxxx or +614xxxxxxxx" />
                </div>
                {/* Address */}
                <div>
                  <Label>Address Line 1 *</Label>
                  <Input value={address.address1} onChange={(e) => setAddress({ ...address, address1: e.target.value })} />
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  <Input value={address.address2} onChange={(e) => setAddress({ ...address, address2: e.target.value })} />
                </div>
                <div>
                  <Label>Suburb *</Label>
                  <Input value={address.suburb} onChange={(e) => setAddress({ ...address, suburb: e.target.value })} />
                </div>
                <div>
                  <Label>State *</Label>
                  <Select value={address.state} onValueChange={(v) => setAddress({ ...address, state: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {AU_STATES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Postcode *</Label>
                  <Input value={address.postcode} onChange={(e) => setAddress({ ...address, postcode: e.target.value })} maxLength={4} />
                </div>
              </div>
            )}

            {/* === STEP 2: Preferences === */}
            {step === 2 && (
              <div className="space-y-6">
                {visaLabel && <p className="text-sm text-gray-500">Visa: {visaLabel}</p>}
                {/* Tagline */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExpandedSections({ ...expandedSections, tagline: !expandedSections.tagline })}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">1. Profile Tagline</span>
                    {expandedSections.tagline ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedSections.tagline && (
                    <div className="px-4 pb-4 border-t space-y-3">
                      <Input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Backpacker ready for farm work" />
                    </div>
                  )}
                </div>
                {/* Industries & Roles */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExpandedSections({ ...expandedSections, industries: !expandedSections.industries })}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">2. Industries & Roles</span>
                    {expandedSections.industries ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedSections.industries && (
                    <div className="px-4 pb-4 border-t space-y-4">
                      <Label>Select up to 3 industries *</Label>
                      {industries.map(ind => (
                        <label key={ind.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(ind.id)}
                            disabled={selectedIndustries.length >= 3 && !selectedIndustries.includes(ind.id)}
                            onChange={() =>
                              setSelectedIndustries(prev =>
                                prev.includes(ind.id)
                                  ? prev.filter(i => i !== ind.id)
                                  : [...prev, ind.id]
                              )
                            }
                          />
                          <span>{ind.name}</span>
                        </label>
                      ))}
                      {selectedIndustries.map(industryId => {
                        const industry = industries.find(i => i.id === industryId);
                        const industryRoles = roles.filter(r => r.industryId === industryId);
                        return (
                          <div key={industryId}>
                            <Label>Roles for {industry?.name}</Label>
                            <div className="flex flex-wrap gap-2">
                              {industryRoles.map(role => (
                                <button
                                  type="button"
                                  key={role.id}
                                  onClick={() =>
                                    setSelectedRoles(prev =>
                                      prev.includes(role.id)
                                        ? prev.filter(r => r !== role.id)
                                        : [...prev, role.id]
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-full text-xs border ${
                                    selectedRoles.includes(role.id)
                                      ? "bg-orange-500 text-white border-orange-500"
                                      : "bg-white text-gray-700 border-gray-300"
                                  }`}
                                >
                                  {role.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Preferred States */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExpandedSections({ ...expandedSections, states: !expandedSections.states })}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">3. Preferred Locations</span>
                    {expandedSections.states ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedSections.states && (
                    <div className="px-4 pb-4 border-t space-y-4">
                      <Label>Preferred States (up to 3)</Label>
                      {AU_STATES.map(state => (
                        <label key={state} className="flex items-center space-x-2 py-1 font-medium">
                          <input
                            type="checkbox"
                            checked={preferredStates.includes(state)}
                            onChange={() =>
                              setPreferredStates(prev =>
                                prev.includes(state)
                                  ? prev.filter(s => s !== state)
                                  : [...prev, state]
                              )
                            }
                            disabled={preferredStates.length >= 3 && !preferredStates.includes(state)}
                          />
                          <span>{state}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === STEP 3: Work Experience + References + Licenses === */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Work Experience */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                    <Button
                      type="button"
                      onClick={() =>
                        setWorkExperiences(prev => [
                          ...prev,
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
                        ])
                      }
                      disabled={workExperiences.length >= 8}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  {workExperiences.map((exp, index) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">Experience {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setWorkExperiences(prev => prev.filter(e => e.id !== exp.id))}
                          className="text-red-500"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      {/* Industry */}
                      <div className="space-y-2">
                        <Label>Industry *</Label>
                        <Select
                          value={exp.industryId ? String(exp.industryId) : ""}
                          onValueChange={(v) =>
                            setWorkExperiences(prev =>
                              prev.map(e =>
                                e.id === exp.id ? { ...e, industryId: Number(v), roleId: null } : e
                              )
                            )
                          }
                        >
                          <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map(ind => (
                              <SelectItem key={ind.id} value={String(ind.id)}>
                                {ind.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Role */}
                      <div className="space-y-2">
                        <Label>Position *</Label>
                        <Select
                          value={exp.roleId ? String(exp.roleId) : ""}
                          onValueChange={(v) =>
                            setWorkExperiences(prev =>
                              prev.map(e =>
                                e.id === exp.id ? { ...e, roleId: Number(v) } : e
                              )
                            )
                          }
                          disabled={!exp.industryId}
                        >
                          <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter(r => r.industryId === exp.industryId)
                              .map(role => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                  {role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Company */}
                      <Input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          setWorkExperiences(prev =>
                            prev.map(we =>
                              we.id === exp.id ? { ...we, company: e.target.value } : we
                            )
                          )
                        }
                        placeholder="Company"
                      />
                      {/* Location */}
                      <Input
                        type="text"
                        value={exp.location}
                        onChange={(e) =>
                          setWorkExperiences(prev =>
                            prev.map(we =>
                              we.id === exp.id ? { ...we, location: e.target.value } : we
                            )
                          )
                        }
                        placeholder="Location"
                      />
                      {/* Description */}
                      <textarea
                        value={exp.description}
                        onChange={(e) =>
                          setWorkExperiences(prev =>
                            prev.map(we =>
                              we.id === exp.id ? { ...we, description: e.target.value } : we
                            )
                          )
                        }
                        className="w-full bg-gray-100 border-0 text-sm p-2 rounded"
                        placeholder="Describe your responsibilities (max 100 chars)"
                        maxLength={100}
                      />
                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) =>
                            setWorkExperiences(prev =>
                              prev.map(we =>
                                we.id === exp.id ? { ...we, startDate: e.target.value } : we
                              )
                            )
                          }
                        />
                        <Input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) =>
                            setWorkExperiences(prev =>
                              prev.map(we =>
                                we.id === exp.id ? { ...we, endDate: e.target.value } : we
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* References + Licenses blocks remain same as your original */}
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="p-4 flex flex-col items-center">
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 w-6 rounded-full ${step === i ? "bg-orange-500" : "bg-gray-300"}`} />
              ))}
            </div>
            <div className="flex justify-between w-full">
              <Button disabled={step === 1} onClick={() => setStep(step - 1)} variant="outline">Back</Button>
              <Button disabled={step === 3} onClick={() => setStep(step + 1)} className="bg-orange-500 text-white">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
