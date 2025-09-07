import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ✅ Schema
const formSchema = z.object({
  industries: z.array(z.string()).min(1, "Pick at least 1 industry").max(3, "Max 3 industries"),
  states: z.array(z.string()).min(1, "Pick at least 1 state").max(3, "Max 3 states"),
  areas: z.array(z.string()).min(1, "Pick at least 1 area").max(3, "Max 3 areas"),
  postcode: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WorkPreferencesProps {
  visaType: "417" | "462";
  visaStage: number; // 1, 2, 3
}

const WorkPreferences: React.FC<WorkPreferencesProps> = ({ visaType, visaStage }) => {
  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      industries: [],
      states: [],
      areas: [],
    },
  });

  const [industries, setIndustries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<string>("");

  const selectedIndustries = watch("industries");
  const selectedStates = watch("states");
  const selectedAreas = watch("areas");
  const enteredPostcode = watch("postcode");

  // 🔹 Load industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("region_rules")
        .select("industry_name")
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching industries:", error.message);
      } else if (data) {
        const uniqueIndustries = [...new Set(data.map((row) => row.industry_name))];
        setIndustries(uniqueIndustries);
      }
    };

    fetchIndustries();
  }, [visaType, visaStage]);

  // 🔹 Load states after industries
  useEffect(() => {
    const fetchStates = async () => {
      if (selectedIndustries.length === 0) return;

      const { data, error } = await supabase
        .from("region_rules")
        .select("state")
        .in("industry_name", selectedIndustries)
        .eq("sub_class", visaType)
        .eq("stage", visaStage);

      if (error) {
        console.error("Error fetching states:", error.message);
      } else if (data) {
        const uniqueStates = [...new Set(data.map((row) => row.state))];
        setStates(uniqueStates);
      }
    };

    fetchStates();
  }, [selectedIndustries, visaType, visaStage]);

  // 🔹 Load areas after selecting states
  useEffect(() => {
    const fetchAreas = async () => {
      if (selectedIndustries.length === 0 || selectedStates.length === 0) return;

      const { data, error } = await supabase
        .from("region_rules")
        .select("area")
        .in("industry_name", selectedIndustries)
        .eq("sub_class", visaType)
        .eq("stage", visaStage)
        .in("state", selectedStates);

      if (error) {
        console.error("Error fetching areas:", error.message);
      } else if (data) {
        const uniqueAreas = [...new Set(data.map((row) => row.area))];
        setAreas(uniqueAreas);
      }
    };

    fetchAreas();
  }, [selectedIndustries, selectedStates, visaType, visaStage]);

  // 🔹 Tooltip eligibility
  useEffect(() => {
    const checkEligibility = async () => {
      if (selectedIndustries.length === 0 || selectedStates.length === 0 || selectedAreas.length === 0) return;

      const { data, error } = await supabase
        .from("region_rules")
        .select("postcode_range")
        .in("industry_name", selectedIndustries)
        .eq("sub_class", visaType)
        .eq("stage", visaStage)
        .in("state", selectedStates)
        .in("area", selectedAreas);

      if (error) {
        console.error("Error checking eligibility:", error.message);
      } else if (data && data.length > 0) {
        const rule = data[0];
        if (rule.postcode_range === "All postcodes") {
          setTooltip("✅ Eligible for visa extension in this area");
        } else if (enteredPostcode && rule.postcode_range.includes(enteredPostcode)) {
          setTooltip("✅ Eligible for visa extension (postcode match)");
        } else {
          setTooltip("⚠️ This role may not be eligible in this location");
        }
      }
    };

    checkEligibility();
  }, [selectedIndustries, selectedStates, selectedAreas, enteredPostcode, visaType, visaStage]);

  const onSubmit = (data: FormData) => {
    console.log("Work Preferences submitted:", data);
  };

  // ✅ Helper to display combined selections as text
  const industriesSummary =
    selectedIndustries.length > 0
      ? selectedIndustries.join(" + ")
      : "Select up to 3 industries";

  const statesSummary =
    selectedStates.length > 0
      ? selectedStates.map((s) => `Anywhere in ${s}`).join(" + ")
      : "Select up to 3 states";

  const areasSummary =
    selectedAreas.length > 0
      ? selectedAreas.join(" + ")
      : "Select up to 3 areas";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      {/* Industry Multi-Select */}
      <Controller
        name="industries"
        control={control}
        render={({ field }) => (
          <div>
            <Select
              onValueChange={(val) => {
                if (field.value.includes(val)) {
                  field.onChange(field.value.filter((s) => s !== val));
                } else if (field.value.length < 3) {
                  field.onChange([...field.value, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industries (up to 3)" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm mt-2 text-gray-600">{industriesSummary}</p>
          </div>
        )}
      />

      {/* Multi-State Selection */}
      <Controller
        name="states"
        control={control}
        render={({ field }) => (
          <div>
            <Select
              onValueChange={(val) => {
                if (field.value.includes(val)) {
                  field.onChange(field.value.filter((s) => s !== val));
                } else if (field.value.length < 3) {
                  field.onChange([...field.value, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select states (up to 3)" />
              </SelectTrigger>
              <SelectContent>
                {states.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm mt-2 text-gray-600">{statesSummary}</p>
          </div>
        )}
      />

      {/* Multi-Area Selection */}
      <Controller
        name="areas"
        control={control}
        render={({ field }) => (
          <div>
            <Select
              onValueChange={(val) => {
                if (field.value.includes(val)) {
                  field.onChange(field.value.filter((s) => s !== val));
                } else if (field.value.length < 3) {
                  field.onChange([...field.value, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select areas (up to 3)" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((ar) => (
                  <SelectItem key={ar} value={ar}>
                    {ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm mt-2 text-gray-600">{areasSummary}</p>
          </div>
        )}
      />

      {/* Postcode Input */}
      <Controller
        name="postcode"
        control={control}
        render={({ field }) => (
          <Input {...field} placeholder="Enter postcode (optional)" />
        )}
      />

      {/* Tooltip */}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-sm text-gray-600">ℹ️ Check eligibility</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}

      <Button type="submit" className="w-full">
        Save Preferences
      </Button>
    </form>
  );
};

export default WorkPreferences;



