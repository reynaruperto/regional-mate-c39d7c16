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
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Country = Database["public"]["Tables"]["country"]["Row"];
type VisaStage = Database["public"]["Tables"]["visa_stage"]["Row"];

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

const todayStr = new Date().toISOString().split("T")[0];

const WHVProfileSetup: React.FC = () => {
  const navigate = useNavigate();

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

  const [countries, setCountries] = useState<Country[]>([]);
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [filteredStages, setFilteredStages] = useState<VisaStage[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ Fetch countries + visa stages
  useEffect(() => {
    const fetchData = async () => {
      const { data: countriesData } = await supabase
        .from("country")
        .select("*")
        .order("name");

      const { data: stagesData } = await supabase
        .from("visa_stage")
        .select("*")
        .order("stage");

      if (countriesData) setCountries(countriesData);
      if (stagesData) setVisaStages(stagesData);
    };
    fetchData();
  }, []);

  // ✅ When nationality changes, load eligible visa stages
  useEffect(() => {
    const fetchEligibility = async () => {
      if (!formData.nationality) {
        setFilteredStages([]);
        return;
      }

      const selectedCountry = countries.find(
        (c) => c.name === formData.nationality
      );
      if (!selectedCountry) return;

      // For now, show all stages since country_eligibility table doesn't exist
      // const { data: eligibleStages, error } = await supabase
      //   .from("country_eligibility")
      //   .select("visa_stage(stage_id,label,sub_class,stage)")
      //   .eq("country_id", selectedCountry.country_id);

      // For demo purposes, filter by country scheme
      const filteredByScheme = visaStages.filter((stage) => {
        if (selectedCountry.scheme === "417") {
          return stage.sub_class === "417";
        } else if (selectedCountry.scheme === "462") {
          return stage.sub_class === "462";
        }
        return true;
      });
      
      setFilteredStages(filteredByScheme);
    };

    fetchEligibility();
  }, [formData.nationality, countries]);

  // ✅ Helpers: Validation
  const validateDOB = (dob: string, visaType: string) => {
    if (!dob) return "Required";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (age < 18) return "Must be at least 18 years old";
    if (visaType.includes("417") && age > 35)
      return "Must be under 36 for subclass 417";
    if (visaType.includes("462") && age > 30)
      return "Must be under 31 for subclass 462";
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "Required";
    if (!/^(\+614\d{8}|04\d{8})$/.test(phone))
      return "Invalid Australian phone number";
    return "";
  };

  const validateExpiry = (expiry: string) => {
    if (!expiry) return "Required";
    const expDate = new Date(expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate < today) return "Expiry date cannot be in the past";
    return "";
  };

  // ✅ Handle changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};

    if (!formData.givenName) newErrors.givenName = "Required";
    if (!formData.familyName) newErrors.familyName = "Required";

    const dobError = validateDOB(formData.dateOfBirth, formData.visaType);
    if (dobError) newErrors.dateOfBirth = dobError;

    if (!formData.nationality) newErrors.nationality = "Required";
    if (!formData.visaType) newErrors.visaType = "Required";

    const expiryError = validateExpiry(formData.visaExpiry);
    if (expiryError) newErrors.visaExpiry = expiryError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (!formData.address1) newErrors.address1 = "Required";
    if (!formData.suburb) newErrors.suburb = "Required";
    if (!formData.state) newErrors.state = "Required";
    if (!formData.postcode) newErrors.postcode = "Required";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("User not logged in — please restart signup flow.");
      return;
    }

    await supabase.from("whv_maker").upsert(
      {
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
      } as any,
      { onConflict: "user_id" }
    );

    const chosenStage = visaStages.find((v) => v.label === formData.visaType);
    await supabase.from("maker_visa").upsert(
      {
        user_id: user.id,
        visa_type: chosenStage?.sub_class || formData.visaType,
        expiry_date: formData.visaExpiry,
      } as any,
      { onConflict: "user_id" }
    );

    navigate("/whv/work-preferences");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 pt-16 pb-6 border-b flex items-center justify-between">
            <button
              onClick={() => navigate("/whv/email-confirmation")}
              className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Account Set Up</h1>
            <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-sm">
              3/6
            </span>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Given Name */}
              <div>
                <Label>Given Name *</Label>
                <Input
                  name="givenName"
                  value={formData.givenName}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, givenName: e.target.value ? "" : "Required" });
                  }}
                />
                {errors.givenName && <p className="text-red-500 text-sm">{errors.givenName}</p>}
              </div>

              {/* Middle Name */}
              <div>
                <Label>Middle Name</Label>
                <Input name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>

              {/* Family Name */}
              <div>
                <Label>Family Name *</Label>
                <Input
                  name="familyName"
                  value={formData.familyName}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, familyName: e.target.value ? "" : "Required" });
                  }}
                />
                {errors.familyName && <p className="text-red-500 text-sm">{errors.familyName}</p>}
              </div>

              {/* Nationality */}
              <div>
                <Label>Nationality *</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(v) => handleSelect("nationality", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.country_id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationality && <p className="text-red-500 text-sm">{errors.nationality}</p>}
              </div>

              {/* Visa Type */}
              {filteredStages.length > 0 && (
                <div>
                  <Label>Visa Type *</Label>
                  <Select
                    value={formData.visaType}
                    onValueChange={(v) => handleSelect("visaType", v)}
                  >
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
                  {errors.visaType && <p className="text-red-500 text-sm">{errors.visaType}</p>}
                </div>
              )}

              {/* Date of Birth */}
              <div>
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({
                      ...errors,
                      dateOfBirth: validateDOB(e.target.value, formData.visaType),
                    });
                  }}
                  max={todayStr}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>}
              </div>

              {/* Visa Expiry */}
              <div>
                <Label>Visa Expiry *</Label>
                <Input
                  type="date"
                  name="visaExpiry"
                  value={formData.visaExpiry}
                  min={todayStr}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, visaExpiry: validateExpiry(e.target.value) });
                  }}
                />
                {errors.visaExpiry && <p className="text-red-500 text-sm">{errors.visaExpiry}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label>Phone *</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  placeholder="04xxxxxxxx or +614xxxxxxxx"
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, phone: validatePhone(e.target.value) });
                  }}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>

              {/* Address Line 1 */}
              <div>
                <Label>Address Line 1 *</Label>
                <Input
                  name="address1"
                  value={formData.address1}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, address1: e.target.value ? "" : "Required" });
                  }}
                />
                {errors.address1 && <p className="text-red-500 text-sm">{errors.address1}</p>}
              </div>

              {/* Address Line 2 */}
              <div>
                <Label>Address Line 2</Label>
                <Input name="address2" value={formData.address2} onChange={handleChange} />
              </div>

              {/* Suburb */}
              <div>
                <Label>Suburb *</Label>
                <Input
                  name="suburb"
                  value={formData.suburb}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, suburb: e.target.value ? "" : "Required" });
                  }}
                />
                {errors.suburb && <p className="text-red-500 text-sm">{errors.suburb}</p>}
              </div>

              {/* State */}
              <div>
                <Label>State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(v) => handleSelect("state", v)}
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
                {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
              </div>

              {/* Postcode */}
              <div>
                <Label>Postcode *</Label>
                <Input
                  name="postcode"
                  maxLength={4}
                  value={formData.postcode}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors({ ...errors, postcode: e.target.value ? "" : "Required" });
                  }}
                />
                {errors.postcode && <p className="text-red-500 text-sm">{errors.postcode}</p>}
              </div>

              {/* Continue */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full h-14 bg-orange-500 text-white rounded-xl"
                >
                  Continue →
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVProfileSetup;





