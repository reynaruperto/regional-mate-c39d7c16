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

const BrowseCandidates: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<any>(null);

  // ✅ Fetch candidates from backend function
  const fetchCandidates = async (appliedFilters: any = null) => {
    const { data: ids, error } = await supabase.rpc(
      "filter_maker_for_employer",
      {
        p_filter_state: appliedFilters?.state || null,
        p_filter_suburb_city_postcode:
          appliedFilters?.citySuburbPostcode || null,
        p_filter_work_industry_id: appliedFilters?.industryId
          ? Number(appliedFilters.industryId)
          : null,
        p_filter_work_years_experience:
          appliedFilters?.yearsExperience || null,
        p_filter_license_ids: appliedFilters?.licenseId
          ? [Number(appliedFilters.licenseId)]
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

    // Fetch details for candidates we got IDs for
    const { data: details, error: detailsError } = await supabase
      .from("whv_maker")
      .select(
        `
        user_id,
        given_name,
        family_name,
        state,
        suburb_city,
        postcode
      `
      )
      .in(
        "user_id",
        ids.map((row: any) => row.maker_id)
      );

    if (detailsError) {
      console.error("Error fetching candidate details:", detailsError);
      return;
    }

    // Fetch industries
    const { data: industriesData } = await supabase
      .from("maker_work_experience")
      .select(
        `
        user_id,
        industry_id,
        start_date,
        end_date,
        industry:industry(name)
      `
      );

    // Fetch licenses
    const { data: licensesData } = await supabase
      .from("maker_license")
      .select(
        `
        user_id,
        license_id,
        license:license(name)
      `
      );

    // ✅ Merge all candidate data
    const merged = details.map((d) => {
      const candidateIndustries =
        industriesData
          ?.filter((i) => i.user_id === d.user_id)
          .map((i) => i.industry?.name) || [];

      const candidateLicenses =
        licensesData
          ?.filter((l) => l.user_id === d.user_id)
          .map((l) => l.license?.name) || [];

      return {
        user_id: d.user_id,
        name: [d.given_name, d.family_name].filter(Boolean).join(" "),
        state: d.state,
        suburb_city_postcode: [
          `${d.suburb_city || ""} (${d.postcode || ""})`,
        ],
        industries: candidateIndustries,
        years_experience: "—", // could be enhanced if needed
        licenses: candidateLicenses,
      };
    });

    setCandidates(merged);
  };

  // Load all candidates by default
  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters);
    fetchCandidates(appliedFilters);
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
            <button onClick={onClose}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
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
                      {c.suburb_city_postcode.join(", ")} • {c.state}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Industries:</span>{" "}
                      {c.industries.length > 0
                        ? c.industries.join(", ")
                        : "—"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Licenses:</span>{" "}
                      {c.licenses.length > 0
                        ? c.licenses.join(", ")
                        : "—"}
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
