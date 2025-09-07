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
import type { User, Session } from "@supabase/supabase-js";

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
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ Set up authentication state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Redirect to login if not authenticated
        if (!session?.user) {
          navigate("/whv/login");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (!session?.user) {
        navigate("/whv/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ✅ Load countries & visa stages from Supabase
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};

    // ✅ Validation
    if (!formData.givenName) newErrors.givenName = "Required";
    if (!formData.familyName) newErrors.familyName = "Required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Required";
    if (!formData.nationality) newErrors.nationality = "Required";
    if (!formData.visaType) newErrors.visaType = "Required";
    if (!formData.visaExpiry) newErrors.visaExpiry = "Required";
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

    // ✅ Check if user is authenticated
    if (!user || !session) {
      console.error("User not authenticated");
      navigate("/whv/login");
      return;
    }

    // ✅ Save profile to whv_maker
    const { error: whvError } = await (supabase.from("whv_maker") as any).upsert(
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
        state: formData.state,
        postcode: formData.postcode,
      },
      { onConflict: "user_id" }
    );
    if (whvError) {
      console.error("Failed to save WHV profile:", whvError);
      alert("Error saving profile. Please try again.");
      return;
    }

    // ✅ Save visa to maker_visa
    const chosenStage = visaStages.find((v) => v.label === formData.visaType);
    const { error: visaError } = await (supabase.from("maker_visa") as any).upsert(
      {
        user_id: user.id,
        visa_type: chosenStage?.label || formData.visaType,
        expiry_date: formData.visaExpiry,
      },
      { onConflict: "user_id,visa_type" }
    );
    if (whvError) {
  console.error("❌ WHV insert error:", whvError);
  alert(`Error saving profile: ${whvError.message}`);
  return;
}


    navigate("/whv/work-preferences");
  };

  // ✅ Filter visa stages by nationality’s scheme
  const selectedCountry = countries.find((c) => c.name === formData.nationality);
  const filteredStages = selectedCountry
    ? visaStages.filter((v) => v.sub_class === selectedCountry.scheme)
    : [];

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Dynamic Island */}
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
              {/* Given Name */}
              <div>
                <Label>
                  Given Name <span className="text-red-500">*</span>
                </Label>
                <Input name="givenName" value={formData.givenName} onChange={handleChange} />
                {errors.givenName && <p className="text-red-500">{errors.givenName}</p>}
              </div>

              {/* Middle Name */}
              <div>
                <Label>Middle Name</Label>
                <Input name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>

              {/* Family Name */}
              <div>
                <Label>
                  Family Name <span className="text-red-500">*</span>
                </Label>
                <Input name="familyName" value={formData.familyName} onChange={handleChange} />
                {errors.familyName && <p className="text-red-500">{errors.familyName}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <Label>
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="dateOfBirth"
                  type="date" // 👈 now calendar picker
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                {errors.dateOfBirth && <p className="text-red-500">{errors.dateOfBirth}</p>}
              </div>

              {/* Nationality */}
              <div>
                <Label>
                  Nationality <span className="text-red-500">*</span>
                </Label>
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
                {errors.nationality && <p className="text-red-500">{errors.nationality}</p>}
              </div>

              {/* Visa Type */}
              {filteredStages.length > 0 && (
                <div>
                  <Label>
                    Visa Type <span className="text-red-500">*</span>
                  </Label>
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

              {/* Visa Expiry */}
              <div>
                <Label>
                  Visa Expiry <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="visaExpiry"
                  type="date" // 👈 now calendar picker
                  value={formData.visaExpiry}
                  onChange={handleChange}
                />
                {errors.visaExpiry && <p className="text-red-500">{errors.visaExpiry}</p>}
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
                {errors.phone && <p className="text-red-500">{errors.phone}</p>}
              </div>

              {/* Address Line 1 */}
              <div>
                <Label>
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input name="address1" value={formData.address1} onChange={handleChange} />
                {errors.address1 && <p className="text-red-500">{errors.address1}</p>}
              </div>

              {/* Address Line 2 */}
              <div>
                <Label>Address Line 2</Label>
                <Input name="address2" value={formData.address2} onChange={handleChange} />
              </div>

              {/* Suburb */}
              <div>
                <Label>
                  Suburb <span className="text-red-500">*</span>
                </Label>
                <Input name="suburb" value={formData.suburb} onChange={handleChange} />
                {errors.suburb && <p className="text-red-500">{errors.suburb}</p>}
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
                {errors.state && <p className="text-red-500">{errors.state}</p>}
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
                {errors.postcode && <p className="text-red-500">{errors.postcode}</p>}
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





