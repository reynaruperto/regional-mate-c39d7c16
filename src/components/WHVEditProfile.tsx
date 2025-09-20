// src/pages/whv/WHVEditProfile.tsx
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
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ===== Types =====
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
  id: number;
  state: string;
  suburb_city: string;
  postcode: string;
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
interface License {
  id: number;
  name: string;
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

  // Step 1 – Personal Info
  const [nationality, setNationality] = useState("");
  const [dob, setDob] = useState("");
  const [visaLabel, setVisaLabel] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });

  // Step 2 – Preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredSuburbs, setPreferredSuburbs] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    tagline: true,
    industries: false,
    locations: false,
  });

  // Step 3 – Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // ===== Load Data =====
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Profile basics
      const { data: maker } = await supabase
        .from("whv_maker")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
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
        .select(
          `expiry_date, visa_stage(stage, sub_class, label), country(name)`
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (visa?.visa_stage) {
        setVisaLabel(
          `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country?.name})`
        );
        setVisaExpiry(visa.expiry_date);
      }

      // Eligible industries
      const { data: eligibleIndustries } = await supabase
        .from("temp_eligibility")
        .select("industry_id, industry_name")
        .eq("sub_class", visa?.visa_stage?.sub_class)
        .eq("stage", visa?.visa_stage?.stage)
        .eq("country_name", maker?.nationality);
      if (eligibleIndustries) {
        setIndustries(
          eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry_name,
          }))
        );
        const ids = eligibleIndustries.map((i) => i.industry_id);
        const { data: roleData } = await supabase
          .from("industry_role")
          .select("*")
          .in("industry_id", ids);
        if (roleData) {
          setRoles(
            roleData.map((r) => ({
              id: r.industry_role_id,
              name: r.role,
              industryId: r.industry_id,
            }))
          );
        }
      }

      // Regions
      const { data: regionData } = await supabase
        .from("regional_rules")
        .select("*");
      if (regionData) {
        setRegions(
          regionData.map((r) => ({
            id: r.id,
            state: r.state,
            suburb_city: r.suburb_city,
            postcode: r.postcode,
          }))
        );
      }

      // Preferences
      const { data: prefInd } = await supabase
        .from("maker_pref_industry")
        .select("*")
        .eq("user_id", user.id);
      if (prefInd) setSelectedIndustries(prefInd.map((p) => p.industry_id));

      const { data: prefRole } = await supabase
        .from("maker_pref_role")
        .select("*")
        .eq("user_id", user.id);
      if (prefRole) setSelectedRoles(prefRole.map((p) => p.industry_role_id));

      const { data: prefLoc } = await supabase
        .from("maker_pref_location")
        .select("*")
        .eq("user_id", user.id);
      if (prefLoc) {
        setPreferredSuburbs(
          prefLoc.map((l) => `${l.suburb_city}::${l.postcode}`)
        );
      }

      // Work experiences
      const { data: exp } = await supabase
        .from("maker_work_experience")
        .select("*")
        .eq("user_id", user.id);
      if (exp) {
        setWorkExperiences(
          exp.map((e) => ({
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

      // Licenses
      const { data: licenseData } = await supabase.from("license").select("*");
      if (licenseData)
        setAllLicenses(
          licenseData.map((l) => ({ id: l.license_id, name: l.name }))
        );
      const { data: makerLic } = await supabase
        .from("maker_license")
        .select("*")
        .eq("user_id", user.id);
      if (makerLic) {
        setLicenses(makerLic.map((l) => l.license_id));
        const other = makerLic.find((l) => l.other)?.other;
        if (other) setOtherLicense(other);
      }

      // References
      const { data: refs } = await supabase
        .from("maker_reference")
        .select("*")
        .eq("user_id", user.id);
      if (refs) {
        setJobReferences(
          refs.map((r) => ({
            id: r.reference_id.toString(),
            name: r.name,
            businessName: r.business_name,
            email: r.email,
            phone: r.mobile_num,
            role: r.role,
          }))
        );
      }

      setLoading(false);
    };
    loadData();
  }, []);

  // ===== Handlers =====
  const toggleIndustry = (id: number) =>
    setSelectedIndustries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  const toggleRole = (id: number) =>
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  const toggleSuburb = (key: string) =>
    setPreferredSuburbs((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );

  const addWorkExperience = () => {
    if (workExperiences.length < 8) {
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
      ]);
    }
  };
  const updateWorkExperience = (
    id: string,
    field: keyof WorkExperience,
    value: any
  ) =>
    setWorkExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  const removeWorkExperience = (id: string) =>
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));

  const addJobReference = () => {
    if (jobReferences.length < 5) {
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
      ]);
    }
  };
  const updateJobReference = (
    id: string,
    field: keyof JobReference,
    value: string
  ) =>
    setJobReferences((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref))
    );
  const removeJobReference = (id: string) =>
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));

  const toggleLicense = (licenseId: number) =>
    setLicenses((prev) =>
      prev.includes(licenseId)
        ? prev.filter((l) => l !== licenseId)
        : [...prev, licenseId]
    );

  // ===== Save =====
  const saveAllData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Clear + save preferences
    await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
    await supabase.from("maker_pref_role").delete().eq("user_id", user.id);
    await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

    if (selectedIndustries.length) {
      await supabase.from("maker_pref_industry").insert(
        selectedIndustries.map((i) => ({ user_id: user.id, industry_id: i }))
      );
    }
    if (selectedRoles.length) {
      await supabase.from("maker_pref_role").insert(
        selectedRoles.map((r) => ({ user_id: user.id, industry_role_id: r }))
      );
    }
    if (preferredSuburbs.length) {
      const rows = preferredSuburbs.map((s) => {
        const [suburb_city, postcode] = s.split("::");
        return { user_id: user.id, state: "Queensland", suburb_city, postcode };
      });
      await supabase.from("maker_pref_location").insert(rows);
    }

    // Work Experiences
    await supabase
      .from("maker_work_experience")
      .delete()
      .eq("user_id", user.id);
    if (workExperiences.length) {
      await supabase.from("maker_work_experience").insert(
        workExperiences.map((exp) => ({
          user_id: user.id,
          company: exp.company,
          position: exp.position,
          start_date: exp.startDate,
          end_date: exp.endDate,
          location: exp.location,
          industry_id: exp.industryId!,
          job_description: exp.description,
        }))
      );
    }

    // References
    await supabase.from("maker_reference").delete().eq("user_id", user.id);
    if (jobReferences.length) {
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

    // Licenses
    await supabase.from("maker_license").delete().eq("user_id", user.id);
    if (licenses.length) {
      await supabase.from("maker_license").insert(
        licenses.map((lid) => ({
          user_id: user.id,
          license_id: lid,
          other:
            allLicenses.find((l) => l.id === lid)?.name === "Other"
              ? otherLicense
              : null,
        }))
      );
    }

    toast({ title: "Profile updated", description: "Your edits were saved" });
    navigate("/whv/dashboard");
  };

  // ===== Render =====
  if (loading) return <div>Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-4 border-b flex justify-between items-center">
            <Button onClick={() => navigate("/whv/dashboard")} variant="ghost">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="font-semibold">Edit Profile</h1>
            <Button
              onClick={saveAllData}
              className="bg-orange-500 text-white rounded-lg"
            >
              <Check size={16} className="mr-1" /> Save
            </Button>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-medium">1. Personal Info</h2>
                <Label>Nationality</Label>
                <p>{nationality}</p>
                <Label>DOB</Label>
                <p>{dob}</p>
                <Label>Visa</Label>
                <p>{visaLabel}</p>
                <Label>Expiry</Label>
                <Input
                  type="date"
                  value={visaExpiry}
                  onChange={(e) => setVisaExpiry(e.target.value)}
                />
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Label>Address</Label>
                <Input
                  value={address.address1}
                  onChange={(e) =>
                    setAddress({ ...address, address1: e.target.value })
                  }
                  placeholder="Address line 1"
                />
                <Input
                  value={address.suburb}
                  onChange={(e) =>
                    setAddress({ ...address, suburb: e.target.value })
                  }
                  placeholder="Suburb"
                />
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-medium">2. Preferences</h2>
                <Label>Tagline</Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />

                <Label>Industries</Label>
                {industries.map((ind) => (
                  <label key={ind.id} className="block">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(ind.id)}
                      onChange={() => toggleIndustry(ind.id)}
                    />
                    {ind.name}
                  </label>
                ))}

                {selectedIndustries.map((indId) => {
                  const industry = industries.find((i) => i.id === indId);
                  const industryRoles = roles.filter(
                    (r) => r.industryId === indId
                  );
                  return (
                    <div key={indId}>
                      <Label>Roles in {industry?.name}</Label>
                      {industryRoles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            selectedRoles.includes(role.id)
                              ? "bg-orange-500 text-white"
                              : ""
                          }`}
                        >
                          {role.name}
                        </button>
                      ))}
                    </div>
                  );
                })}

                <Label>Location Preferences</Label>
                {regions
                  .filter((r) => r.state === "Queensland")
                  .map((r) => {
                    const key = `${r.suburb_city}::${r.postcode}`;
                    return (
                      <label key={r.id} className="block">
                        <input
                          type="checkbox"
                          checked={preferredSuburbs.includes(key)}
                          onChange={() => toggleSuburb(key)}
                        />
                        {r.suburb_city} ({r.postcode})
                      </label>
                    );
                  })}
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-medium">3. Work Exp + Licenses</h2>

                <div className="mb-6">
                  <Button onClick={addWorkExperience}>
                    <Plus /> Add Experience
                  </Button>
                  {workExperiences.map((exp) => (
                    <div key={exp.id} className="border p-2 mb-2">
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "company", e.target.value)
                        }
                        placeholder="Company"
                      />
                      <Input
                        value={exp.position}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "position", e.target.value)
                        }
                        placeholder="Position"
                      />
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "startDate", e.target.value)
                        }
                      />
                      <Input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "endDate", e.target.value)
                        }
                      />
                      <Button onClick={() => removeWorkExperience(exp.id)}>
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <Label>Licenses</Label>
                  {allLicenses.map((lic) => (
                    <label key={lic.id} className="block">
                      <input
                        type="checkbox"
                        checked={licenses.includes(lic.id)}
                        onChange={() => toggleLicense(lic.id)}
                      />
                      {lic.name}
                    </label>
                  ))}
                  {licenses.some(
                    (id) => allLicenses.find((l) => l.id === id)?.name === "Other"
                  ) && (
                    <Input
                      value={otherLicense}
                      onChange={(e) => setOtherLicense(e.target.value)}
                      placeholder="Specify Other"
                    />
                  )}
                </div>

                <div>
                  <Button onClick={addJobReference}>
                    <Plus /> Add Reference
                  </Button>
                  {jobReferences.map((ref) => (
                    <div key={ref.id} className="border p-2 mb-2">
                      <Input
                        value={ref.name}
                        onChange={(e) =>
                          updateJobReference(ref.id, "name", e.target.value)
                        }
                        placeholder="Name"
                      />
                      <Input
                        value={ref.businessName}
                        onChange={(e) =>
                          updateJobReference(ref.id, "businessName", e.target.value)
                        }
                        placeholder="Business Name"
                      />
                      <Input
                        value={ref.email}
                        onChange={(e) =>
                          updateJobReference(ref.id, "email", e.target.value)
                        }
                        placeholder="Email"
                      />
                      <Button onClick={() => removeJobReference(ref.id)}>
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stepper */}
          <div className="p-4 flex justify-between">
            <Button disabled={step === 1} onClick={() => setStep(step - 1)}>
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
  );
};

export default WHVEditProfile;
