import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import your existing form sections
// For now they’re placeholders — you can split your current form into these 3 components.
const PersonalInfoForm = ({ state, setState }: any) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Visa & Personal Info</h2>
    {/* Example inputs — replace with your actual fields */}
    <p className="text-gray-600 text-sm">Nationality (read-only): {state.nationality}</p>
    <p className="text-gray-600 text-sm">DOB (read-only): {state.dob}</p>
    <input
      value={state.visaExpiryDate}
      onChange={(e) => setState({ ...state, visaExpiryDate: e.target.value })}
      placeholder="Visa Expiry"
      className="border rounded w-full p-2"
    />
    <input
      value={state.phoneNumber}
      onChange={(e) => setState({ ...state, phoneNumber: e.target.value })}
      placeholder="Phone"
      className="border rounded w-full p-2 mt-2"
    />
  </div>
);

const PreferencesForm = ({ state, setState }: any) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Work & Location Preferences</h2>
    <textarea
      value={state.tagline}
      onChange={(e) => setState({ ...state, tagline: e.target.value })}
      placeholder="Tagline"
      className="border rounded w-full p-2"
    />
    {/* Add industries, roles, state, area inputs here */}
  </div>
);

const ExperienceLicensesForm = ({ state, setState }: any) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Work Experience + Licenses & References</h2>
    {/* Map over workExperiences */}
    {state.workExperiences.map((exp: any) => (
      <div key={exp.id} className="border p-2 rounded mb-2">
        <input
          value={exp.company}
          onChange={(e) =>
            setState({
              ...state,
              workExperiences: state.workExperiences.map((w: any) =>
                w.id === exp.id ? { ...w, company: e.target.value } : w
              ),
            })
          }
          placeholder="Company"
          className="border rounded w-full p-2"
        />
      </div>
    ))}
    {/* Licenses + References sections go here */}
  </div>
);

const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Centralized state (later fetch from Supabase)
  const [formState, setFormState] = useState({
    dob: "15/03/1995",
    nationality: "Argentina",
    visaType: "462 (Work and Holiday Visa)",
    visaExpiryDate: "01/01/2026",
    phoneNumber: "0492333444",
    tagline: "Enthusiastic farm worker from Argentina seeking agricultural opportunities",
    workExperiences: [{ id: "1", company: "Farm Co." }],
    licenses: ["RSA"],
    references: [],
  });

  const [step, setStep] = useState(1);

  const handleSave = () => {
    console.log("Saved step", step, formState);
    toast({ title: "Saved", description: `Step ${step} updated.` });
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
            <button
              onClick={() => navigate("/whv/dashboard")}
              className="text-orange-500 font-medium underline"
            >
              Cancel
            </button>
            <h1 className="text-lg font-medium text-gray-900">Edit Profile</h1>
            <button
              onClick={handleSave}
              className="flex items-center text-orange-500 font-medium underline"
            >
              <Check size={16} className="mr-1" /> Save
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {step === 1 && <PersonalInfoForm state={formState} setState={setFormState} />}
            {step === 2 && <PreferencesForm state={formState} setState={setFormState} />}
            {step === 3 && <ExperienceLicensesForm state={formState} setState={setFormState} />}
          </div>

          {/* Footer: Progress + Navigation */}
          <div className="p-4 flex flex-col items-center">
            {/* Progress Dots */}
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

            {/* Navigation */}
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
