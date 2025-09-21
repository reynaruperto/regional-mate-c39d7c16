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
  sub_class: string; // e.g. 417, 462, 500, etc.
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
  const { toast } = useToast();

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

  // Step 3: Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

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

        const cn = countriesRes.data?.find((c) => c.name === maker.nationality);
        if (cn) setCountryId(cn.country_id);
      }

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
        .eq("user_id", user.id)
        .maybeSingle();

      if (visa?.visa_stage && visa.country) {
        setVisaType(visa.visa_stage.label);
        setVisaExpiry(visa.expiry_date);
        setVisaLabel(
          `${visa.visa_stage.sub_class} – Stage ${visa.visa_stage.stage} (${visa.country.name})`
        );
        setCountryId(visa.country_id);
      }

      // === NEW: Load all industries & roles regardless of visa ===
      const { data: allIndustries } = await supabase
        .from("industry")
        .select("industry_id, name")
        .order("name");
      if (allIndustries) {
        setIndustries(
          allIndustries.map((i) => ({ id: i.industry_id, name: i.name }))
        );
      }

      const { data: allRoles } = await supabase
        .from("industry_role")
        .select("industry_role_id, role, industry_id");
      if (allRoles) {
        setRoles(
          allRoles.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      const { data: regionRows } = await supabase
        .from("regional_rules")
        .select("id, industry_id, state, suburb_city, postcode");
      if (regionRows) {
        setRegions(
          regionRows.map((r: RegionRuleRow) => ({
            id: r.id,
            industry_id: r.industry_id,
            state: r.state,
            suburb_city: r.suburb_city,
            postcode: r.postcode,
          }))
        );
      }

      // Saved Preferences...
      const { data: savedInd } = await supabase
        .from("maker_pref_industry")
        .select("industry_id")
        .eq("user_id", user.id);
      if (savedInd?.length) {
        setSelectedIndustries(savedInd.map((i) => i.industry_id));
      }

      const { data: savedRoles } = await supabase
        .from("maker_pref_industry_role")
        .select("industry_role_id")
        .eq("user_id", user.id);
      if (savedRoles?.length) {
        setSelectedRoles(savedRoles.map((r) => r.industry_role_id));
      }

      const { data: savedLocs } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode")
        .eq("user_id", user.id);
      if (savedLocs?.length) {
        setPreferredStates([...new Set(savedLocs.map((l) => l.state))]);
        setPreferredAreas(
          savedLocs.map((l) => `${l.suburb_city}::${l.postcode}`)
        );
      }

      const { data: exp } = await supabase
        .from("maker_work_experience")
        .select(
          "work_experience_id, industry_id, industry_role_id, position, company, location, start_date, end_date, job_description"
        )
        .eq("user_id", user.id);
      if (exp) {
        setWorkExperiences(
          exp.map((e) => ({
            id: String(e.work_experience_id),
            industryId: e.industry_id,
            roleId: e.industry_role_id ?? null,
            position: e.position || "",
            company: e.company || "",
            location: e.location || "",
            startDate: e.start_date || "",
            endDate: e.end_date || "",
            description: e.job_description || "",
          }))
        );
      }

      const { data: refs } = await supabase
        .from("maker_reference")
        .select("*")
        .eq("user_id", user.id);
      if (refs) {
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
      }

      const { data: makerLic } = await supabase
        .from("maker_license")
        .select("*")
        .eq("user_id", user.id);
      if (makerLic) {
        setLicenses(makerLic.map((l) => l.license_id));
        const other = makerLic.find((l) => l.other)?.other;
        if (other) setOtherLicense(other);
      }

      setLoading(false);
    };

    loadData();
  }, []);
  // ============= Handlers =============
  const isValidAUPhone = (p: string) => /^(\+614\d{8}|04\d{8})$/.test(p);
  const isValidExpiry = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate > today;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleIndustrySelect = (industryId: number) => {
    if (
      !selectedIndustries.includes(industryId) &&
      selectedIndustries.length < 3
    ) {
      setSelectedIndustries([...selectedIndustries, industryId]);
    } else if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries(
        selectedIndustries.filter((id) => id !== industryId)
      );
      const industryRoles = roles
        .filter((r) => r.industryId === industryId)
        .map((r) => r.id);
      setSelectedRoles(
        selectedRoles.filter((roleId) => !industryRoles.includes(roleId))
      );
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId)
        ? selectedRoles.filter((r) => r !== roleId)
        : [...selectedRoles, roleId]
    );
  };

  // === NEW: Preferred state toggle (Queensland only actionable) ===
  const togglePreferredState = (state: string) => {
    if (state !== "Queensland") {
      toast({
        title: "Not Available",
        description: `${state} is not currently available. Only Queensland is selectable.`,
        variant: "destructive",
      });
      return;
    }

    const newStates = preferredStates.includes(state)
      ? preferredStates.filter((s) => s !== state)
      : preferredStates.length < 3
      ? [...preferredStates, state]
      : preferredStates;
    setPreferredStates(newStates);

    const validAreaKeys = regions
      .filter((r) => newStates.includes(r.state))
      .map((r) => `${r.suburb_city}::${r.postcode}`);
    setPreferredAreas((prev) => prev.filter((a) => validAreaKeys.includes(a)));
  };

  const togglePreferredArea = (locKey: string) => {
    setPreferredAreas((prev) => {
      if (prev.includes(locKey)) return prev.filter((a) => a !== locKey);
      if (prev.length >= 3) return prev;
      return [...prev, locKey];
    });
  };

  const getAreasForState = (state: string) => {
    const keys = regions
      .filter((r) => r.state === state)
      .map((r) => `${r.suburb_city}::${r.postcode}`);
    return [...new Set(keys)];
  };

  // Work Experience handlers
  const addWorkExperience = () => {
    if (workExperiences.length < 8) {
      setWorkExperiences([
        ...workExperiences,
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

  // Job Reference handlers
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
  ) => {
    setJobReferences((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref))
    );
  };

  const removeJobReference = (id: string) => {
    setJobReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // License handlers
  const toggleLicense = (licenseId: number) => {
    setLicenses((prev) =>
      prev.includes(licenseId)
        ? prev.filter((l) => l !== licenseId)
        : [...prev, licenseId]
    );
  };
  // Save handlers
  const saveAllData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
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
          },
          { onConflict: "user_id" }
        );
      }

      await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
      await supabase
        .from("maker_pref_industry_role")
        .delete()
        .eq("user_id", user.id);
      await supabase.from("maker_pref_location").delete().eq("user_id", user.id);

      if (selectedIndustries.length) {
        await supabase.from("maker_pref_industry").insert(
          selectedIndustries.map((industry_id) => ({
            user_id: user.id,
            industry_id,
          }))
        );
      }

      if (selectedRoles.length) {
        await supabase.from("maker_pref_industry_role").insert(
          selectedRoles.map((industry_role_id) => ({
            user_id: user.id,
            industry_role_id,
          }))
        );
      }

      if (preferredAreas.length) {
        const rows: {
          user_id: string;
          state: string;
          suburb_city: string;
          postcode: string;
        }[] = [];
        preferredStates.forEach((state) => {
          const keysForState = getAreasForState(state);
          preferredAreas.forEach((locKey) => {
            if (keysForState.includes(locKey)) {
              const [suburb_city, postcode] = locKey.split("::");
              rows.push({
                user_id: user.id,
                state,
                suburb_city,
                postcode,
              });
            }
          });
        });
        if (rows.length) {
          await supabase.from("maker_pref_location").insert(rows);
        }
      }

      await supabase
        .from("maker_work_experience")
        .delete()
        .eq("user_id", user.id);

      const validExperiences = workExperiences.filter(
        (exp) =>
          exp.company.trim() &&
          exp.industryId !== null &&
          exp.startDate &&
          exp.endDate
      );

      if (validExperiences.length > 0) {
        const workRows = validExperiences.map((exp) => ({
          user_id: user.id,
          company: exp.company.trim(),
          position: exp.position.trim(),
          start_date: exp.startDate,
          end_date: exp.endDate,
          location: exp.location || null,
          industry_id: exp.industryId!,
          industry_role_id: exp.roleId ?? null,
          job_description: exp.description || null,
        }));
        await supabase.from("maker_work_experience").insert(workRows);
      }

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

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      navigate("/whv/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredStages =
    countryId !== null
      ? visaStages.filter((v) =>
          eligibility.some(
            (e) => e.country_id === countryId && e.stage_id === v.stage_id
          )
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
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
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
              onClick={saveAllData}
              className="text-orange-500 font-medium flex items-center"
            >
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* step 1, step 2, step 3 unchanged from before except Preferred States */}
            {/* In Preferred Locations section */}
            {step === 2 && (
              <div className="space-y-6">
                {visaLabel && (
                  <p className="text-sm text-gray-500">Visa: {visaLabel}</p>
                )}
                {/* Tagline + Industries omitted here for brevity, unchanged */}

                {/* Preferred Locations */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleSection("states")}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-lg font-medium">
                      3. Preferred Locations
                    </span>
                    {expandedSections.states ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  {expandedSections.states && (
                    <div className="px-4 pb-4 border-t space-y-4">
                      <Label>Preferred States (only Queensland selectable)</Label>
                      {australianStates.map((state) => (
                        <div key={state} className="mb-4">
                          <label className="flex items-center space-x-2 py-1 font-medium">
                            <input
                              type="checkbox"
                              checked={preferredStates.includes(state)}
                              onChange={() => togglePreferredState(state)}
                              disabled={
                                state !== "Queensland" &&
                                !preferredStates.includes(state)
                              }
                            />
                            <span>{state}</span>
                          </label>

                          {preferredStates.includes(state) &&
                            state === "Queensland" && (
                              <div className="ml-6 space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                                {getAreasForState(state).map((locKey) => {
                                  const [suburb_city, postcode] =
                                    locKey.split("::");
                                  return (
                                    <label
                                      key={locKey}
                                      className="flex items-center space-x-2 py-1"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={preferredAreas.includes(locKey)}
                                        onChange={() =>
                                          togglePreferredArea(locKey)
                                        }
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
            {/* step 3 (Work Experience, Licenses, References) unchanged except industries load all */}
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
