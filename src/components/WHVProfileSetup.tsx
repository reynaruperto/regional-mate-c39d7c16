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

type CountryLite = { country_id: number; name: string };
type VisaStageLite = { stage_id: number; sub_class: string; stage: number; label: string };

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

const calculateAge = (dob: string) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const WHVProfileSetup: React.FC = () => {
  const navigate = useNavigate();

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

  const [countries, setCountries] = useState<CountryLite[]>([]);
  const [visaStages, setVisaStages] = useState<VisaStageLite[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase.from("country").select("country_id, name").order("name");
      if (data) setCountries(data);
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchVisaStages = async () => {
      if (!formData.countryId) {
        setVisaStages([]);
        return;
      }
      
      const { data, error } = await supabase
        .from("country_eligibility")
        .select(`
          stage_id,
          visa_stage!inner (
            stage_id,
            sub_class,
            stage,
            label
          )
        `)
        .eq("country_id", formData.countryId);

      if (!error && data) {
        const stages = data
          .map((item) => item.visa_stage)
          .filter((stage): stage is VisaStageLite => stage !== null);
        setVisaStages(stages);
      }
    };
    fetchVisaStages();
  }, [formData.countryId]);

  const validateField = (name: string, value: string) => {
    let error = "";

    if (name === "givenName" && !value) error = "Required";
    if (name === "familyName" && !value) error = "Required";

    if (name === "dateOfBirth" && value) {
      const age = calculateAge(value);
      const selectedVisa = visaStages.find((v) => v.stage_id === formData.stageId);
      const subClass = selectedVisa?.sub_class;
      let maxAge = 30;

      if (subClass === "417") {
        const countryName = countries.find((c) => c.country_id === formData.countryId)?.name;
        if (["Canada", "France", "Ireland"].includes(countryName || "")) {
          maxAge = 35;
        }
      }

      if (age < 18 || age > maxAge) {
        error = `Invalid age. Must be 18–${maxAge} for visa ${subClass}`;
      }
    }

    if (name === "phone" && value && !/^(\+614\d{8}|04\d{8})$/.test(value)) {
      error = "Invalid Australian phone number";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleSelect = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value });
    validateField(name, value.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // block submit if any error
    if (Object.values(errors).some((err) => err)) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

    await supabase.from("maker_visa").upsert(
      {
        user_id: user.id,
        visa_type: visaStages.find((v) => v.stage_id === formData.stageId)?.sub_class as any,
        expiry_date: formData.visaExpiry,
      },
      { onConflict: "user_id" }
    );

    navigate("/whv/work-preferences", {
      state: {
        countryId: formData.countryId,
        visaType: visaStages.find((v) => v.stage_id === formData.stageId)?.sub_class,
        stageId: formData.stageId,
      },
    });
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
              {/* Names first */}
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

              {/* Nationality */}
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
              {visaStages.length > 0 && (
                <div>
                  <Label>Visa Type *</Label>
                  <Select
                    value={formData.stageId?.toString() || ""}
                    onValueChange={(v) => handleSelect("stageId", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      {visaStages.map((v) => (
                        <SelectItem key={v.stage_id} value={v.stage_id.toString()}>
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

              {/* Visa Expiry */}
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





