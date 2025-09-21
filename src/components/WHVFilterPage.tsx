import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Industry {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  industryId: number;
}

interface WHVFilterPageProps {
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const WHVFilterPage: React.FC<WHVFilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    state: "",
    citySuburb: "",
    postcode: "",
    interestedIndustry: "",
    interestedRole: "",
    lookingForJobType: "",
    minPayRate: "",
    maxPayRate: "",
    needsAccommodation: false,
    needsMeals: false,
    needsTransport: false,
    needsTraining: false,
    hasEquipment: false,
  });

  // 🔑 Enums + lookup tables
  const [states, setStates] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [payRanges, setPayRanges] = useState<string[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Fetch enums & lookups from Supabase
  useEffect(() => {
    const fetchEnumsAndLookups = async () => {
      try {
        const { data: stateData } = await supabase.rpc("get_enum_values", {
          enum_name: "state",
        });
        const { data: jobTypeData } = await supabase.rpc("get_enum_values", {
          enum_name: "employment_type",
        });
        const { data: payRangeData } = await supabase.rpc("get_enum_values", {
          enum_name: "salary_range",
        });

        if (stateData) setStates(stateData);
        if (jobTypeData) setJobTypes(jobTypeData);
        if (payRangeData) setPayRanges(payRangeData);

        // Industries
        const { data: indRes } = await supabase.from("industry").select("industry_id, name");
        if (indRes) {
          setIndustries(indRes.map((i) => ({ id: i.industry_id, name: i.name })));
        }

        // Roles
        const { data: roleRes } = await supabase
          .from("industry_role")
          .select("industry_role_id, role, industry_id");
        if (roleRes) {
          setRoles(
            roleRes.map((r) => ({
              id: r.industry_role_id,
              name: r.role,
              industryId: r.industry_id,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching enums/lookups:", err);
      }
    };
    fetchEnumsAndLookups();
  }, []);

  const handleSelectChange = (category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleBooleanFilterChange = (category: string, checked: boolean) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: checked,
    }));
  };

  const applyFilters = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };

  // 🔽 Dropdown wrapper
  const DropdownSection = ({
    title,
    items,
    category,
    placeholder,
  }: {
    title: string;
    items: string[];
    category: string;
    placeholder: string;
  }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <Select
        value={selectedFilters[category as keyof typeof selectedFilters] as string}
        onValueChange={(value) => handleSelectChange(category, value)}
      >
        <SelectTrigger className="w-full bg-white border border-gray-300 z-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 shadow-lg z-50 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <SelectItem key={item} value={item} className="hover:bg-gray-100">
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={onClose}>
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Job Filters</h1>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {/* Location */}
            <DropdownSection
              title="Preferred State"
              items={states}
              category="state"
              placeholder="Select state"
            />

            <div className="mb-3">
              <Label className="text-sm text-gray-600 mb-2 block">Preferred City or Area</Label>
              <Input
                type="text"
                placeholder="e.g., Brisbane, Tamworth, Mildura..."
                value={selectedFilters.citySuburb}
                onChange={(e) => handleSelectChange("citySuburb", e.target.value)}
                className="w-full bg-white border border-gray-300"
              />
            </div>

            <div className="mb-6">
              <Label className="text-sm text-gray-600 mb-2 block">Preferred Postcode</Label>
              <Input
                type="text"
                placeholder="e.g., 4000, 2000, 3000..."
                value={selectedFilters.postcode}
                onChange={(e) => handleSelectChange("postcode", e.target.value)}
                className="w-full bg-white border border-gray-300"
              />
            </div>

            {/* Industry */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Industry</h3>
              <Select
                value={selectedFilters.interestedIndustry}
                onValueChange={(val) => handleSelectChange("interestedIndustry", val)}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                  {industries.map((ind) => (
                    <SelectItem key={ind.id} value={String(ind.id)}>
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            {selectedFilters.interestedIndustry && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Role</h3>
                <Select
                  value={selectedFilters.interestedRole}
                  onValueChange={(val) => handleSelectChange("interestedRole", val)}
                >
                  <SelectTrigger className="w-full bg-white border border-gray-300">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                    {roles
                      .filter((r) => r.industryId === Number(selectedFilters.interestedIndustry))
                      .map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Job Type */}
            <DropdownSection
              title="Job Type"
              items={jobTypes}
              category="lookingForJobType"
              placeholder="Select job type"
            />

            {/* Pay Range */}
            <DropdownSection
              title="Pay Range"
              items={payRanges}
              category="minPayRate"
              placeholder="Select pay range"
            />

            {/* Employer Benefits */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What I Need from Employer</h3>
              <div className="space-y-2">
                {[
                  { key: "needsAccommodation", label: "I Need Accommodation" },
                  { key: "needsMeals", label: "I Need Meals Provided" },
                  { key: "needsTransport", label: "I Need Transport Provided" },
                  { key: "needsTraining", label: "I Need Training Provided" },
                  { key: "hasEquipment", label: "I Have My Own Equipment/Tools" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={selectedFilters[item.key as keyof typeof selectedFilters] as boolean}
                      onCheckedChange={(checked) =>
                        handleBooleanFilterChange(item.key, checked as boolean)
                      }
                    />
                    <Label htmlFor={item.key} className="text-sm text-gray-700">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Bottom Button */}
          <div className="bg-white border-t p-4 flex-shrink-0 rounded-b-[48px]">
            <Button
              onClick={applyFilters}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Find Jobs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVFilterPage;
