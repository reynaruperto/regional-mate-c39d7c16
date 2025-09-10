import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ✅ Eligible countries
const countries417 = [
  "Belgium","Canada","Republic of Cyprus","Denmark","Estonia","Finland","France","Germany","Hong Kong","Ireland",
  "Italy","Japan","Republic of Korea","Malta","Netherlands","Norway","Sweden","Taiwan","United Kingdom",
];
const countries462 = [
  "Argentina","Austria","Brazil","Chile","China","Czech Republic","Ecuador","Greece","Hungary","India","Indonesia",
  "Israel","Luxembourg","Malaysia","Mongolia","Papua New Guinea","Peru","Poland","Portugal","San Marino","Singapore",
  "Slovak Republic","Slovenia","Spain","Switzerland","Thailand","Türkiye","United States of America","Uruguay","Vietnam",
];

const getVisaOptions = (nationality: string) => {
  if (countries417.includes(nationality)) {
    return ["417 (Working Holiday Visa)", "417 Second Year Extension", "417 Third Year Extension"];
  }
  if (countries462.includes(nationality)) {
    return ["462 (Work and Holiday Visa)", "462 Second Year Extension", "462 Third Year Extension"];
  }
  return [];
};

// ✅ WHV industries
const industries = [
  "Plant & Animal Cultivation",
  "Fishing & Pearling",
  "Tree Farming & Forestry",
  "Mining",
  "Construction",
  "Bushfire Recovery",
  "Tourism & Hospitality",
  "Aged & Disability Care",
  "Childcare",
  "Health",
];

// ✅ Roles by industry
const industryRoles: Record<string, string[]> = {
  "Plant & Animal Cultivation": [
    "Fruit Picker","Farm Hand","Packer","Crop Harvester","Irrigation Worker",
  ],
  "Fishing & Pearling": ["Deckhand","Aquaculture Worker","Diver"],
  "Tree Farming & Forestry": ["Tree Planter","Chainsaw Operator","Forest Worker"],
  Mining: ["Driller","Truck Operator","Plant Operator","Trades Assistant"],
  Construction: ["Construction Labourer","Carpenter","Plumber","Electrician","Painter"],
  "Bushfire Recovery": ["Rebuilding fences","Demolition","Land clearing","Wildlife care","Construction repairs"],
  "Tourism & Hospitality": ["Bartender","Waitstaff","Chef / Cook","Housekeeper","Tour Guide"],
  "Aged & Disability Care": ["Personal Care Worker","Support Worker","Nurse Assistant"],
  Childcare: ["Daycare Staff","Nanny/Au Pair","Out-of-School Care"],
  Health: ["Nurse","Doctor","Hospital Cleaner","Allied Health Assistant"],
};

// ✅ Licenses
const licenseOptions = [
  "Driver's License",
  "Forklift License",
  "White Card (Construction)",
  "RSA (Responsible Service of Alcohol)",
  "First Aid Certificate",
  "Heavy Vehicle License",
  "Other",
];

const australianStates = [
  "Australian Capital Territory","New South Wales","Northern Territory","Queensland",
  "South Australia","Tasmania","Victoria","Western Australia",
];

// Interfaces
interface WorkExperience {
  id: string;
  industry: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
}
interface JobReference {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  role: string;
}

