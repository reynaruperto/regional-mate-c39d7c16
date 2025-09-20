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

// ================= Types =================
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
  roleId: number | null;
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

// ================= Component =================
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Personal Info
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
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

  // Preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredRegions, setPreferredRegions] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    tagline: true,
    industries: false,
    locations: false,
  });

  // Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // ================= Load Data =================
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Industries + Roles
      const { data: ind } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (ind)
        setIndustries(ind.map((i) => ({ id: i.industry_id, name: i.name })));

      const { data: roleData } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
      if (roleData)
        setRoles(
          roleData.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );

      // Regions
      const { data: reg } = await supabase
        .from("region_rules")
        .select("region_rules_id, state, suburb_city, postcode");
      if (reg)
        setRegions(
          reg.map((r) => ({
            id: r.region_rules_id,
            state: r.state,
            suburb_city: r.suburb_city,
            postcode: r.postcode,
          }))
        );

      // Licenses
      const { data: lic } = await supabase
        .from("license")
        .select("license_id, name");
      if (lic)
        setAllLicenses(lic.map((l) => ({ id: l.license_id, name: l.name })));

      // Existing profile
      const { data: maker } = await supabase
        .from("whv_maker")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (maker) {
        setDob(maker.birth_date || "");
        setNationality(maker.nationality || "");
        setPhone(maker.mobile_num || "");
        setAddress({
          address1: maker.address_line1 || "",
          address2: maker.address_line2 || "",
          suburb: maker.suburb || "",
          state: maker.state || "",
          postcode: maker.postcode || "",
        });
        setTagline(maker.tagline || "");
      }

      // Preferences
      const { data: prefs } = await supabase
        .from("maker_preference")
        .select("*")
        .eq("user_id", user.id);
      if (prefs) {
        setSelectedRoles(prefs.map((p) => p.industry_role_id));
        setPreferredRegions(prefs.map((p) => p.region_rules_id));
        const inds = roles
          .filter((r) => prefs.some((p) => p.industry_role_id === r.id))
          .map((r) => r.industryId);
        setSelectedIndustries([...new Set(inds)]);
      }

      // Work Experience
      const { data: exp } = await supabase
        .from("maker_work_experience")
        .select("*")
        .eq("user_id", user.id);
      if (exp)
        setWorkExperiences(
          exp.map((e) => ({
            id: e.work_experience_id.toString(),
            industryId: e.industry_id,
            roleId: e.industry_role_id,
            company: e.company,
            location: e.location || "",
            startDate: e.start_date,
            endDate: e.end_date,
            description: e.job_description || "",
          }))
        );

      // Licenses
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
      if (refs)
        setJobReferences(
          refs.map((r) => ({
            id: r.reference_id.toString(),
            name: r.name || "",
            businessName: r.business_name || "",
            email: r.email || "",
            phone: r.mobile_num || "",
            role: r.role || "",
          }))
        );

      setLoading(false);
    };
    loadData();
  }, []);

  // ================= Handlers =================
  const toggleSection = (s: keyof typeof expandedSections) =>
    setExpandedSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleIndustrySelect = (id: number) => {
    if (!selectedIndustries.includes(id) && selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, id]);
    } else {
      setSelectedIndustries(selectedIndustries.filter((x) => x !== id));
      const rmRoles = roles.filter((r) => r.industryId === id).map((r) => r.id);
      setSelectedRoles(selectedRoles.filter((r) => !rmRoles.includes(r)));
    }
  };
  const toggleRole = (id: number) =>
    setSelectedRoles(
      selectedRoles.includes(id)
        ? selectedRoles.filter((r) => r !== id)
        : [...selectedRoles, id]
    );
  const toggleRegion = (id: number) =>
    setPreferredRegions(
      preferredRegions.includes(id)
        ? preferredRegions.filter((r) => r !== id)
        : [...preferredRegions, id]
    );

  const addWorkExperience = () => {
    if (workExperiences.length < 8)
      setWorkExperiences([
        ...workExperiences,
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
      ]);
  };
  const updateWorkExperience = (
    id: string,
    field: keyof WorkExperience,
    value: any
  ) =>
    setWorkExperiences(
      workExperiences.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  const removeWorkExperience = (id: string) =>
    setWorkExperiences(workExperiences.filter((e) => e.id !== id));

  const toggleLicense = (id: number) =>
    setLicenses(
      licenses.includes(id)
        ? licenses.filter((l) => l !== id)
        : [...licenses, id]
    );

  // ================= Save =================
  const saveAll = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Save maker
      await supabase.from("whv_maker").update({
        birth_date: dob,
        nationality,
        tagline,
        mobile_num: phone,
        address_line1: address.address1,
        address_line2: address.address2,
        suburb: address.suburb,
        state: address.state,
        postcode: address.postcode,
      }).eq("user_id", user.id);

      // Save preferences
      await supabase.from("maker_preference").delete().eq("user_id", user.id);
      const prefRows = selectedRoles.flatMap((roleId) =>
        preferredRegions.map((regId) => ({
          user_id: user.id,
          industry_role_id: roleId,
          region_rules_id: regId,
        }))
      );
      if (prefRows.length)
        await supabase.from("maker_preference").insert(prefRows);

      // Save experiences
      await supabase
        .from("maker_work_experience")
        .delete()
        .eq("user_id", user.id);
      const expRows = workExperiences
        .filter((e) => e.industryId && e.roleId && e.company.trim())
        .map((e) => ({
          user_id: user.id,
          industry_id: e.industryId,
          industry_role_id: e.roleId,
          company: e.company,
          location: e.location,
          start_date: e.startDate,
          end_date: e.endDate,
          job_description: e.description,
        }));
      if (expRows.length)
        await supabase.from("maker_work_experience").insert(expRows);

      // Save licenses
      await supabase.from("maker_license").delete().eq("user_id", user.id);
      const licRows = licenses.map((id) => ({
        user_id: user.id,
        license_id: id,
        other:
          allLicenses.find((l) => l.id === id)?.name === "Other"
            ? otherLicense
            : null,
      }));
      if (licRows.length)
        await supabase.from("maker_license").insert(licRows);

      // Save references
      await supabase.from("maker_reference").delete().eq("user_id", user.id);
      if (jobReferences.length)
        await supabase.from("maker_reference").insert(
          jobReferences.map((r) => ({
            user_id: user.id,
            name: r.name,
            business_name: r.businessName,
            email: r.email,
            mobile_num: r.phone,
            role: r.role,
          }))
        );

      toast({ title: "Profile updated" });
      navigate("/whv/dashboard");
    } catch (err) {
      console.error(err);
      toast({ title: "Error updating profile", variant: "destructive" });
    }
  };

  // ================= Render =================
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50" />
          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/whv/dashboard")}
              className="w-10 h-10"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
            <Button variant="ghost" onClick={saveAll} className="text-orange-500">
              <Check size={16} className="mr-1" /> Save
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <Label>Nationality</Label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
                <Label>Visa Expiry</Label>
                <Input
                  type="date"
                  value={visaExpiry}
                  onChange={(e) => setVisaExpiry(e.target.value)}
                />
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Tagline */}
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection("tagline")}
                    className="w-full flex justify-between p-4"
                  >
                    <span>Tagline</span>
                    {expandedSections.tagline ? <ChevronDown /> : <ChevronRight />}
                  </button>
                  {expandedSections.tagline && (
                    <div className="px-4 pb-4">
                      <Input
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. Ready for farm work"
                      />
                    </div>
                  )}
                </div>

                {/* Industries & Roles */}
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection("industries")}
                    className="w-full flex justify-between p-4"
                  >
                    <span>Industries & Roles</span>
                    {expandedSections.industries ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )}
                  </button>
                  {expandedSections.industries && (
                    <div className="px-4 pb-4 space-y-3">
                      {industries.map((ind) => (
                        <div key={ind.id}>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedIndustries.includes(ind.id)}
                              onChange={() => handleIndustrySelect(ind.id)}
                            />
                            <span>{ind.name}</span>
                          </label>
                          {selectedIndustries.includes(ind.id) && (
                            <div className="ml-6 flex flex-wrap gap-2 mt-1">
                              {roles
                                .filter((r) => r.industryId === ind.id)
                                .map((r) => (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => toggleRole(r.id)}
                                    className={`px-2 py-1 rounded-full text-xs border ${
                                      selectedRoles.includes(r.id)
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    {r.name}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Preferences */}
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection("locations")}
                    className="w-full flex justify-between p-4"
                  >
                    <span>Preferred Locations</span>
                    {expandedSections.locations ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )}
                  </button>
                  {expandedSections.locations && (
                    <div className="px-4 pb-4 space-y-2">
                      {regions.map((r) => (
                        <label
                          key={r.id}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={preferredRegions.includes(r.id)}
                            onChange={() => toggleRegion(r.id)}
                          />
                          <span>
                            {r.suburb_city}, {r.state} {r.postcode}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Work Experience */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Work Experience</h2>
                  <Button onClick={addWorkExperience} size="sm">
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                </div>
                {workExperiences.map((exp, idx) => (
                  <div key={exp.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span>Experience {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkExperience(exp.id)}
                      >
                        <X />
                      </Button>
                    </div>
                    <Label>Industry</Label>
                    <Select
                      value={exp.industryId ? String(exp.industryId) : ""}
                      onValueChange={(v) =>
                        updateWorkExperience(exp.id, "industryId", Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {exp.industryId && (
                      <>
                        <Label>Role</Label>
                        <Select
                          value={exp.roleId ? String(exp.roleId) : ""}
                          onValueChange={(v) =>
                            updateWorkExperience(exp.id, "roleId", Number(v))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter((r) => r.industryId === exp.industryId)
                              .map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>
                                  {r.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}

                    <Input
                      value={exp.company}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "company", e.target.value)
                      }
                      placeholder="Company"
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
                    <textarea
                      value={exp.description}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                ))}

                {/* Licenses */}
                <div>
                  <h2 className="font-semibold">Licenses</h2>
                  <div className="space-y-1">
                    {allLicenses.map((l) => (
                      <label key={l.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={licenses.includes(l.id)}
                          onChange={() => toggleLicense(l.id)}
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
                      placeholder="Specify other license"
                    />
                  )}
                </div>

                {/* References */}
                <div>
                  <h2 className="font-semibold">Job References</h2>
                  {jobReferences.map((ref, idx) => (
                    <div key={ref.id} className="border rounded p-3 space-y-2">
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
                    </div>
                  ))}
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
                    className="mt-2"
                  >
                    <Plus size={14} className="mr-1" /> Add Reference
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stepper */}
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
