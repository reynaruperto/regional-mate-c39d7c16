
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/supabase-extensions";

type VisaRule = Database["public"]["Tables"]["visa_rules"]["Row"];

interface WorkPreferencesProps {
  visaType: string;
  visaStage: string;
}

const WHVWorkPreferences: React.FC<WorkPreferencesProps> = ({ visaType, visaStage }) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase
        .from("visa_rules")
        .select("industry_name, state, area, postcode_range")
        .eq("visa_type", visaType)
        .eq("visa_stage", visaStage);

      if (!error && data) {
        setIndustries([...new Set(data.map((r: VisaRule) => r.industry_name))]);
        setStates([...new Set(data.map((r: VisaRule) => r.state))]);
        setAreas([...new Set(data.map((r: VisaRule) => r.area))]);
      }
    };
    fetchOptions();
  }, [visaType, visaStage]);

  const checkEligibility = () => {
    console.log({
      industries,
      states,
      areas,
      postcode,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* iPhone 16 Pro Max frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] shadow-2xl flex items-center justify-center">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-white">
            <h1 className="text-lg font-bold">Work Preferences</h1>
            <p className="text-sm text-gray-500">
              Select your industry, state, area, and postcode to check eligibility for visa extensions.
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Industry */}
            <div>
              <Label>Industry</Label>
              <Select>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div>
              <Label>State</Label>
              <Select>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div>
              <Label>Area</Label>
              <Select>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((ar) => (
                    <SelectItem key={ar} value={ar}>
                      {ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Postcode */}
            <div>
              <Label>Postcode</Label>
              <Input
                className="mt-1"
                placeholder="Enter postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <Button className="w-full h-12 text-lg" onClick={checkEligibility}>
              Check Eligibility
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVWorkPreferences;

