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

// ============= Types / constants =============
const australianStates = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
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

interface RegionRuleRow {
  id: number;
  industry_id: number;
  state: string;
  suburb_city: string;
  postcode: string;
}

interface Region {
  id: number;
  industry_id: number;
  state: string;
  suburb_city: string;
  postcode: string;
}

interface License {
  id: number;
  name: string;
}

interface WorkExperience {
  id: string;
  industryId: number | null;
  roleId: number | null;
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

// ============= Component =============
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Step 1: Personal Info
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

  // Step 2: Preferences
  const [tagline, setTagline] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [visaLabel, setVisaLabel] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState({
    tagline: true,
    industries: false,
    states: false,
  });
  const [showPopup, setShowPopup] = useState(false);

  // Step 3: Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");
  const [allIndustries, setAllIndustries] = useState<Industry[]>([]); // NEW for Work Exp
  const [allRoles, setAllRoles] = useState<Role[]>([]); // NEW for Work Exp

  // ============= Load Data =============
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [countriesRes, stagesRes, eligibilityRes, licenseRes] =
        await Promise.all([
          supabase.from("country").select("*").order("name"),
          supabase.from("visa_stage").select("*").order("stage"),
          supabase.from("country_eligibility").select("*"),
          supabase.from("license").select("license_id, name"),
        ]);

      if (countriesRes.data) setCountries(countriesRes.data);
      if (stagesRes.data) setVisaStages(stagesRes.data);
      if (eligibilityRes.data) setEligibility(eligibilityRes.data);
      if (licenseRes.data) {
        setAllLicenses(
          licenseRes.data.map((l) => ({ id: l.license_id, name: l.name }))
        );
      }

      // Load ALL industries/roles (for Work Experience step only)
      const { data: indAll } = await supabase
        .from("industry")
        .select("industry_id, name");
      if (indAll) {
        setAllIndustries(indAll.map((i) => ({ id: i.industry_id, name: i.name })));
      }