const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Personal info
  const [dob, setDob] = useState("15/03/1995");
  const [nationality, setNationality] = useState("Argentina");
  const [visaType, setVisaType] = useState("462 (Work and Holiday Visa)");
  const [visaExpiryDate, setVisaExpiryDate] = useState("01/01/2026");
  const [phoneNumber, setPhoneNumber] = useState("0492333444");

  // Address
  const [address, setAddress] = useState({
    addressLine1: "22 Valley St.",
    addressLine2: "",
    suburb: "Spring Hill",
    city: "Brisbane",
    state: "Queensland",
    postCode: "4000",
  });

  // Work preferences
  const [tagline, setTagline] = useState(
    "Enthusiastic farm worker from Argentina seeking agricultural opportunities"
  );
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(["Plant & Animal Cultivation"]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Fruit Picker"]);
  const [preferredState, setPreferredState] = useState("Queensland");
  const [preferredCity, setPreferredCity] = useState("Brisbane");

  // Licenses
  const [licenses, setLicenses] = useState<string[]>(["RSA (Responsible Service of Alcohol)"]);
  const [otherLicense, setOtherLicense] = useState("");

  // Work experiences & references
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [jobReferences, setJobReferences] = useState<JobReference[]>([]);

  // Handlers
  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== industry));
      setSelectedRoles(selectedRoles.filter((r) => !industryRoles[industry]?.includes(r)));
    } else if (selectedIndustries.length < 3) {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };
  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };
  const toggleLicense = (license: string) => {
    setLicenses(
      licenses.includes(license)
        ? licenses.filter((l) => l !== license)
        : [...licenses, license]
    );
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      { id: Date.now().toString(), industry: "", position: "", company: "", location: "", startDate: "", endDate: "" },
    ]);
  };
  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string) => {
    setWorkExperiences(workExperiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };
  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
  };

  const addJobReference = () => {
    setJobReferences([
      ...jobReferences,
      { id: Date.now().toString(), name: "", businessName: "", email: "", phone: "", role: "" },
    ]);
  };
  const updateJobReference = (id: string, field: keyof JobReference, value: string) => {
    setJobReferences(jobReferences.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };
  const removeJobReference = (id: string) => {
    setJobReferences(jobReferences.filter((ref) => ref.id !== id));
  };

  const handleSave = () => {
    console.log("Profile data saved:", {
      dob,nationality,visaType,visaExpiryDate,phoneNumber,address,
      tagline,selectedIndustries,selectedRoles,preferredState,preferredCity,
      licenses,otherLicense,workExperiences,jobReferences,
    });
    toast({ title: "Profile Updated", description: "Your WHV profile has been successfully updated" });
    navigate("/whv/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* iPhone Frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b flex-shrink-0 flex justify-between items-center">
            <button onClick={() => navigate("/whv/dashboard")} className="text-orange-500 font-medium underline">
              Cancel
            </button>
            <h1 className="text-lg font-medium text-gray-900">Edit Profile</h1>
            <button onClick={handleSave} className="flex items-center text-orange-500 font-medium underline">
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <Input value={dob} onChange={(e) => setDob(e.target.value)} placeholder="DD/MM/YYYY" />
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...countries417, ...countries462].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visaType} onValueChange={setVisaType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getVisaOptions(nationality).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={visaExpiryDate} onChange={(e) => setVisaExpiryDate(e.target.value)} placeholder="DD/MM/YYYY" />
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="04xxxxxxxx" />
              <Input value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} placeholder="Address Line 1" />
              <Input value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} placeholder="Address Line 2" />
              <Input value={address.suburb} onChange={(e) => setAddress({ ...address, suburb: e.target.value })} placeholder="Suburb" />
              <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
              <Select value={address.state} onValueChange={(value) => setAddress({ ...address, state: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {australianStates.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={address.postCode} onChange={(e) => setAddress({ ...address, postCode: e.target.value })} placeholder="Postcode" />
            </div>

            {/* Work Preferences */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Work Preferences</h2>
              <Textarea value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={60} />
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      selectedIndustries.includes(ind) ? "bg-orange-500 text-white" : "bg-gray-100"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedIndustries.flatMap((i) => industryRoles[i]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-2.5 py-1 text-xs rounded-full border ${
                      selectedRoles.includes(role) ? "bg-orange-500 text-white" : "bg-gray-100"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <Select value={preferredState} onValueChange={setPreferredState}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {australianStates.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={preferredCity} onChange={(e) => setPreferredCity(e.target.value)} placeholder="City/Suburb" />
            </div>

            {/* Licenses */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Licenses & Tickets</h2>
              {licenseOptions.map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <input type="checkbox" checked={licenses.includes(l)} onChange={() => toggleLicense(l)} />
                  <span>{l}</span>
                </div>
              ))}
              {licenses.includes("Other") && (
                <Input value={otherLicense} onChange={(e) => setOtherLicense(e.target.value)} placeholder="Other license" />
              )}
            </div>

            {/* Work Experience */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                <Button type="button" onClick={addWorkExperience} className="bg-orange-500 text-white">
                  <Plus size={16} className="mr-1" /> Add
                </Button>
              </div>
              {workExperiences.map((exp, i) => (
                <div key={exp.id} className="border p-3 rounded-lg space-y-2">
                  <Input value={exp.industry} onChange={(e) => updateWorkExperience(exp.id, "industry", e.target.value)} placeholder="Industry" />
                  <Input value={exp.position} onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)} placeholder="Position" />
                  <Input value={exp.company} onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)} placeholder="Company" />
                  <Input value={exp.location} onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)} placeholder="Location" />
                  <div className="flex gap-2">
                    <Input value={exp.startDate} onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)} placeholder="Start MM/YYYY" />
                    <Input value={exp.endDate} onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)} placeholder="End MM/YYYY" />
                  </div>
                  <Button type="button" onClick={() => removeWorkExperience(exp.id)} variant="ghost" className="text-red-500">
                    <X size={16} /> Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Job References */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Job References</h2>
                <Button type="button" onClick={addJobReference} className="bg-orange-500 text-white">
                  <Plus size={16} className="mr-1" /> Add
                </Button>
              </div>
              {jobReferences.map((ref) => (
                <div key={ref.id} className="border p-3 rounded-lg space-y-2">
                  <Input value={ref.name} onChange={(e) => updateJobReference(ref.id, "name", e.target.value)} placeholder="Name" />
                  <Input value={ref.businessName} onChange={(e) => updateJobReference(ref.id, "businessName", e.target.value)} placeholder="Business Name" />
                  <Input value={ref.email} onChange={(e) => updateJobReference(ref.id, "email", e.target.value)} placeholder="Email" />
                  <Input value={ref.phone} onChange={(e) => updateJobReference(ref.id, "phone", e.target.value)} placeholder="Phone" />
                  <Input value={ref.role} onChange={(e) => updateJobReference(ref.id, "role", e.target.value)} placeholder="Role" />
                  <Button type="button" onClick={() => removeJobReference(ref.id)} variant="ghost" className="text-red-500">
                    <X size={16} /> Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Preview Match Card */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Preview Match Card</h2>
              <p className="text-sm text-gray-600">See how your profile looks to employers</p>
              <Button 
                type="button" 
                onClick={() => navigate("/whv/match-card")} 
                className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white"
              >
                VIEW
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEditProfile;
