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
  stage: number;
}

interface CountryEligibility {
  country_id: number;
  stage_id: number;
}

const WHVProfileSetup: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    givenName: "",
    middleName: "",
    familyName: "",
    dateOfBirth: "",
    countryId: null as number | null,
    visaType: "", // we'll use label directly
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: countriesData } = await supabase.from("country").select("*").order("name");
      const { data: stagesData } = await supabase.from("visa_stage").select("*").order("stage");
      const { data: eligibilityData } = await supabase.from("country_eligibility").select("*");

      if (countriesData) setCountries(countriesData as any);
      if (stagesData) setVisaStages(stagesData as any);
      if (eligibilityData) setEligibility(eligibilityData as any);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value });
  };

  // Validation helpers
  const isValidAUPhone = (phone: string) => /^(\+614\d{8}|04\d{8})$/.test(phone);

  const isValidDOB = (dob: string) => {
    if (!dob) return false;
    const date = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 18 && age <= 35; // WHV rule
  };

  const isValidExpiry = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};

    if (!formData.givenName) newErrors.givenName = "Required";
    if (!formData.familyName) newErrors.familyName = "Required";
    if (!formData.countryId) newErrors.nationality = "Required";
    if (!formData.visaType) newErrors.visaType = "Required";
    if (!formData.dateOfBirth || !isValidDOB(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Must be between 18–35 years old";
    }
    if (!formData.visaExpiry || !isValidExpiry(formData.visaExpiry)) {
      newErrors.visaExpiry = "Invalid date format (YYYY-MM-DD)";
    }
    if (!formData.phone || !isValidAUPhone(formData.phone)) {
      newErrors.phone = "Invalid Australian phone number";
    }
    if (!formData.address1) newErrors.address1 = "Required";
    if (!formData.suburb) newErrors.suburb = "Required";
    if (!formData.state) newErrors.state = "Required";
    if (!formData.postcode || formData.postcode.length !== 4) {
      newErrors.postcode = "Must be 4 digits";
    }

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

    const selectedCountry = countries.find(c => c.country_id === formData.countryId);
    
    const { error: whvError } = await supabase.from("whv_maker").upsert(
      {
        user_id: user.id,
        given_name: formData.givenName,
        middle_name: formData.middleName || null,
        family_name: formData.familyName,
        birth_date: formData.dateOfBirth,
        nationality: selectedCountry?.name || "",
        mobile_num: formData.phone,
        address_line1: formData.address1,
        address_line2: formData.address2 || null,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
      } as any,
      { onConflict: "user_id" }
    );

    if (whvError) {
      console.error("Failed to save WHV profile:", whvError);
      alert("Error saving profile. Please try again.");
      return;
    }

    const { error: visaError } = await supabase.from("maker_visa").upsert(
      {
        user_id: user.id,
        visa_type: formData.visaType,
        expiry_date: formData.visaExpiry,
      } as any,
      { onConflict: "user_id,visa_type" }
    );

    if (visaError) {
      console.error("Failed to save Visa:", visaError);
      alert("Error saving visa info. Please try again.");
      return;
    }

    navigate("/whv/work-preferences");
  };

  // Filter stages by country eligibility
  const filteredStages =
    formData.countryId !== null
      ? visaStages.filter((v) =>
          eligibility.some((e) => e.country_id === formData.countryId && e.stage_id === v.stage_id)
        )
      : [];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

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
              {/* Name fields */}
              <div>
                <Label>Given Name *</Label>
                <Input name="givenName" value={formData.givenName} onChange={handleChange} />
                {errors.givenName && <p className="text-red-500">{errors.givenName}</p>}
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>
              <div>
                <Label>Family Name *</Label>
                <Input name="familyName" value={formData.familyName} onChange={handleChange} />
                {errors.familyName && <p className="text-red-500">{errors.familyName}</p>}
              </div>

              {/* Country */}
              <div>
                <Label>Nationality *</Label>
                <Select
                  value={formData.countryId?.toString() || ""}
                  onValueChange={(v) => handleSelect("countryId", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.country_id} value={c.country_id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationality && <p className="text-red-500">{errors.nationality}</p>}
              </div>

              {/* Visa */}
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
                  {errors.visaType && <p className="text-red-500">{errors.visaType}</p>}
                </div>
              )}

              {/* DOB */}
              <div>
                <Label>Date of Birth *</Label>
                <Input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                {errors.dateOfBirth && <p className="text-red-500">{errors.dateOfBirth}</p>}
              </div>

              {/* Visa expiry */}
              <div>
                <Label>Visa Expiry *</Label>
                <Input
                  name="visaExpiry"
                  type="date"
                  value={formData.visaExpiry}
                  onChange={handleChange}
                />
                {errors.visaExpiry && <p className="text-red-500">{errors.visaExpiry}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label>Phone *</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="04xxxxxxxx or +614xxxxxxxx"
                />
                {errors.phone && <p className="text-red-500">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div>
                <Label>Address Line 1 *</Label>
                <Input name="address1" value={formData.address1} onChange={handleChange} />
                {errors.address1 && <p className="text-red-500">{errors.address1}</p>}
              </div>
              <div>
                <Label>Address Line 2</Label>
                <Input name="address2" value={formData.address2} onChange={handleChange} />
              </div>
              <div>
                <Label>Suburb *</Label>
                <Input name="suburb" value={formData.suburb} onChange={handleChange} />
                {errors.suburb && <p className="text-red-500">{errors.suburb}</p>}
              </div>
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
                {errors.state && <p className="text-red-500">{errors.state}</p>}
              </div>
              <div>
                <Label>Postcode *</Label>
                <Input
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  maxLength={4}
                />
                {errors.postcode && <p className="text-red-500">{errors.postcode}</p>}
              </div>

              {/* Continue */}
              <div className="pt-6">
                <Button type="submit" className="w-full h-14 bg-orange-500 text-white rounded-xl">
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





