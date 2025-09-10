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

// ---------------- Component ----------------
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Core info
  const [givenName, setGivenName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState(""); // fixed, not editable
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
  });

  // Work Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  // ---------------- Load Data ----------------
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Profile
      const { data: maker } = await supabase
        .from("whv_maker")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (maker) {
        setGivenName(maker.given_name);
        setMiddleName(maker.middle_name || "");
        setFamilyName(maker.family_name);
        setNationality(maker.nationality); // fixed, read-only
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

      // Visa details
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          `stage_id, expiry_date, 
           visa_stage:visa_stage(stage, sub_class, label), 
           country:country(name)`
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (visa) {
        setVisaStageId(visa.stage_id);
        setVisaExpiry(visa.expiry_date);

        // Load visa stages allowed for this nationality
        if (visa.country?.name) {
          const { data: stages } = await supabase
            .from("country_eligibility")
            .select("stage_id, visa_stage(label, sub_class, stage)")
            .eq("country_id", visa.country.country_id);

          if (stages) {
            const uniqueStages = Array.from(
              new Map(
                stages.map((s: any) => [
                  s.stage_id,
                  { stage_id: s.stage_id, ...s.visa_stage },
                ])
              ).values()
            );
            setVisaStages(uniqueStages);
          }
        }

        // Industries
        const { data: eligibleIndustries } = await supabase
          .from("temp_eligibility")
          .select("industry_id, industry_name")
          .eq("sub_class", visa.visa_stage.sub_class)
          .eq("stage", visa.visa_stage.stage)
          .eq("country_name", visa.country.name);

        if (eligibleIndustries) {
          const uniqueIndustries = Array.from(
            new Map(
              eligibleIndustries.map((i: any) => [
                i.industry_id,
                { id: i.industry_id, name: i.industry_name },
              ])
            ).values()
          );
          setIndustries(uniqueIndustries);

          // Roles for industries
          const industryIds = uniqueIndustries.map((i) => i.id);
          const { data: roleData } = await supabase
            .from("industry_role")
            .select("industry_role_id, role, industry_id")
            .in("industry_id", industryIds);

          if (roleData) {
            const uniqueRoles = Array.from(
              new Map(
                roleData.map((r: any) => [
                  r.industry_role_id,
                  { id: r.industry_role_id, name: r.role, industryId: r.industry_id },
                ])
              ).values()
            );
            setRoles(uniqueRoles);
          }
        }

        // Regions
        const { data: regionData } = await supabase
          .from("region_rules")
          .select("region_rules_id, state, area, sub_class, stage")
          .eq("sub_class", visa.visa_stage.sub_class)
          .eq("stage", visa.visa_stage.stage);

        if (regionData) {
          const uniqueRegions = Array.from(
            new Map(
              regionData.map((r: any) => [`${r.state}-${r.area}`, r])
            ).values()
          );
          setRegions(
            uniqueRegions.map((r: any) => ({
              state: r.state,
              area: r.area,
              region_rules_id: r.region_rules_id,
            }))
          );
        }
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
      const { data: licData } = await supabase.from("license").select("*");
      if (licData)
        setAllLicenses(licData.map((l: any) => ({ id: l.license_id, name: l.name })));
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
    loadData();
  }, []);

  // ---------------- Render ----------------
  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
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
            <button className="text-orange-500 font-medium flex items-center">
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Step 1: Visa & Personal Info */}
          {step === 1 && (
            <div className="px-6 py-6 space-y-4">
              <Label>Nationality</Label>
              <Input value={nationality} disabled />
              <Label>Date of Birth</Label>
              <Input value={dob} disabled />
              <Label>Visa Type</Label>
              <Select
                value={visaStageId?.toString() || ""}
                onValueChange={(val) => setVisaStageId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visa" />
                </SelectTrigger>
                <SelectContent>
                  {visaStages.map((v) => (
                    <SelectItem key={v.stage_id} value={v.stage_id.toString()}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Visa Expiry</Label>
              <Input
                type="date"
                value={visaExpiry}
                onChange={(e) => setVisaExpiry(e.target.value)}
              />
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Label>Address Line 1</Label>
              <Input
                value={address.address1}
                onChange={(e) => setAddress({ ...address, address1: e.target.value })}
              />
              <Label>Address Line 2</Label>
              <Input
                value={address.address2}
                onChange={(e) => setAddress({ ...address, address2: e.target.value })}
              />
              <Label>Suburb</Label>
              <Input
                value={address.suburb}
                onChange={(e) => setAddress({ ...address, suburb: e.target.value })}
              />
              <Label>State</Label>
              <Input
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              />
              <Label>Postcode</Label>
              <Input
                value={address.postcode}
                onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
              />
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="px-6 py-6 space-y-4">
              {/* Tagline */}
              <div className="border rounded-lg">
                <button
                  onClick={() =>
                    setExpandedSections({
                      ...expandedSections,
                      tagline: !expandedSections.tagline,
                    })
                  }
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-lg font-medium">1. Profile Tagline</span>
                  {expandedSections.tagline ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
                {expandedSections.tagline && (
                  <div className="px-4 pb-4 border-t space-y-3">
                    <Textarea
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Backpacker ready for farm work"
                    />
                  </div>
                )}
              </div>

              {/* Industries & Roles */}
              <div className="border rounded-lg">
                <button
                  onClick={() =>
                    setExpandedSections({
                      ...expandedSections,
                      industries: !expandedSections.industries,
                    })
                  }
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-lg font-medium">2. Industries & Roles</span>
                  {expandedSections.industries ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
                {expandedSections.industries && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    <Label>Select up to 3 industries *</Label>
                    {industries.map((industry) => (
                      <label
                        key={industry.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIndustries.includes(industry.id)}
                          disabled={
                            selectedIndustries.length >= 3 &&
                            !selectedIndustries.includes(industry.id)
                          }
                          onChange={() => {
                            if (selectedIndustries.includes(industry.id)) {
                              setSelectedIndustries(
                                selectedIndustries.filter((id) => id !== industry.id)
                              );
                              const industryRoles = roles
                                .filter((r) => r.industryId === industry.id)
                                .map((r) => r.id);
                              setSelectedRoles(
                                selectedRoles.filter(
                                  (roleId) => !industryRoles.includes(roleId)
                                )
                              );
                            } else {
                              setSelectedIndustries([...selectedIndustries, industry.id]);
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span>{industry.name}</span>
                      </label>
                    ))}

                    {selectedIndustries.map((industryId) => {
                      const industryRoles = roles.filter(
                        (r) => r.industryId === industryId
                      );
                      return (
                        <div key={industryId}>
                          <Label>Roles</Label>
                          <div className="flex flex-wrap gap-2">
                            {industryRoles.map((role) => (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() =>
                                  setSelectedRoles(
                                    selectedRoles.includes(role.id)
                                      ? selectedRoles.filter((r) => r !== role.id)
                                      : [...selectedRoles, role.id]
                                  )
                                }
                                className={`px-3 py-1 rounded-full text-xs border ${
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

              {/* Preferred Locations */}
              <div className="border rounded-lg">
                <button
                  onClick={() =>
                    setExpandedSections({
                      ...expandedSections,
                      states: !expandedSections.states,
                    })
                  }
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-lg font-medium">3. Preferred Locations</span>
                  {expandedSections.states ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
                {expandedSections.states && (
                  <div className="px-4 pb-4 border-t space-y-4">
                    <Label>Preferred States (up to 3)</Label>
                    {[...new Set(regions.map((r) => r.state))].map((state) => (
                      <div key={state} className="mb-4">
                        <label className="flex items-center space-x-2 py-1 font-medium">
                          <input
                            type="checkbox"
                            checked={preferredStates.includes(state)}
                            onChange={() => {
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
                                preferredAreas.filter((a) =>
                                  validAreas.includes(a)
                                )
                              );
                            }}
                            disabled={
                              preferredStates.length >= 3 &&
                              !preferredStates.includes(state)
                            }
                          />
                          <span>{state}</span>
                        </label>

                        {preferredStates.includes(state) && (
                          <div className="ml-6 space-y-1">
                            {regions
                              .filter((r) => r.state === state)
                              .map((r) => r.area)
                              .filter((a, i, arr) => arr.indexOf(a) === i)
                              .map((area) => (
                                <label
                                  key={`${state}-${area}`}
                                  className="flex items-center space-x-2 py-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={preferredAreas.includes(area)}
                                    onChange={() =>
                                      setPreferredAreas(
                                        preferredAreas.includes(area)
                                          ? preferredAreas.filter((a) => a !== area)
                                          : [...preferredAreas, area]
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
          )}

          {/* Step 3: Work Experience, Licenses, References */}
          {step === 3 && (
            <div className="px-6 py-6 space-y-6">
              <h2 className="text-lg font-semibold">Work Experience</h2>
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
                className="bg-orange-500 text-white"
              >
                <Plus size={16} className="mr-1" /> Add
              </Button>
              {workExperiences.map((exp) => (
                <div key={exp.id} className="border p-4 rounded-lg space-y-2">
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
                    value={exp.location}
                    onChange={(e) =>
                      setWorkExperiences(
                        workExperiences.map((w) =>
                          w.id === exp.id ? { ...w, location: e.target.value } : w
                        )
                      )
                    }
                    placeholder="Location"
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
                      setWorkExperiences(
                        workExperiences.filter((w) => w.id !== exp.id)
                      )
                    }
                  >
                    <X size={16} /> Remove
                  </Button>
                </div>
              ))}

              <h2 className="text-lg font-semibold">Licenses</h2>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {allLicenses.map((l) => (
                  <label key={l.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={licenses.includes(l.id)}
                      onChange={() =>
                        setLicenses(
                          licenses.includes(l.id)
                            ? licenses.filter((x) => x !== l.id)
                            : [...licenses, l.id]
                        )
                      }
                    />
                    <span>{l.name}</span>
                  </label>
                ))}
              </div>
              {licenses.some(
                (id) => allLicenses.find((l) => l.id === id)?.name === "Other"
              ) && (
                <Input
                  value={otherLicense}
                  onChange={(e) => setOtherLicense(e.target.value)}
                  placeholder="Other license"
                />
              )}

              <h2 className="text-lg font-semibold">Job References</h2>
              <Button
                onClick={() =>
                  setJobReferences([
                    ...jobReferences,
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
                <Plus size={16} className="mr-1" /> Add
              </Button>
              {jobReferences.map((ref) => (
                <div key={ref.id} className="border p-4 rounded-lg space-y-2">
                  <Input
                    value={ref.name}
                    onChange={(e) =>
                      setJobReferences(
                        jobReferences.map((r) =>
                          r.id === ref.id ? { ...r, name: e.target.value } : r
                        )
                      )
                    }
                    placeholder="Name"
                  />
                  <Input
                    value={ref.businessName}
                    onChange={(e) =>
                      setJobReferences(
                        jobReferences.map((r) =>
                          r.id === ref.id
                            ? { ...r, businessName: e.target.value }
                            : r
                        )
                      )
                    }
                    placeholder="Business Name"
                  />
                  <Input
                    value={ref.email}
                    onChange={(e) =>
                      setJobReferences(
                        jobReferences.map((r) =>
                          r.id === ref.id ? { ...r, email: e.target.value } : r
                        )
                      )
                    }
                    placeholder="Email"
                  />
                  <Input
                    value={ref.phone}
                    onChange={(e) =>
                      setJobReferences(
                        jobReferences.map((r) =>
                          r.id === ref.id ? { ...r, phone: e.target.value } : r
                        )
                      )
                    }
                    placeholder="Phone"
                  />
                  <Input
                    value={ref.role}
                    onChange={(e) =>
                      setJobReferences(
                        jobReferences.map((r) =>
                          r.id === ref.id ? { ...r, role: e.target.value } : r
                        )
                      )
                    }
                    placeholder="Role"
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setJobReferences(jobReferences.filter((r) => r.id !== ref.id))
                    }
                  >
                    <X size={16} /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Footer stepper */}
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
