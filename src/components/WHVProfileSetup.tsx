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
import type { Database } from "@/integrations/supabase/supabase-extensions";

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

const WHVProfileSetup: React.FC = () => {
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const todayMinus18 = new Date(
    new Date().setFullYear(new Date().getFullYear() - 18)
  )
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    givenName: "",
    middleName: "",
    familyName: "",
    dateOfBirth: "",
    countryId: null as number | null,
    stageId: null as number | null,
    visaExpiry: "",
    phone: "",
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredStages, setFilteredStages] = useState<VisaStage[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ Load countries
  useEffect(() => {
    const fetchCountries = async () => {
      const { data: countriesData } = await supabase
        .from("country")
        .select("*")
        .order("name");
      if (countriesData) setCountries(countriesData);
    };
    fetchCountries();
  }, []);

  // ✅ When nationality changes, fetch eligible visa stages
  useEffect(() => {
    const fetchEligibleStages = async () => {
      if (!formData.countryId) return;
      const { data, error } = await supabase
        .from("country_eligibility")
        .select("visa_stage(stage_id, label, sub_class, stage)")
        .eq("country_id", formData.countryId);

      if (error) {
        console.error("Error loading eligibility:", error);
        return;
      }

      if (data) {
        const stages = data.map((e: any) => e.visa_stage);
        setFilteredStages(stages);
      }
    };
    fetchEligibleStages();
  }, [formData.countryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string | number) => {
    if (name === "countryId") {
      setFormData({ ...formData, countryId: value as number, stageId: null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};

    if (!formData.givenName) newErrors.givenName = "Required";
    if (!formData.familyName) newErrors.familyName = "Required";
    if (!formData.countryId) newErrors.nationality = "Required";
    if (!formData.stageId) newErrors.visaType = "Required";

    // ✅ DOB validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const ageDifMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      if (age < 18) {
        newErrors.dateOfBirth = "Must be at least 18 years old";
      } else {
        const chosenStage = filteredStages.find(
          (v) => v.stage_id === formData.stageId
        );
        if (chosenStage?.sub_class === "417" && age > 35) {
          newErrors.dateOfBirth = "Must be under 36 years old for subclass 417";
        }
        if (chosenStage?.sub_class === "462" && age > 30) {
          newErrors.dateOfBirth = "Must be under 31 years old for subclass 462";
        }
      }
    }

    // ✅ Visa expiry validation
    if (!formData.visaExpiry) {
      newErrors.visaExpiry = "Required";
    } else {
      const expiry = new Date(formData.visaExpiry);
      if (expiry < today) {
        newErrors.visaExpiry = "Expiry date cannot be in the past";
      }
    }

    // ✅ Phone
    if (!formData.phone) {
      newErrors.phone = "Required";
    } else if (!/^(\+614\d{8}|04\d{8})$/.test(formData.phone)) {
      newErrors.phone = "Invalid Australian phone number";
    }

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

    // ✅ Save WHV maker profile
    await supabase.from("whv_maker").upsert(
      {
        user_id: user.id,
        given_name: formData.givenName,
        middle_name: formData.middleName || null,
        family_name: formData.familyName,
        birth_date: formData.dateOfBirth,
        country_id: formData.countryId,
        mobile_num: formData.phone,
        address_line1: formData.address1,
        address_line2: formData.address2 || null,
        suburb: formData.suburb,
        state: formData.state as any,
        postcode: formData.postcode,
      } as any,
      { onConflict: "user_id" }
    );

    // ✅ Save visa
    await supabase.from("maker_visa").upsert(
      {
        user_id: user.id,
        stage_id: formData.stageId,
        expiry_date: formData.visaExpiry,
      } as any,
      { onConflict: "user_id,stage_id" }
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
            <h1 className="text-lg font-semibold text-gray-900">
              Account Set Up
            </h1>
            <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-sm">
              3/6
            </span>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Given Name */}
              <div>
                <Label>
                  Given Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="givenName"
                  value={formData.givenName}
                  onChange={handleChange}
                />
                {errors.givenName && (
                  <p className="text-red-500">{errors.givenName}</p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <Label>Middle Name</Label>
                <Input
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              {/* Family Name */}
              <div>
                <Label>
                  Family Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="familyName"
                  value={formData.familyName}
                  onChange={handleChange}
                />
                {errors.familyName && (
                  <p className="text-red-500">{errors.familyName}</p>
                )}
              </div>

              {/* Nationality */}
              <div>
                <Label>
                  Nationality <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.countryId?.toString() || ""}
                  onValueChange={(v) =>
                    handleSelect("countryId", parseInt(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem
                        key={c.country_id}
                        value={c.country_id.toString()}
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationality && (
                  <p className="text-red-500">{errors.nationality}</p>
                )}
              </div>

              {/* Visa Type */}
              {filteredStages.length > 0 && (
                <div>
                  <Label>
                    Visa Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.stageId?.toString() || ""}
                    onValueChange={(v) =>
                      handleSelect("stageId", parseInt(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStages.map((v) => (
                        <SelectItem
                          key={v.stage_id}
                          value={v.stage_id.toString()}
                        >
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.visaType && (
                    <p className="text-red-500">{errors.visaType}</p>
                  )}
                </div>
              )}

              {/* DOB */}
              <div>
                <Label>
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={todayMinus18}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Visa Expiry */}
              <div>
                <Label>
                  Visa Expiry <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="visaExpiry"
                  type="date"
                  value={formData.visaExpiry}
                  onChange={handleChange}
                  min={todayStr}
                />
                {errors.visaExpiry && (
                  <p className="text-red-500">{errors.visaExpiry}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label>
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="04xxxxxxxx or +614xxxxxxxx"
                />
                {errors.phone && (
                  <p className="text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <Label>
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                />
                {errors.address1 && (
                  <p className="text-red-500">{errors.address1}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <Label>Address Line 2</Label>
                <Input
                  name="address2"
                  value={formData.address2}
                  onChange={handleChange}
                />
              </div>

              {/* Suburb */}
              <div>
                <Label>
                  Suburb <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="suburb"
                  value={formData.suburb}
                  onChange={handleChange}
                />
                {errors.suburb && (
                  <p className="text-red-500">{errors.suburb}</p>
                )}
              </div>

              {/* State */}
              <div>
                <Label>
                  State <span className="text-red-500">*</span>
                </Label>
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
                {errors.state && (
                  <p className="text-red-500">{errors.state}</p>
                )}
              </div>

              {/* Postcode */}
              <div>
                <Label>
                  Postcode <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  maxLength={4}
                />
                {errors.postcode && (
                  <p className="text-red-500">{errors.postcode}</p>
                )}
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






