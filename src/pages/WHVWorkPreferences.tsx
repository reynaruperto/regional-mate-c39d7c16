import React from "react";
import WorkPreferences from "@/components/WHVWorkPreferences";

export default function WHVWorkPreferencesPage() {
  // Example: defaults for testing — you can replace with logic from previous steps
  const visaType: "417" | "462" = "417";
  const visaStage: 1 | 2 | 3 = 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Working Holiday Visa Work Preferences</h1>
      <p className="mb-4 text-gray-600">
        Select your industry, state, area, and postcode to check eligibility for visa extensions.
      </p>

      {/* ✅ Pass props into component */}
      <WorkPreferences visaType={visaType} visaStage={visaStage} />
    </div>
  );
}
