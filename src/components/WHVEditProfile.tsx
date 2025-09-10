// src/components/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
interface Country {
  country_id: number;
  name: string;
}
interface CountryEligibility {
  country_id: number;
  stage_id: number;
}

// ==============================
// Component
// ==============================
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Step 1
  const [givenName, setGivenName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [eligibility, setEligibility] = useState<CountryEligibility[]>([]);
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

  // Step 2
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // Step 3
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // Collapsibles
  const [expandedSections, setExpandedSections] = useState({
    industries: true,
    states: false,
    workExp: false,
    references: false,
  });

  // ==============================
  // Load Data (prefill)
  // ==============================
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch country + visa eligibility + visa stages
      const { data: countries } = await supabase.from("country").select("*").order("name");
      const { data: stages } = await supabase.from("visa_stage").select("*").order("stage");
      const { data: elig } = await supabase.from("country_eligibility").select("*");

      if (countries) {
        const userCountry = countries.find((c) => c.name === nationality);
        if (userCountry) setCountryId(userCountry.country_id);
      }
      if (stages) setVisaStages(stages);
      if (elig) setEligibility(elig);

      // TODO: Prefill whv_maker, maker_visa, maker_preference, etc. like onboarding
      setLoading(false);
    };
    loadProfile();
  }, []);

  // ==============================
  // Step 1 Render
  // ==============================
  const renderStep1 = () => (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      <h2 className="text-lg font-semibold">Profile & Visa</h2>
      <p className="text-sm text-gray-500">Nationality: {nationality}</p>
      <p className="text-sm text-gray-500">DOB: {dob}</p>

      <div>
        <Label>Visa Type *</Label>
        <Select value={visaType} onValueChange={setVisaType}>
          <SelectTrigger>
            <SelectValue placeholder="Select visa type" />
          </SelectTrigger>
          <SelectContent>
            {visaStages
              .filter((v) =>
                countryId ? eligibility.some((e) => e.country_id === countryId && e.stage_id === v.stage_id) : true
              )
              .map((v) => (
                <SelectItem key={v.stage_id} value={v.label}>
                  {v.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Visa Expiry *</Label>
        <Input
          type="date"
          value={visaExpiry}
          onChange={(e) => setVisaExpiry(e.target.value)}
        />
      </div>

      <div>
        <Label>Phone Number *</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="04xxxxxxxx or +614xxxxxxxx"
        />
      </div>

      <div>
        <Label>Address Line 1 *</Label>
        <Input
          value={address.address1}
          onChange={(e) => setAddress({ ...address, address1: e.target.value })}
        />
      </div>

      <div>
        <Label>Address Line 2</Label>
        <Input
          value={address.address2}
          onChange={(e) => setAddress({ ...address, address2: e.target.value })}
        />
      </div>

      <div>
        <Label>Suburb *</Label>
        <Input
          value={address.suburb}
          onChange={(e) => setAddress({ ...address, suburb: e.target.value })}
        />
      </div>

      <div>
        <Label>State *</Label>
        <Select
          value={address.state}
          onValueChange={(v) => setAddress({ ...address, state: v as AustralianState })}
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

      <div>
        <Label>Postcode *</Label>
        <Input
          value={address.postcode}
          onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
        />
      </div>
    </div>
  );

  // Continue with Step 2 + Step 3 + Save in Part 2…
  // ==============================
  // Step 2: Work Preferences
  // ==============================
  const renderStep2 = () => (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      <h2 className="text-lg font-semibold">Work Preferences</h2>

      {/* Tagline */}
      <div>
        <Label>Profile Tagline *</Label>
        <Textarea
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Backpacker ready for farm work"
        />
      </div>

      {/* Industries & Roles */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() =>
            setExpandedSections((p) => ({ ...p, industries: !p.industries }))
          }
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium">Industries & Roles</span>
          {expandedSections.industries ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.industries && (
          <div className="px-4 pb-4 border-t space-y-4">
            {industries.map((industry) => (
              <div key={industry.id}>
                <label className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIndustries.includes(industry.id)}
                    disabled={
                      selectedIndustries.length >= 3 &&
                      !selectedIndustries.includes(industry.id)
                    }
                    onChange={() =>
                      setSelectedIndustries((prev) =>
                        prev.includes(industry.id)
                          ? prev.filter((i) => i !== industry.id)
                          : [...prev, industry.id]
                      )
                    }
                  />
                  <span>{industry.name}</span>
                </label>
                {selectedIndustries.includes(industry.id) && (
                  <div className="ml-6 flex flex-wrap gap-2">
                    {roles
                      .filter((r) => r.industryId === industry.id)
                      .map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() =>
                            setSelectedRoles((prev) =>
                              prev.includes(role.id)
                                ? prev.filter((id) => id !== role.id)
                                : [...prev, role.id]
                            )
                          }
                          className={`px-3 py-1 rounded-full text-xs border ${
                            selectedRoles.includes(role.id)
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          {role.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferred Locations */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() =>
            setExpandedSections((p) => ({ ...p, states: !p.states }))
          }
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium">Preferred Locations</span>
          {expandedSections.states ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.states && (
          <div className="px-4 pb-4 border-t space-y-4">
            {[...new Set(regions.map((r) => r.state))].map((state) => (
              <div key={state}>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferredStates.includes(state)}
                    onChange={() =>
                      setPreferredStates((prev) =>
                        prev.includes(state)
                          ? prev.filter((s) => s !== state)
                          : [...prev, state]
                      )
                    }
                  />
                  <span>{state}</span>
                </label>
                {preferredStates.includes(state) && (
                  <div className="ml-6 space-y-1">
                    {regions
                      .filter((r) => r.state === state)
                      .map((r) => r.area)
                      .filter((a, i, arr) => a && arr.indexOf(a) === i)
                      .map((area) => (
                        <label
                          key={`${state}-${area}`}
                          className="flex items-center space-x-2 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={preferredAreas.includes(area)}
                            onChange={() =>
                              setPreferredAreas((prev) =>
                                prev.includes(area)
                                  ? prev.filter((a) => a !== area)
                                  : [...prev, area]
                              )
                            }
                          />
                          <span>{area}</span>
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
  );

  // ==============================
  // Step 3: Work Experience, Licenses, References
  // ==============================
  const renderStep3 = () => (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      <h2 className="text-lg font-semibold">Work Experience, Licenses & References</h2>

      {/* Work Experience */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() =>
            setExpandedSections((p) => ({ ...p, workExp: !p.workExp }))
          }
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium">Work Experience</span>
          {expandedSections.workExp ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.workExp && (
          <div className="px-4 pb-4 border-t space-y-4">
            {workExperiences.map((exp, index) => (
              <div key={exp.id} className="border p-3 rounded-lg space-y-2">
                <h3 className="font-medium">Experience {index + 1}</h3>

                <Label>Industry</Label>
                <Select
                  value={exp.industryId ? String(exp.industryId) : ""}
                  onValueChange={(value) =>
                    setWorkExperiences((prev) =>
                      prev.map((w) =>
                        w.id === exp.id
                          ? { ...w, industryId: Number(value) }
                          : w
                      )
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={String(ind.id)}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={exp.company}
                  onChange={(e) =>
                    setWorkExperiences((prev) =>
                      prev.map((w) =>
                        w.id === exp.id
                          ? { ...w, company: e.target.value }
                          : w
                      )
                    )
                  }
                  placeholder="Company"
                />
                <Input
                  value={exp.position}
                  onChange={(e) =>
                    setWorkExperiences((prev) =>
                      prev.map((w) =>
                        w.id === exp.id
                          ? { ...w, position: e.target.value }
                          : w
                      )
                    )
                  }
                  placeholder="Position"
                />
                <Input
                  value={exp.location}
                  onChange={(e) =>
                    setWorkExperiences((prev) =>
                      prev.map((w) =>
                        w.id === exp.id
                          ? { ...w, location: e.target.value }
                          : w
                      )
                    )
                  }
                  placeholder="Location"
                />
                <Textarea
                  value={exp.description}
                  onChange={(e) =>
                    setWorkExperiences((prev) =>
                      prev.map((w) =>
                        w.id === exp.id
                          ? { ...w, description: e.target.value }
                          : w
                      )
                    )
                  }
                  placeholder="Job Description"
                />
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) =>
                      setWorkExperiences((prev) =>
                        prev.map((w) =>
                          w.id === exp.id
                            ? { ...w, startDate: e.target.value }
                            : w
                        )
                      )
                    }
                  />
                  <Input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) =>
                      setWorkExperiences((prev) =>
                        prev.map((w) =>
                          w.id === exp.id
                            ? { ...w, endDate: e.target.value }
                            : w
                        )
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setWorkExperiences((prev) =>
                      prev.filter((w) => w.id !== exp.id)
                    )
                  }
                  className="text-red-500"
                >
                  <X size={16} /> Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                setWorkExperiences((prev) => [
                  ...prev,
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
              className="bg-orange-500 text-white"
            >
              <Plus size={16} className="mr-1" /> Add Work Experience
            </Button>
          </div>
        )}
      </div>

      {/* Licenses */}
      <div>
        <h2 className="text-lg font-semibold">Licenses & Tickets</h2>
        <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg">
          {allLicenses.map((license) => (
            <label key={license.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={licenses.includes(license.id)}
                onChange={() =>
                  setLicenses((prev) =>
                    prev.includes(license.id)
                      ? prev.filter((id) => id !== license.id)
                      : [...prev, license.id]
                  )
                }
              />
              <span>{license.name}</span>
            </label>
          ))}
        </div>
        {licenses.some((id) => allLicenses.find((l) => l.id === id)?.name === "Other") && (
          <Input
            value={otherLicense}
            onChange={(e) => setOtherLicense(e.target.value)}
            placeholder="Specify other license"
          />
        )}
      </div>

      {/* Job References */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() =>
            setExpandedSections((p) => ({ ...p, references: !p.references }))
          }
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium">Job References</span>
          {expandedSections.references ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.references && (
          <div className="px-4 pb-4 border-t space-y-4">
            {jobReferences.map((ref, index) => (
              <div key={ref.id} className="border p-3 rounded-lg space-y-2">
                <h3 className="font-medium">Reference {index + 1}</h3>
                <Input
                  value={ref.name}
                  onChange={(e) =>
                    setJobReferences((prev) =>
                      prev.map((r) =>
                        r.id === ref.id ? { ...r, name: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Name"
                />
                <Input
                  value={ref.businessName}
                  onChange={(e) =>
                    setJobReferences((prev) =>
                      prev.map((r) =>
                        r.id === ref.id ? { ...r, businessName: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Business Name"
                />
                <Input
                  value={ref.email}
                  onChange={(e) =>
                    setJobReferences((prev) =>
                      prev.map((r) =>
                        r.id === ref.id ? { ...r, email: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Email"
                />
                <Input
                  value={ref.phone}
                  onChange={(e) =>
                    setJobReferences((prev) =>
                      prev.map((r) =>
                        r.id === ref.id ? { ...r, phone: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Phone"
                />
                <Input
                  value={ref.role}
                  onChange={(e) =>
                    setJobReferences((prev) =>
                      prev.map((r) =>
                        r.id === ref.id ? { ...r, role: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Role"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setJobReferences((prev) =>
                      prev.filter((r) => r.id !== ref.id)
                    )
                  }
                  className="text-red-500"
                >
                  <X size={16} /> Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                setJobReferences((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    name: "",
                    businessName: "",
                    email: "",
                    phone: "",
                    role: "",
                  },
                ])
              }
              className="bg-orange-500 text-white"
            >
              <Plus size={16} className="mr-1" /> Add Reference
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // ==============================
  // Save Handler
  // ==============================
  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await Promise.all([
        // Save maker
        supabase.from("whv_maker").upsert({
          user_id: user.id,
          given_name: givenName,
          middle_name: middleName || null,
          family_name: familyName,
          birth_date: dob,
          nationality,
          tagline,
          mobile_num: phone,
          address_line1: address.address1,
          address_line2: address.address2 || null,
          suburb: address.suburb,
          state: address.state === "" ? null : address.state,
          postcode: address.postcode,
          updated_at: new Date().toISOString(),
        }),
        // Save visa
        supabase.from("maker_visa").upsert({
          user_id: user.id,
          country_id: countryId!,
          stage_id: visaStages.find((s) => s.label === visaType)?.stage_id!,
          dob,
          expiry_date: visaExpiry,
        }),
        // Preferences
        (async () => {
          await supabase.from("maker_preference").delete().eq("user_id", user.id);
          const rows: Array<{ user_id: string; industry_role_id: number; region_rules_id: number }> = [];
          selectedRoles.forEach((roleId) => {
            preferredStates.forEach((state) => {
              preferredAreas.forEach((area) => {
                const region = regions.find((r) => r.state === state && r.area === area);
                if (region) {
                  rows.push({
                    user_id: user.id,
                    industry_role_id: roleId,
                    region_rules_id: region.region_rules_id,
                  });
                }
              });
            });
          });
          if (rows.length > 0) await supabase.from("maker_preference").insert(rows);
        })(),
        // Work experiences
        (async () => {
          await supabase.from("maker_work_experience").delete().eq("user_id", user.id);
          const rows = workExperiences.map((exp) => ({
            user_id: user.id,
            company: exp.company,
            position: exp.position,
            location: exp.location,
            start_date: exp.startDate,
            end_date: exp.endDate,
            industry_id: exp.industryId!,
            job_description: exp.description,
          }));
          if (rows.length > 0) await supabase.from("maker_work_experience").insert(rows);
        })(),
        // Licenses
        (async () => {
          await supabase.from("maker_license").delete().eq("user_id", user.id);
          const rows = licenses.map((lid) => ({
            user_id: user.id,
            license_id: lid,
            other: allLicenses.find((l) => l.id === lid)?.name === "Other" ? otherLicense : null,
          }));
          if (rows.length > 0) await supabase.from("maker_license").insert(rows);
        })(),
        // References
        (async () => {
          await supabase.from("maker_reference").delete().eq("user_id", user.id);
          const rows = jobReferences.map((ref) => ({
            user_id: user.id,
            name: ref.name,
            business_name: ref.businessName,
            email: ref.email,
            mobile_num: ref.phone,
            role: ref.role,
          }));
          if (rows.length > 0) await supabase.from("maker_reference").insert(rows);
        })(),
      ]);

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully",
      });
      navigate("/whv/dashboard");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  // ==============================
  // Render
  // ==============================
  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b flex justify-between items-center">
            <button onClick={() => navigate("/whv/dashboard")}>
              <ArrowLeft />
            </button>
            <h1 className="text-lg font-semibold">
              Edit Profile ({step}/3)
            </h1>
            <span />
          </div>

          {/* Steps */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Footer */}
          <div className="p-4 border-t flex justify-between items-center">
            {step > 1 ? (
              <Button onClick={() => setStep(step - 1)}>Back</Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-orange-500 text-white"
              >
                Continue →
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                className="bg-orange-500 text-white"
              >
                <Check className="mr-1" size={16} /> Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