      const { data: roleAll } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
      if (roleAll) {
        setAllRoles(
          roleAll.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      // Load existing profile data
      const { data: maker } = await supabase
        .from("whv_maker")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (maker) {
        setNationality(maker.nationality || "");
        setDob(maker.birth_date || "");
        setTagline(maker.tagline || "");
        setPhone(maker.mobile_num || "");
        setAddress({
          address1: maker.address_line1 || "",
          address2: maker.address_line2 || "",
          suburb: maker.suburb || "",
          state: maker.state || "",
          postcode: maker.postcode || "",
        });

        // Find country_id
        const country = countriesRes.data?.find((c) => c.name === maker.nationality);
        if (country) setCountryId(country.country_id);
      }

      // Load visa data
      const { data: visa } = await supabase
        .from("maker_visa")
        .select(
          `
          expiry_date,
          country_id,
          stage_id,
          visa_stage:visa_stage(stage, sub_class, label),
          country:country(name)
        `
        )
        .eq("user_id", user?.id)
        .maybeSingle();

      if (visa && visa.visa_stage && visa.country) {
        setVisaType(visa.visa_stage.label);
        setVisaExpiry(visa.expiry_date || "");
        setVisaLabel(
          `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
        );
        setCountryId(visa.country_id || null);

        // ===== Eligible industries for PREFERENCES only (visa-based) =====
        const { data: eligibleIndustries } = await supabase
          .from("temp_eligibility")
          .select("industry_id, industry_name")
          .eq("sub_class", visa.visa_stage.sub_class)
          .eq("stage", visa.visa_stage.stage)
          .eq("country_name", visa.country.name);

        if (eligibleIndustries && eligibleIndustries.length > 0) {
          const prefIndustries = eligibleIndustries.map((i) => ({
            id: i.industry_id,
            name: i.industry_name,
          }));
          setIndustries(prefIndustries);

          const industryIds = eligibleIndustries.map((i) => i.industry_id);

          // Roles (for preferences) filtered to eligible industries
          const { data: roleData } = await supabase
            .from("industry_role")
            .select("industry_role_id, role, industry_id")
            .in("industry_id", industryIds);

          if (roleData) {
            setRoles(
              roleData.map((r) => ({
                id: r.industry_role_id,
                name: r.role,
                industryId: r.industry_id,
              }))
            );
          }

          // Regions (for preferences). We use regional_rules (suburb_city + postcode).
          const { data: regionData } = await supabase
            .from("regional_rules")
            .select("id, industry_id, state, suburb_city, postcode")
            .in("industry_id", industryIds);

          if (regionData) {
            setRegions(
              regionData.map((r) => ({
                id: r.id,
                industry_id: r.industry_id,
                state: r.state,
                suburb_city: r.suburb_city,
                postcode: r.postcode,
              }))
            );
          }
        }
      }

      // ===== Load saved preferences (maker_pref_*) =====
      // Selected industries
      const { data: savedIndustries } = await supabase
        .from("maker_pref_industry")
        .select("industry_id")
        .eq("user_id", user!.id);

      if (savedIndustries) {
        setSelectedIndustries(savedIndustries.map((i) => i.industry_id));
      }

      // Selected roles
      const { data: savedRoles } = await supabase
        .from("maker_pref_industry_role")
        .select("industry_role_id")
        .eq("user_id", user!.id);

      if (savedRoles) {
        setSelectedRoles(savedRoles.map((r) => r.industry_role_id));
      }

      // Selected locations (state + suburb_city + postcode)
      const { data: savedLocations } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", user!.id);

      if (savedLocations) {
        setPreferredStates([...new Set(savedLocations.map((l) => l.state))]);
        setPreferredAreas(
          savedLocations.map((l) => `${l.suburb_city}::${l.postcode}`)
        );
      }

      // ===== Load work experience =====
      const { data: exp } = await supabase
        .from("maker_work_experience")
        .select("*")
        .eq("user_id", user!.id);

      if (exp) {
        setWorkExperiences(
          exp.map((e) => ({
            id: e.work_experience_id?.toString?.() ?? `${e.company}-${e.start_date}`,
            // NOTE: Work Experience industry/role in the UI uses ALL industries/roles.
            // The table may not have industry_role_id; we map industry_id and keep roleId nullable.
            industryId: e.industry_id ?? null,
            roleId: (e as any).industry_role_id ?? null, // tolerate absence
            position: e.position || "",
            company: e.company || "",
            location: e.location || "",
            startDate: e.start_date || "",
            endDate: e.end_date || "",
            description: e.job_description || "",
          }))
        );
      }

      // ===== Load references =====
      const { data: refs } = await supabase
        .from("maker_reference")
        .select("*")
        .eq("user_id", user!.id);

      if (refs) {
        setJobReferences(
          refs.map((r) => ({
            id: r.reference_id?.toString?.() ?? `${r.email}-${r.mobile_num}`,
            name: r.name || "",
            businessName: r.business_name || "",
            email: r.email || "",
            phone: r.mobile_num || "",
            role: r.role || "",
          }))
        );
      }

      // ===== Load licenses =====
      const { data: makerLic } = await supabase
        .from("maker_license")
        .select("*")
        .eq("user_id", user!.id);

      if (makerLic) {
        setLicenses(makerLic.map((l) => l.license_id));
        const other = makerLic.find((l) => l.other)?.other;
        if (other) setOtherLicense(other);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // ============= Validation (same helpers you had) =============
  const isValidAUPhone = (p: string) => /^(\+614\d{8}|04\d{8})$/.test(p);

  const isValidExpiry = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate > today;
  };

  // ============= UI Section Toggles =============
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ============= Preferences: Industries & Roles (visa-eligible) =============
  const handleIndustrySelect = (industryId: number) => {
    if (
      !selectedIndustries.includes(industryId) &&
      selectedIndustries.length < 3
    ) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(selectedIndustries.filter((id) => id !== industryId));
      const industryRoles = roles
        .filter((r) => r.industryId === industryId)
        .map((r) => r.id);
      setSelectedRoles(
        selectedRoles.filter((roleId) => !industryRoles.includes(roleId))
      );
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  // ============= Preferred Locations (Popup for non-Queensland) =============
  const [showPopup, setShowPopup] = useState(false);

  const togglePreferredState = (state: string) => {
    if (state !== "Queensland") {
      setShowPopup(true); // show modal like onboarding
      return;
    }

    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;

    setPreferredStates(newStates);

    // Keep only areas that still match chosen states
    const validAreas = regions
      .filter((r) => newStates.includes(r.state))
      .map((r) => `${r.suburb_city}::${r.postcode}`);

    setPreferredAreas((prev) => prev.filter((a) => validAreas.includes(a)));
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas((prev) => {
      if (prev.includes(locKey)) {
        return prev.filter((a) => a !== locKey);
      }
      if (prev.length >= 3) return prev;
      return [...prev, locKey];
    });
  };

  const getAreasForState = (state: string) => {
    return regions
      .filter((r) => r.state === state && selectedIndustries.includes(r.industry_id))
      .map((r) => `${r.suburb_city}::${r.postcode}`);
  };

  // ============= Work Experience (ALL industries/roles) =============
  const addWorkExperience = () => {
    if (workExperiences.length < 8) {
      setWorkExperiences((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          industryId: null,
          roleId: null,
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
  ) => {
    setWorkExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  // ============= Job References =============
  const addJobReference = () => {
    if (jobReferences.length < 5) {
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
      ]);
    }
  };

  const updateJobReference = (
    id: string,
    field: keyof JobReference,
    value: string
  ) => {
    setJobReferences((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref))
    );
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // ============= Licenses =============
  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) =>
      prev.includes(licenseId)
        ? prev.filter((l) => l !== licenseId)
        : [...prev, licenseId]
    );
  };

  // ============= Save All =============
  const saveAllData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Personal
      const selectedStage = visaStages.find((v) => v.label === visaType);

      await supabase
        .from("whv_maker")
        .update({
          nationality: nationality as any,
          birth_date: dob,
          mobile_num: phone,
          address_line1: address.address1,
          address_line2: address.address2 || null,
          suburb: address.suburb,
          state: address.state as any,
          postcode: address.postcode,
          tagline: tagline.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (selectedStage) {
        await supabase.from("maker_visa").upsert(
          {
            user_id: user.id,
            country_id: countryId,
            stage_id: selectedStage.stage_id,
            dob: dob,
            expiry_date: visaExpiry,
          } as any,
          { onConflict: "user_id" }
        );
      }

      // ===== Save preferences to maker_pref_* tables =====
      // Clear old
      await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
      await supabase
        .from("maker_pref_industry_role")
        .delete()
        .eq("user_id", user.id);
      await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

      // Industries
      if (selectedIndustries.length > 0) {
        await supabase.from("maker_pref_industry").insert(
          selectedIndustries.map((indId) => ({
            user_id: user.id,
            industry_id: indId,
          }))
        );
      }

      // Roles
      if (selectedRoles.length > 0) {
        await supabase.from("maker_pref_industry_role").insert(
          selectedRoles.map((roleId) => ({
            user_id: user.id,
            industry_role_id: roleId,
          }))
        );
      }

      // Locations — only Queensland is actionable; we persist suburb+postcode pairs for QLD
      if (preferredAreas.length > 0 && preferredStates.includes("Queensland")) {
        await supabase.from("maker_pref_location").insert(
          preferredAreas.map((locKey) => {
            const [suburb_city, postcode] = locKey.split("::");
            return {
              user_id: user.id,
              state: "Queensland",
              suburb_city,
              postcode,
            };
          })
        );
      }

      // ===== Save Work Experience =====
      // Clear existing
      await supabase.from("maker_work_experience").delete().eq("user_id", user.id);

      const validExperiences = workExperiences.filter(
        (exp) =>
          exp.company.trim() &&
          exp.position.trim() &&
          exp.industryId !== null &&
          exp.startDate &&
          exp.endDate
      );

      if (validExperiences.length > 0) {
        // Note: table may not have industry_role_id; we store industry_id and position.
        const workRows = validExperiences.map((exp) => ({
          user_id: user.id,
          company: exp.company.trim(),
          position: exp.position.trim(),
          start_date: exp.startDate,
          end_date: exp.endDate,
          location: exp.location || null,
          industry_id: exp.industryId!,
          job_description: exp.description || null,
          // If your schema supports it, you can include industry_role_id: exp.roleId ?? null
        }));
        await supabase.from("maker_work_experience").insert(workRows);
      }

      // ===== Save References =====
      await supabase.from("maker_reference").delete().eq("user_id", user.id);
      if (jobReferences.length > 0) {
        const refRows = jobReferences.map((ref) => ({
          user_id: user.id,
          name: ref.name || null,
          business_name: ref.businessName || null,
          email: ref.email || null,
          mobile_num: ref.phone || null,
          role: ref.role || null,
        }));
        await supabase.from("maker_reference").insert(refRows);
      }

      // ===== Save Licenses =====
      await supabase.from("maker_license").delete().eq("user_id", user.id);
      if (licenses.length > 0) {
        const licRows = licenses.map((licenseId) => ({
          user_id: user.id,
          license_id: licenseId,
          other:
            allLicenses.find((l) => l.id === licenseId)?.name === "Other"
              ? otherLicense
              : null,
        }));
        await supabase.from("maker_license").insert(licRows);
      }

      // Done
      // (we'll show toast & navigate in the UI section after render)
      setTimeout(() => {
        // no-op here; UI button will trigger toast + navigate to dashboard after promise
      }, 0);
    } catch (error) {
      // We'll use the UI toast in the click handler to show errors as well.
      console.error("Error saving profile:", error);
      throw error;
    }
  };
  };

  // ===== Filter stages by country eligibility (for the Visa Type select) =====
  const filteredStages =
    countryId !== null
      ? visaStages.filter((v) =>
          eligibility.some((e) => e.country_id === countryId && e.stage_id === v.stage_id)
        )
      : [];

  // ============= Render =============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl relative">
        {/* Popup for invalid states (matches onboarding) */}
        {showPopup && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
              <h2 className="text-lg font-semibold mb-3">Not Eligible</h2>
              <p className="text-sm text-gray-600 mb-4">
                Only Queensland is eligible at this time.
              </p>
              <Button
                onClick={() => setShowPopup(false)}
                className="w-full bg-slate-800 text-white rounded-lg"
              >
                OK
              </Button>
            </div>
          </div>
        )}

        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between">
            <button
              onClick={() => navigate("/whv/dashboard")}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
            <button
              onClick={async () => {
                try {
                  await saveAllData();
                  // You can replace with toast if you wire it up
                  // toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
                  navigate("/whv/dashboard");
                } catch (e) {
                  // toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
                  console.error(e);
                }
              }}
              className="text-orange-500 font-medium flex items-center"
            >
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>

                {/* Read-only fields */}
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

                {/* Visa Type (eligible by country) */}
                {filteredStages.length > 0 && (
                  <div>
                    <Label>Visa Type *</Label>
                    <Select value={visaType} onValueChange={setVisaType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visa type" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStages.map((v) => (
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
                  <Input
                    type="date"
                    value={visaExpiry}
                    onChange={(e) => setVisaExpiry(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="04xxxxxxxx or +614xxxxxxxx"
                  />
                </div>

                {/* Address */}
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
                    onValueChange={(v) => setAddress({ ...address, state: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {australianStates.map((s) => (
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
                    maxLength={4}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {visaLabel && <p className="text-sm text-gray-500">Visa: {visaLabel}</p>}

                {/* 1. Tagline */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleSection("tagline")}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">1. Profile Tagline</span>
                    {expandedSections.tagline ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedSections.tagline && (
                    <div className="px-4 pb-4 border-t space-y-3">
                      <Input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. Backpacker ready for farm work"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Industries & Roles (visa-eligible set for PREFERENCES) */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleSection("industries")}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">2. Industries & Roles</span>
                    {expandedSections.industries ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedSections.industries && (
                    <div className="px-4 pb-4 border-t space-y-4">
                      <Label>Select up to 3 industries *</Label>
                      {industries.map((industry) => (
                        <label key={industry.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(industry.id)}
                            disabled={
                              selectedIndustries.length >= 3 &&
                              !selectedIndustries.includes(industry.id)
                            }
                            onChange={() => handleIndustrySelect(industry.id)}
                            className="h-4 w-4"
                          />
                          <span>{industry.name}</span>
                        </label>
                      ))}

                      {selectedIndustries.map((industryId) => {
                        const industry = industries.find((i) => i.id === industryId);
                        const industryRoles = roles.filter((r) => r.industryId === industryId);
                        return (
                          <div key={industryId}>
                            <Label>Roles for {industry?.name}</Label>
                            <div className="flex flex-wrap gap-2">
                              {industryRoles.map((role) => (
                                <button
                                  type="button"
                                  key={role.id}
                                  onClick={() => toggleRole(role.id)}
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

                {/* 3. Preferred Locations */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleSection("states")}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">3. Preferred Locations</span>
                    {expandedSections.states ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedSections.states && (
                    <div className="px-4 pb-4 border-t space-y-4">
                      <Label>Preferred States (up to 3)</Label>

                      {/* Show all Australian states; only Queensland is actionable (areas) */}
                      {australianStates.map((state) => (
                        <div key={state} className="mb-4">
                          <label className="flex items-center space-x-2 py-1 font-medium">
                            <input
                              type="checkbox"
                              checked={preferredStates.includes(state)}
                              onChange={() => togglePreferredState(state)}
                              disabled={
                                preferredStates.length >= 3 &&
                                !preferredStates.includes(state)
                              }
                            />
                            <span>{state}</span>
                          </label>

                          {/* Only Queensland expands into areas */}
                          {preferredStates.includes(state) && state === "Queensland" && (
                            <div className="ml-6 space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                              {getAreasForState(state).map((locKey) => {
                                const [suburb_city, postcode] = locKey.split("::");
                                return (
                                  <label key={locKey} className="flex items-center space-x-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={preferredAreas.includes(locKey)}
                                      onChange={() => togglePreferredArea(locKey)}
                                      disabled={
                                        preferredAreas.length >= 3 &&
                                        !preferredAreas.includes(locKey)
                                      }
                                    />
                                    <span>
                                      {suburb_city} ({postcode})
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 pb-20">
                {/* Work Experience Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                    <Button
                      type="button"
                      onClick={addWorkExperience}
                      disabled={workExperiences.length >= 8}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>

                  {workExperiences.map((exp, index) => (
                    <div
                      key={exp.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">Experience {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeWorkExperience(exp.id)}
                          className="text-red-500"
                        >
                          <X size={16} />
                        </Button>
                      </div>

                      {/* Industry (ALL industries) */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Industry <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={exp.industryId ? String(exp.industryId) : ""}
                          onValueChange={(value) =>
                            updateWorkExperience(exp.id, "industryId", Number(value))
                          }
                        >
                          <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {allIndustries.map((ind) => (
                              <SelectItem key={ind.id} value={String(ind.id)}>
                                {ind.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Role / Position (ALL roles filtered by chosen industry) */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Position (Role)
                        </Label>
                        <Select
                          value={exp.roleId ? String(exp.roleId) : ""}
                          onValueChange={(value) =>
                            updateWorkExperience(exp.id, "roleId", Number(value))
                          }
                          disabled={!exp.industryId}
                        >
                          <SelectTrigger className="h-10 bg-gray-100 border-0 text-sm">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {allRoles
                              .filter((r) => r.industryId === exp.industryId)
                              .map((role) => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                  {role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Position free text (kept, in case you want custom titles) */}
                      <Input
                        type="text"
                        value={exp.position}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "position", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Position"
                        required
                      />

                      {/* Company */}
                      <Input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "company", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Company"
                        required
                      />

                      {/* Location */}
                      <Input
                        type="text"
                        value={exp.location}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "location", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Location"
                      />

                      {/* Description */}
                      <textarea
                        value={exp.description}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "description", e.target.value)
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
                            updateWorkExperience(exp.id, "startDate", e.target.value)
                          }
                          className="h-10 bg-gray-100 border-0 text-sm"
                          required
                        />
                        <Input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) =>
                            updateWorkExperience(exp.id, "endDate", e.target.value)
                          }
                          className="h-10 bg-gray-100 border-0 text-sm"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Licenses */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Licenses & Tickets</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-100 rounded-lg p-3">
                    {allLicenses.map((license) => (
                      <div key={license.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`license-${license.id}`}
                          checked={licenses.includes(license.id)}
                          onChange={() => toggleLicense(license.id)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                        />
                        <Label
                          htmlFor={`license-${license.id}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {license.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {licenses.some((id) => allLicenses.find((l) => l.id === id)?.name === "Other") && (
                    <Input
                      type="text"
                      value={otherLicense}
                      onChange={(e) => setOtherLicense(e.target.value)}
                      className="h-10 bg-gray-100 border-0 text-sm mt-2"
                      placeholder="Specify other license"
                    />
                  )}
                </div>

                {/* Job References */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Job References</h2>
                    <Button
                      type="button"
                      onClick={addJobReference}
                      disabled={jobReferences.length >= 5}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>

                  {jobReferences.map((ref, index) => (
                    <div
                      key={ref.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">Reference {index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeJobReference(ref.id)}
                          className="text-red-500"
                        >
                          <X size={16} />
                        </Button>
                      </div>

                      <Input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateJobReference(ref.id, "name", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Name"
                      />
                      <Input
                        type="text"
                        value={ref.businessName}
                        onChange={(e) =>
                          updateJobReference(ref.id, "businessName", e.target.value)
                        }
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Business Name"
                      />
                      <Input
                        type="email"
                        value={ref.email}
                        onChange={(e) => updateJobReference(ref.id, "email", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Email"
                      />
                      <Input
                        type="text"
                        value={ref.phone}
                        onChange={(e) => updateJobReference(ref.id, "phone", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Phone"
                      />
                      <Input
                        type="text"
                        value={ref.role}
                        onChange={(e) => updateJobReference(ref.id, "role", e.target.value)}
                        className="h-10 bg-gray-100 border-0 text-sm"
                        placeholder="Role"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
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
              <Button disabled={step === 1} onClick={() => setStep(step - 1)} variant="outline">
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
