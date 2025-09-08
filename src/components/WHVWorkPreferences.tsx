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

      // 2. Get visa details from maker_visa
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("sub_class, stage_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!visa) {
        setError("Visa not found for this user");
        setLoading(false);
        return;
      }

      // 3. Query region_rules filtered by subclass + stage
      const { data, error } = await supabase
        .from("region_rules")
        .select("state, area, postcode_range, industry_id")
        .eq("sub_class", visa.sub_class)   // e.g. "417" or "462"
        .eq("stage", visa.stage_id);       // e.g. 1, 2, or 3

      if (error) {
        console.error("Error fetching regions:", error);
        setError(error.message);
      } else {
        console.log("Fetched regions:", data); // 🔎 check in dev console
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



