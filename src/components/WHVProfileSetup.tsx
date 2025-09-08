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
  label: string;        // e.g. "417 (First Working Holiday Visa)"
  sub_class: string;    // "417", "462", or others
  stage: number | null; // WHV = 1/2/3, other visas = null
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
    const birthYear = date.getFullYear();
    
    if (birthYear < 1000 || birthYear > 9999) return false;
    
    const age = now.getFullYear() - birthYear;
    const monthDiff = now.getMonth() - date.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate()) ? age - 1 : age;
    
    return actualAge >= 18 && actualAge <= 35;
  };

  const isValidExpiry = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate > today;
  };

  const getVisaEnumValue = (selectedStage: VisaStage): string => {
    if (selectedStage.sub_class === "417" || selectedStage.sub_class === "462") {
      const stageText =
        selectedStage.stage === 1
          ? "First"
          : selectedStage.stage === 2
          ? "Second"
          : "Third";
      return selectedStage.sub_class === "417"
        ? `${stageText} Working Holiday Visa (417)`
        : `${stageText} Work and Holiday Visa (462)`;
    }
    return selectedStage.label;
  };

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
      newErrors.visaExpiry = "Must be a future date";
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
    const selectedStage = visaStages.find(v => v.label === formData.visaType);

    if (!selectedStage) {
      alert("Invalid visa type selected");
      return;
    }

    // Check eligibility
    const validEligibility = eligibility.find(
      e => e.country_id === formData.countryId && e.stage_id === selectedStage.stage_id
    );
    if (!validEligibility) {
      alert("Selected visa type is not eligible for your country");
      return;
    }

    const mappedVisaType = getVisaEnumValue(selectedStage);

    // Save WHV profile
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
      alert("Error saving profile");
      return;
    }

    // Save visa details (with sub_class)
    const { error: visaError } = await supabase.from("maker_visa").upsert(
      {
        user_id: user.id,
        country_id: formData.countryId,
        stage_id: selectedStage.stage_id,
        sub_class: selectedStage.sub_class,   // ✅ now saving subclass
        dob: formData.dateOfBirth,
        expiry_date: formData.visaExpiry,
      } as any,
      { onConflict: "user_id" }
    );

    if (visaError) {
      alert(`Error saving visa info: ${visaError.message}`);
      return;
    }

    navigate("/whv/work-preferences");
  };

  const filteredStages =
    formData.countryId !== null
      ? visaStages.filter((v) =>
          eligibility.some((e) => e.country_id === formData.countryId && e.stage_id === v.stage_id)
        )
      : [];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
          
          {/* Header with back button */}
          <div className="flex items-center justify-between px-6 pt-16 pb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-12 h-12 bg-white rounded-2xl shadow-sm"
              onClick={() => navigate('/whv/about-you')}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
          </div>

          {/* Main content */}
          <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(100%-120px)]">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Complete Your Profile
                </h1>
                <p className="text-gray-600">
                  Help us set up your Working Holiday profile
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="givenName">Given Name *</Label>
                    <Input
                      id="givenName"
                      name="givenName"
                      value={formData.givenName}
                      onChange={handleChange}
                      className="h-12 rounded-2xl"
                      placeholder="First name"
                    />
                    {errors.givenName && <p className="text-red-500 text-sm mt-1">{errors.givenName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="familyName">Family Name *</Label>
                    <Input
                      id="familyName"
                      name="familyName"
                      value={formData.familyName}
                      onChange={handleChange}
                      className="h-12 rounded-2xl"
                      placeholder="Last name"
                    />
                    {errors.familyName && <p className="text-red-500 text-sm mt-1">{errors.familyName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="h-12 rounded-2xl"
                    placeholder="Middle name (optional)"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="h-12 rounded-2xl"
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>

                {/* Nationality */}
                <div>
                  <Label>Nationality *</Label>
                  <Select onValueChange={(value) => handleSelect("countryId", parseInt(value))}>
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.country_id} value={country.country_id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.nationality && <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>}
                </div>

                {/* Visa Type */}
                <div>
                  <Label>Visa Type *</Label>
                  <Select 
                    onValueChange={(value) => handleSelect("visaType", value)}
                    disabled={!formData.countryId}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStages.map((stage) => (
                        <SelectItem key={stage.stage_id} value={stage.label}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.visaType && <p className="text-red-500 text-sm mt-1">{errors.visaType}</p>}
                </div>

                {/* Visa Expiry */}
                <div>
                  <Label htmlFor="visaExpiry">Visa Expiry Date *</Label>
                  <Input
                    id="visaExpiry"
                    name="visaExpiry"
                    type="date"
                    value={formData.visaExpiry}
                    onChange={handleChange}
                    className="h-12 rounded-2xl"
                  />
                  {errors.visaExpiry && <p className="text-red-500 text-sm mt-1">{errors.visaExpiry}</p>}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-12 rounded-2xl"
                    placeholder="04xxxxxxxx or +614xxxxxxxx"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                {/* Address Fields */}
                <div>
                  <Label htmlFor="address1">Address Line 1 *</Label>
                  <Input
                    id="address1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    className="h-12 rounded-2xl"
                    placeholder="Street address"
                  />
                  {errors.address1 && <p className="text-red-500 text-sm mt-1">{errors.address1}</p>}
                </div>

                <div>
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    className="h-12 rounded-2xl"
                    placeholder="Apartment, unit, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="suburb">Suburb *</Label>
                    <Input
                      id="suburb"
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleChange}
                      className="h-12 rounded-2xl"
                      placeholder="Suburb"
                    />
                    {errors.suburb && <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>}
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      className="h-12 rounded-2xl"
                      placeholder="0000"
                      maxLength={4}
                    />
                    {errors.postcode && <p className="text-red-500 text-sm mt-1">{errors.postcode}</p>}
                  </div>
                </div>

                <div>
                  <Label>State *</Label>
                  <Select onValueChange={(value) => handleSelect("state", value)}>
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {australianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit"
                    className="w-full h-14 text-base rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    Continue to Work Preferences
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVProfileSetup;





