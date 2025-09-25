// src/components/BrowseCandidates.tsx
import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import FilterPage from "./FilterPage";

interface Candidate {
  user_id: string;
  name: string;
  profileImage: string;
  industries: string[];
  yearsCategory: string;
  preferredLocations: string[];
  licenses: string[];
  isLiked: boolean;
}

const BrowseCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all candidates (visible makers)
  useEffect(() => {
    const fetchCandidates = async () => {
      const { data, error } = await supabase
        .from("whv_maker")
        .select(
          `
          user_id,
          given_name,
          family_name,
          profile_photo,
          is_profile_visible,
          maker_pref_location(state, suburb_city, postcode),
          maker_work_experience(start_date, end_date, industry(name)),
          maker_license(license(name))
        `
        )
        .eq("is_profile_visible", true);

      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }

      if (!data) return;

      const mapped = data.map((row: any) => {
        const industries = row.maker_work_experience?.map(
          (exp: any) => exp.industry?.name
        ) || [];

        // Years of experience calculation
        let totalYears = 0;
        row.maker_work_experience?.forEach((exp: any) => {
          if (exp.start_date) {
            const start = new Date(exp.start_date);
            const end = exp.end_date ? new Date(exp.end_date) : new Date();
            totalYears +=
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          }
        });

        let yearsCategory = "";
        if (totalYears < 1) yearsCategory = "<1 yr";
        else if (totalYears < 3) yearsCategory = "1–2 yrs";
        else if (totalYears < 5) yearsCategory = "3–4 yrs";
        else if (totalYears < 8) yearsCategory = "5–7 yrs";
        else if (totalYears < 11) yearsCategory = "8–10 yrs";
        else yearsCategory = "10+ yrs";

        const preferredLocations =
          row.maker_pref_location?.map(
            (loc: any) => `${loc.suburb_city} (${loc.postcode}) · ${loc.state}`
          ) || [];

        const licenses =
          row.maker_license?.map((l: any) => l.license?.name) || [];

        return {
          user_id: row.user_id,
          name: [row.given_name, row.family_name].filter(Boolean).join(" "),
          profileImage:
            row.profile_photo ||
            "https://via.placeholder.com/150?text=No+Photo",
          industries,
          yearsCategory,
          preferredLocations,
          licenses,
          isLiked: false,
        };
      });

      setAllCandidates(mapped);
      setCandidates(mapped);
    };

    fetchCandidates();
  }, []);

  // Handle filters (frontend filtering)
  const handleApplyFilters = (filters: any) => {
    let filtered = [...allCandidates];

    if (filters.preferredState) {
      filtered = filtered.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(filters.preferredState.toLowerCase())
        )
      );
    }

    if (filters.preferredCityPostcode) {
      filtered = filtered.filter((c) =>
        c.preferredLocations.some((loc) =>
          loc.toLowerCase().includes(filters.preferredCityPostcode.toLowerCase())
        )
      );
    }

    if (filters.candidateIndustry) {
      filtered = filtered.filter((c) =>
        c.industries.includes(filters.candidateIndustry)
      );
    }

    if (filters.candidateExperience) {
      filtered = filtered.filter(
        (c) => c.yearsCategory === filters.candidateExperience
      );
    }

    if (filters.candidateLicense) {
      filtered = filtered.filter((c) =>
        c.licenses.includes(filters.candidateLicense)
      );
    }

    setCandidates(filtered);
  };

  // Handle like (mocked for now)
  const handleLikeCandidate = (userId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.user_id === userId ? { ...c, isLiked: !c.isLiked } : c
      )
    );
  };

  const handleViewProfile = (userId: string) => {
    console.log("View profile:", userId);
    // navigate(`/candidate/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Browse Candidates</h1>
        <Button
          onClick={() => setShowFilters(true)}
          className="bg-slate-800 hover:bg-slate-700 text-white"
        >
          Filters
        </Button>
      </div>

      {/* Candidate cards */}
      <div className="space-y-6">
        {candidates.map((c) => (
          <div
            key={c.user_id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <img
                src={c.profileImage}
                alt={c.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />

              {/* Candidate Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {c.name}
                </h3>

                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Industries:</span>{" "}
                  {c.industries.length ? c.industries.join(", ") : "No industries"}
                </p>

                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Experience:</span>{" "}
                  {c.yearsCategory}
                </p>

                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Preferred Locations:</span>{" "}
                  {c.preferredLocations.join(", ") || "No preferences"}
                </p>

                {c.licenses.length > 0 && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Licenses:</span>{" "}
                    {c.licenses.join(", ")}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    onClick={() => handleViewProfile(c.user_id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-11 rounded-xl"
                  >
                    View Profile
                  </Button>
                  <button
                    onClick={() => handleLikeCandidate(c.user_id)}
                    className="h-11 w-11 flex-shrink-0 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all duration-200"
                  >
                    <Heart
                      size={20}
                      className={
                        c.isLiked
                          ? "text-orange-500 fill-orange-500"
                          : "text-orange-500"
                      }
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!candidates.length && (
          <div className="text-center text-sm text-gray-500 py-12">
            No candidates match your filters.
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <FilterPage
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
        />
      )}
    </div>
  );
};

export default BrowseCandidates;
