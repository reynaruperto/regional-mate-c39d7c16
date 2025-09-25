// src/components/BrowseCandidates.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import FilterPage from "./FilterPage";

interface Candidate {
  user_id: string;
  name: string;
  state: string;
  suburb_city_postcode: string[];
  industries: string[];
  years_experience: string;
  licenses: string[];
}

interface BrowseCandidatesProps {
  onClose?: () => void;
}

const BrowseCandidates: React.FC<BrowseCandidatesProps> = ({ onClose }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  // Helper: bucket years into categories
  const bucketYears = (years: number): string => {
    if (years < 1) return "<1 yr";
    if (years < 3) return "1–2 yrs";
    if (years < 5) return "3–4 yrs";
    if (years < 8) return "5–7 yrs";
    if (years < 11) return "8–10 yrs";
    return "10+ yrs";
  };

  // ✅ Fetch candidates from backend function
  const fetchCandidates = async (filters: any = null) => {
    const { data: ids, error } = await (supabase as any).rpc(
      "filter_maker_for_employer",
      {
        p_filter_state: filters?.state || null,
        p_filter_suburb_city_postcode: filters?.citySuburbPostcode || null,
        p_filter_work_industry_id: filters?.industryId
          ? Number(filters.industryId)
          : null,
        p_filter_work_years_experience: filters?.yearsExperience || null,
        p_filter_license_ids: filters?.licenseId
          ? [Number(filters.licenseId)]
          : null,
      }
    );

    if (error) {
      console.error("Error fetching candidates:", error);
      return;
    }

    if (!ids || ids.length === 0) {
      setCandidates([]);
      return;
    }

    const candidateIds = ids.map((row: any) => row.maker_id);

    // Fetch whv_maker basic info
    const { data: makers } = await supabase
      .from("whv_maker")
      .select("user_id, given_name, family_name, state")
      .in("user_id", candidateIds);

    // Fetch preferred locations
    const { data: prefLocs } = await supabase
      .from("maker_pref_location")
      .select("user_id, state, suburb_city, postcode")
      .in("user_id", candidateIds);

    // Fetch industries + experience dates
    const { data: industriesData } = await supabase
      .from("maker_work_experience")
      .select("user_id, industry_id, start_date, end_date, industry(name)")
      .in("user_id", candidateIds);

    // Fetch licenses
    const { data: licensesData } = await supabase
      .from("maker_license")
      .select("user_id, license_id, license(name)")
      .in("user_id", candidateIds);

    // ✅ Merge into candidate objects
    const merged =
      makers?.map((m) => {
        const candidateIndustries =
          industriesData
            ?.filter((i) => i.user_id === m.user_id)
            .map((i) => i.industry?.name) || [];

        const candidateLicenses =
          licensesData
            ?.filter((l) => l.user_id === m.user_id)
            .map((l) => l.license?.name) || [];

        const candidateLocs =
          prefLocs
            ?.filter((loc) => loc.user_id === m.user_id)
            .map((loc) => `${loc.suburb_city} (${loc.postcode})`) || [];

        // 🔑 Work experience calculation
        const candidateExps =
          industriesData?.filter((i) => i.user_id === m.user_id) || [];
        let totalYears = 0;
        candidateExps.forEach((exp) => {
          const start = exp.start_date ? new Date(exp.start_date) : null;
          const end = exp.end_date ? new Date(exp.end_date) : new Date();
          if (start) {
            const years =
              (end.getTime() - start.getTime()) /
              (1000 * 60 * 60 * 24 * 365.25);
            totalYears += years;
          }
        });
        const expCategory =
          totalYears > 0 ? bucketYears(totalYears) : "No experience";

        return {
          user_id: m.user_id,
          name: [m.given_name, m.family_name].filter(Boolean).join(" "),
          state: m.state,
          suburb_city_postcode: candidateLocs,
          industries: candidateIndustries,
          years_experience: expCategory,
          licenses: candidateLicenses,
        };
      }) || [];

    setCandidates(merged);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleApplyFilters = (appliedFilters: any) => {
    fetchCandidates(appliedFilters);
    setShowFilter(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showFilter ? (
        <FilterPage
          onClose={() => setShowFilter(false)}
          onApplyFilters={handleApplyFilters}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-white">
            {onClose && (
              <button onClick={onClose}>
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
            )}
            <h1 className="text-lg font-medium text-gray-900">
              Browse Candidates
            </h1>
            <div className="ml-auto">
              <Button
                variant="outline"
                onClick={() => setShowFilter(true)}
                className="text-sm"
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Candidates list */}
          <div className="flex-1 overflow-y-auto p-4">
            {candidates.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">
                No candidates found.
              </p>
            ) : (
              <div className="space-y-4">
                {candidates.map((c) => (
                  <div
                    key={c.user_id}
                    className="p-4 bg-white rounded-lg shadow border"
                  >
                    <h2 className="font-semibold text-lg">{c.name}</h2>
                    <p className="text-sm text-gray-600">
                      {c.suburb_city_postcode.join(", ") || "No locations"} •{" "}
                      {c.state}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Industries:</span>{" "}
                      {c.industries.length > 0
                        ? c.industries.join(", ")
                        : "—"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Experience:</span>{" "}
                      {c.years_experience}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Licenses:</span>{" "}
                      {c.licenses.length > 0 ? c.licenses.join(", ") : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseCandidates;
