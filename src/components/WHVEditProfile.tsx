// src/components/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { Database } from "@/types/supabase";
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

const ALL_STATES = [
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

interface RegionRow {
  rule_id: number;
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

// Custom small types for heavy queries
interface EligibilityRow {
  industry_id: number;
  industry: string;
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
  const [regions, setRegions] = useState<RegionRow[]>([]);
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
  const [availableFrom, setAvailableFrom] = useState("");

  // Step 3: Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [licenses, setLicenses] = useState<number[]>([]);
  const [otherLicense, setOtherLicense] = useState("");

  const [allIndustries, setAllIndustries] = useState<Industry[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  // ============= Load Data =============
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Lookups
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

      // All industries/roles
      const [indRes, roleRes] = await Promise.all([
        supabase.from("industry").select("industry_id, name"),
        supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id"),
      ]);
      if (indRes.data) {
        setAllIndustries(
          indRes.data.map((i) => ({ id: i.industry_id, name: i.name }))
        );
      }
      if (roleRes.data) {
        setAllRoles(
          roleRes.data.map((r) => ({
            id: r.industry_role_id,
            name: r.role,
            industryId: r.industry_id,
          }))
        );
      }

      // Maker profile
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

      // Visa + eligibility
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

        // ✅ Eligible industries (cast to light interface)
        const { data: eligibleIndustries, error: eligibilityError } =
          (await supabase
            .from("vw_eligibility_visa_country_stage_industry" as any)
            .select("industry_id, industry")) as unknown as {
            data: EligibilityRow[] | null;
            error: any;
          };
        if (eligibilityError) {
          console.error("Eligibility query error:", eligibilityError);
        }

        if (eligibleIndustries?.length) {
          setIndustries(
            eligibleIndustries.map((i: any) => ({
              id: i.industry_id,
              name: i.industry,
            }))
          );

          const industryIds = eligibleIndustries.map((i: any) => i.industry_id);

          // Roles
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

          // ✅ Regions - Auto-pagination, cast to RegionRow
          let allRegions: RegionRow[] = [];
          let page = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data: regionPage, error: regionError } =
              (await supabase
                .from("visa_work_location_rules" as any)
                .select("rule_id, industry_id, state, suburb_city, postcode")
                .in("industry_id", industryIds.map(Number))
                .range(page * pageSize, (page + 1) * pageSize - 1)) as unknown as {
                data: RegionRow[] | null;
                error: any;
              };

            if (regionError) {
              console.error("Region query error:", regionError);
              break;
            }

            if (regionPage && regionPage.length > 0) {
              allRegions = [...allRegions, ...regionPage];
              page++;
            } else {
              hasMore = false;
            }
          }

          setRegions(allRegions);
        }
      }

      // ✅ Preferred availability
      const { data: availability } =
        (await supabase
          .from("maker_pref_availability" as any)
          .select("available_from")
          .eq("user_id", user.id)
          .maybeSingle()) as unknown as {
          data: { available_from: string } | null;
        };

      if (availability) setAvailableFrom(availability.available_from);

      // Preferences
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

      // ---------- Work experience (prefill) ----------
      const { data: exp } = await supabase
        .from("maker_work_experience" as any)
        .select(
          "work_experience_id, industry_id, position, company, location, start_date, end_date, job_description"
        )
        .eq("user_id", user.id);

      if (exp) {
        setWorkExperiences(
          exp.map((e: any) => {
            const foundRole =
              roleRes?.data?.find(
                (r) =>
                  r.role?.toLowerCase() === (e.position || "").toLowerCase() &&
                  r.industry_id === e.industry_id
              ) || null;

            return {
              id: String(e.work_experience_id),
              industryId: e.industry_id,
              roleId: foundRole ? foundRole.industry_role_id : null,
              company: e.company || "",
              location: e.location || "",
              startDate: e.start_date || "",
              endDate: e.end_date || "",
              description: e.job_description || "",
            };
          })
        );
      }

      // ---------- References ----------
      const { data: refs } = await supabase
        .from("maker_reference")
        .select("*")
        .eq("user_id", user.id);

      if (refs) {
        setJobReferences(
          refs.map((r) => ({
            id: String(r.reference_id),
            name: r.name ?? "",
            businessName: r.business_name ?? "",
            email: r.email ?? "",
            phone: r.mobile_num ?? "",
            role: r.role ?? "",
          }))
        );
      }

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

      setLoading(false);
    };

    loadData();
  }, []);

  // ============= Handlers =============
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleIndustrySelect = (industryId: number) => {
    if (selectedIndustries.includes(industryId)) {
      setSelectedIndustries([]);
      setSelectedRoles([]);
    } else {
      setSelectedIndustries([industryId]);
      setSelectedRoles([]);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(
      selectedRoles.includes(roleId)
        ? selectedRoles.filter((r) => r !== roleId)
        : [...selectedRoles, roleId]
    );
  };

  const togglePreferredState = (state: string) => {
    if (state !== "Queensland") {
      setShowPopup(true);
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
    const selectedIndustryId = selectedIndustries[0];
    const filtered = regions.filter(
      (r) =>
        r.state === state && Number(r.industry_id) === Number(selectedIndustryId)
    );
    return filtered.map((r) => `${r.suburb_city}::${r.postcode}`);
  };

  // ============= Save handlers =============
  const saveAllData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Personal info
      const selectedStage = visaStages.find((v) => v.label === visaType);

      await supabase
        .from("whv_maker")
        .update({
          nationality: nationality as Database["public"]["Enums"]["nationality"],
          birth_date: dob,
          mobile_num: phone,
          address_line1: address.address1,
          address_line2: address.address2 || null,
          suburb: address.suburb,
          state: address.state as Database["public"]["Enums"]["state"],
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
            dob,
            expiry_date: visaExpiry,
          },
          { onConflict: "user_id" }
        );
      }

      // Preferences
      await supabase.from("maker_pref_industry").delete().eq("user_id", user.id);
      await supabase
        .from("maker_pref_industry_role")
        .delete()
        .eq("user_id", user.id);
      await supabase.from("maker_pref_location").delete().eq("user_id", user.id);
      await supabase.from("maker_pref_availability").delete().eq("user_id", user.id);

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
        const rows = preferredAreas.map((locKey) => {
          const [suburb_city, postcode] = locKey.split("::");
          return {
            user_id: user.id,
            state: "Queensland",
            suburb_city,
            postcode,
          };
        });
        await supabase.from("maker_pref_location").insert(rows);
      }

      if (availableFrom) {
        await supabase.from("maker_pref_availability").insert([
          { user_id: user.id, available_from: availableFrom },
        ]);
      }

      // ✅ Work experiences
      await supabase.from("maker_work_experience").delete().eq("user_id", user.id);

      const validExperiences = workExperiences.filter(
        (exp) =>
          exp.company.trim() &&
          exp.industryId !== null &&
          exp.roleId !== null &&
          exp.startDate &&
          exp.endDate
      );

      if (validExperiences.length > 0) {
        const workRows = validExperiences.map((exp) => {
          const roleName = allRoles.find((r) => r.id === exp.roleId)?.name || "";
          return {
            user_id: user.id,
            company: exp.company.trim(),
            industry_id: exp.industryId!,
            position: roleName,
            start_date: exp.startDate,
            end_date: exp.endDate,
            location: exp.location || null,
            job_description: exp.description || null,
          };
        });

        const { error } = await supabase.from("maker_work_experience").insert(workRows);
        if (error) console.error("❌ Work experience insert failed:", error);
      }

      // References
      await supabase.from("maker_reference").delete().eq("user_id", user.id);

      if (jobReferences.length > 0) {
        const refRows = jobReferences.map((ref) => ({
          user_id: user.id,
          name: ref.name?.trim() || null,
          business_name: ref.businessName?.trim() || null,
          email: ref.email?.trim() || null,
          mobile_num: ref.phone?.trim() || null,
          role: ref.role?.trim() || null,
        }));
        await supabase.from("maker_reference").insert(refRows);
      }

      // Licenses
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
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col relative">
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
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                {/* ... unchanged Personal Info UI ... */}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                {/* ... industries & roles UI ... */}

                {/* Preferred Locations */}
                <div className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleSection("states")}
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
                      {/* ... state + area UI ... */}
                    </div>
                  )}
                </div>

                {/* ✅ Available From */}
                <div className="border rounded-lg p-4">
                  <Label>Available From *</Label>
                  <Input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-10 pb-20">
                {/* ... Work Experience, Licenses, References UI ... */}
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

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Notice</h2>
            <p className="text-sm text-gray-700 mb-6">
              Only Queensland is available for work preferences at this time.
            </p>
            <Button
              onClick={() => setShowPopup(false)}
              className="bg-orange-500 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WHVEditProfile;
