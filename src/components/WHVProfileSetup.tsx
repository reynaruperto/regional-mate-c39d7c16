import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface WorkPreferencesProps {
  visaType: string;
  visaStage: string;
}

interface Industry {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  industry_id: number;
}

interface State {
  id: number;
  name: string;
}

interface Area {
  id: number;
  name: string;
}

export default function WHVWorkPreferences({ visaType, visaStage }: WorkPreferencesProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Load user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error);
      setUserId(data?.user?.id ?? null);
    };
    getUser();
  }, []);

  // ✅ Fetch reference data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: industryData } = await supabase.from("industries").select("*");
      const { data: roleData } = await supabase.from("roles").select("*");
      const { data: stateData } = await supabase.from("states").select("*");
      const { data: areaData } = await supabase.from("areas").select("*");

      setIndustries(industryData || []);
      setRoles(roleData || []);
      setStates(stateData || []);
      setAreas(areaData || []);
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("user_work_preferences")
      .upsert(
        [
          {
            user_id: userId,
            industries: selectedIndustries,
            roles: selectedRoles,
            states: selectedStates,
            areas: selectedAreas,
            visa_type: visaType,
            visa_stage: visaStage,
          },
        ],
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Save error:", error.message);
    } else {
      console.log("Preferences saved!");
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Work Preferences</h2>

      {/* Industries */}
      <div>
        <Label>Industries (pick up to 3)</Label>
        {industries.slice(0, 3).map((ind) => (
          <div key={ind.id} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedIndustries.includes(ind.name)}
              onCheckedChange={(checked) => {
                if (checked && selectedIndustries.length < 3) {
                  setSelectedIndustries([...selectedIndustries, ind.name]);
                } else {
                  setSelectedIndustries(selectedIndustries.filter((i) => i !== ind.name));
                }
              }}
            />
            <span>{ind.name}</span>
          </div>
        ))}
      </div>

      {/* Roles */}
      <div>
        <Label>Roles (pick up to 3)</Label>
        {roles.slice(0, 3).map((role) => (
          <div key={role.id} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedRoles.includes(role.name)}
              onCheckedChange={(checked) => {
                if (checked && selectedRoles.length < 3) {
                  setSelectedRoles([...selectedRoles, role.name]);
                } else {
                  setSelectedRoles(selectedRoles.filter((r) => r !== role.name));
                }
              }}
            />
            <span>{role.name}</span>
          </div>
        ))}
      </div>

      {/* States */}
      <div>
        <Label>States (pick up to 3)</Label>
        {states.slice(0, 3).map((st) => (
          <div key={st.id} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedStates.includes(st.name)}
              onCheckedChange={(checked) => {
                if (checked && selectedStates.length < 3) {
                  setSelectedStates([...selectedStates, st.name]);
                } else {
                  setSelectedStates(selectedStates.filter((s) => s !== st.name));
                }
              }}
            />
            <span>{st.name}</span>
          </div>
        ))}
      </div>

      {/* Areas */}
      <div>
        <Label>Areas (pick up to 3)</Label>
        {areas.slice(0, 3).map((ar) => (
          <div key={ar.id} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedAreas.includes(ar.name)}
              onCheckedChange={(checked) => {
                if (checked && selectedAreas.length < 3) {
                  setSelectedAreas([...selectedAreas, ar.name]);
                } else {
                  setSelectedAreas(selectedAreas.filter((a) => a !== ar.name));
                }
              }}
            />
            <span>{ar.name}</span>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} className="w-full">
        Save Preferences
      </Button>
    </Card>
  );
}





