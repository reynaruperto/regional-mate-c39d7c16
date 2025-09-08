import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RegionRule {
  state: string;
  area: string;
  postcode_range: string | null;
  industry_id: number;
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

      // 2. Get visa details from maker_visa (just stage_id)
      const { data: visa, error: visaError } = await supabase
        .from("maker_visa")
        .select("stage_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (visaError) {
        console.error("Error fetching visa:", visaError);
        setError("Could not fetch visa");
        setLoading(false);
        return;
      }

      if (!visa) {
        setError("Visa not found for this user");
        setLoading(false);
        return;
      }

      // 3. Look up subclass from visa_stage
      const { data: stage, error: stageError } = await supabase
        .from("visa_stage")
        .select("sub_class")
        .eq("stage_id", visa.stage_id)
        .maybeSingle();

      if (stageError) {
        console.error("Error fetching visa stage:", stageError);
        setError("Could not fetch visa stage");
        setLoading(false);
        return;
      }

      if (!stage) {
        setError("Visa stage not found");
        setLoading(false);
        return;
      }

      // 4. Now fetch eligible regions using subclass + stage_id
      const { data, error: regionError } = await supabase
        .from("region_rules")
        .select("state, area, postcode_range, industry_id")
        .eq("sub_class", stage.sub_class) // ✅ from visa_stage
        .eq("stage", visa.stage_id);      // ✅ from maker_visa

      if (regionError) {
        console.error("Error fetching regions:", regionError);
        setError("Could not fetch regions");
      } else {
        console.log("Fetched regions:", data); // 🔎 debug
        setRegions(data || []);
      }

      setLoading(false);
    };

    loadRegions();
  }, []);

  if (loading) return <p>Loading regions…</p>;
  if (error) return <p className="text-red-500">⚠ {error}</p>;

  return (
    <div>
      <h2 className="font-bold text-lg mb-2">Eligible Regions</h2>
      {regions.length === 0 ? (
        <p>No eligible regions found for this visa.</p>
      ) : (
        <ul className="space-y-2">
          {regions.map((r, i) => (
            <li key={i} className="p-2 border rounded-md">
              <p>
                <strong>{r.state}</strong> – {r.area}
              </p>
              {r.postcode_range && (
                <p className="text-xs text-gray-500">
                  Postcodes: {r.postcode_range}
                </p>
              )}
              <p className="text-xs text-gray-400">Industry ID: {r.industry_id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WHVWorkPreferences;




