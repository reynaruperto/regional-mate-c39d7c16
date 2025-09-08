import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RegionRule {
  state: string;
  area: string;
  industry_id: number | null;
}

const WHVWorkPreferences: React.FC = () => {
  const [regions, setRegions] = useState<RegionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRegions = async () => {
      setLoading(true);

      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      // 2. Get visa details (join visa_stage for subclass + stage)
      const { data: visa, error: visaError } = await supabase
        .from("maker_visa")
        .select(
          `
          stage_id,
          visa_stage (
            sub_class,
            stage
          )
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (visaError) {
        console.error("Error fetching visa:", visaError);
        setError(visaError.message);
        setLoading(false);
        return;
      }

      if (!visa || !visa.visa_stage) {
        setError("Visa not found for this user");
        setLoading(false);
        return;
      }

      // 3. Query region_rules filtered by subclass + stage
      const { data, error: regionError } = await supabase
        .from("region_rules")
        .select("state, area, industry_id")
        .eq("sub_class", visa.visa_stage.sub_class) // ✅ from joined visa_stage
        .eq("stage", visa.visa_stage.stage as any); // ✅ cast to any to fix TS

      if (regionError) {
        console.error("Error fetching regions:", regionError);
        setError(regionError.message);
      } else {
        console.log("Fetched regions:", data);
        setRegions(data || []);
      }

      setLoading(false);
    };

    loadRegions();
  }, []);

  if (loading) return <p>Loading regions…</p>;
  if (error) return <p className="text-red-500">⚠ {error}</p>;

  // Group regions by state with unique areas
  const groupedByState: { [state: string]: string[] } = {};
  regions.forEach((r) => {
    if (!groupedByState[r.state]) groupedByState[r.state] = [];
    if (!groupedByState[r.state].includes(r.area)) {
      groupedByState[r.state].push(r.area);
    }
  });

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">Eligible Regions</h2>
      {Object.keys(groupedByState).length === 0 ? (
        <p>No eligible regions found for this visa.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByState).map(([state, areas]) => (
            <div key={state} className="border rounded-md p-3">
              <h3 className="font-semibold text-gray-800 mb-2">{state}</h3>
              <ul className="space-y-1">
                {areas.map((area, i) => (
                  <li key={i} className="pl-2 text-sm">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WHVWorkPreferences;




