import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface FilterPageProps {
  onClose: () => void;
  onApplyFilters: (filters: {
    p_filter_state?: string | null;
    p_filter_suburb_city_postcode?: string | null;
    p_filter_work_industry_id?: number | null;
    p_filter_work_years_experience?: string | null;
    p_filter_industry_ids?: number[] | null;
    p_filter_license_ids?: number[] | null;
  }) => void;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selected, setSelected] = useState({
    p_filter_state: "",
    p_filter_suburb_city_postcode: "",
    p_filter_work_industry_id: "",
    p_filter_work_years_experience: "",
    p_filter_industry_ids: [] as number[],
    p_filter_license_ids: [] as number[],
  });

  const [states, setStates] = useState<string[]>([]);
  const [suburbPostcodes, setSuburbPostcodes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>([]);
  const [licenses, setLicenses] = useState<{ id: number; name: string }[]>([]);
  const experienceLevels = ["None", "<1", "1-2", "3-4", "5-7", "8-10", "10+"];

  // options
  useEffect(() => {
    (async () => {
      // states & suburb/postcodes sourced from maker preferences
      const { data: loc } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");
      if (loc) {
        setStates([...new Set(loc.map((l) => l.state).filter(Boolean))]);
        setSuburbPostcodes(
          [
            ...new Set(
              loc
                .map((l) =>
                  l.suburb_city && l.postcode ? `${l.suburb_city} (${l.postcode})` : null
                )
                .filter(Boolean)
            ),
          ] as string[]
        );
      }

      // industries
      const { data: inds } = await supabase.from("industry").select("industry_id, name");
      if (inds) setIndustries(inds.map((r) => ({ id: r.industry_id, name: r.name })));

      // licenses
      const { data: lic } = await supabase.from("license").select("license_id, name");
      if (lic) setLicenses(lic.map((r) => ({ id: r.license_id, name: r.name })));
    })();
  }, []);

  // multi-select toggles (Select from shadcn closes after selection; we support toggle by reopening)
  const toggleMulti = (
    key: "p_filter_industry_ids" | "p_filter_license_ids",
    value: number
  ) => {
    setSelected((prev) => {
      const set = new Set(prev[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [key]: Array.from(set) as number[] };
    });
  };

  const apply = () => {
    const payload = {
      p_filter_state: selected.p_filter_state || null,
      p_filter_suburb_city_postcode:
        selected.p_filter_suburb_city_postcode || null,
      p_filter_work_industry_id: selected.p_filter_work_industry_id
        ? Number(selected.p_filter_work_industry_id)
        : null,
      p_filter_work_years_experience:
        selected.p_filter_work_years_experience || null,
      p_filter_industry_ids:
        selected.p_filter_industry_ids.length > 0
          ? selected.p_filter_industry_ids
          : null,
      p_filter_license_ids:
        selected.p_filter_license_ids.length > 0
          ? selected.p_filter_license_ids
          : null,
    };

    onApplyFilters(payload);
    onClose();
  };

  const clearAll = () => {
    setSelected({
      p_filter_state: "",
      p_filter_suburb_city_postcode: "",
      p_filter_work_industry_id: "",
      p_filter_work_years_experience: "",
      p_filter_industry_ids: [],
      p_filter_license_ids: [],
    });
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4" />

          {/* Header */}
          <div className="px-4 py-3 border-b bg-white">
            <div className="flex items-center gap-3">
              <button onClick={onClose}>
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">
                Candidate Filters
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <Section title="Industry of Work Experience">
              <Select
                value={selected.p_filter_work_industry_id}
                onValueChange={(v) =>
                  setSelected((s) => ({ ...s, p_filter_work_industry_id: v }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            <Section title="Candidate State">
              <Select
                value={selected.p_filter_state}
                onValueChange={(v) =>
                  setSelected((s) => ({ ...s, p_filter_state: v }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s, idx) => (
                    <SelectItem key={idx} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            <Section title="Candidate Suburb & Postcode">
              <Select
                value={selected.p_filter_suburb_city_postcode}
                onValueChange={(v) =>
                  setSelected((s) => ({ ...s, p_filter_suburb_city_postcode: v }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any suburb & postcode" />
                </SelectTrigger>
                <SelectContent>
                  {suburbPostcodes.length > 0 ? (
                    suburbPostcodes.map((s, idx) => (
                      <SelectItem key={idx} value={s}>
                        {s}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No options available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Section>

            <Section title="Candidate Licenses (multi-select)">
              <Select
                value="" // force placeholder; we handle toggling below
                onValueChange={(v) => toggleMulti("p_filter_license_ids", Number(v))}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue
                    placeholder={`${selected.p_filter_license_ids.length} selected`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {licenses.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected.p_filter_license_ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.p_filter_license_ids.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 border"
                    >
                      {licenses.find((l) => l.id === id)?.name ?? id}
                    </span>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Preferred Industries (multi-select)">
              <Select
                value=""
                onValueChange={(v) => toggleMulti("p_filter_industry_ids", Number(v))}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue
                    placeholder={`${selected.p_filter_industry_ids.length} selected`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected.p_filter_industry_ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.p_filter_industry_ids.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 border"
                    >
                      {industries.find((i) => i.id === id)?.name ?? id}
                    </span>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Years of Work Experience">
              <Select
                value={selected.p_filter_work_years_experience}
                onValueChange={(v) =>
                  setSelected((s) => ({
                    ...s,
                    p_filter_work_years_experience: v,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Any experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>
          </div>

          {/* Actions */}
          <div className="bg-white border-t p-4 flex gap-2">
            <Button variant="outline" onClick={clearAll} className="flex-1">
              Clear Filters
            </Button>
            <Button onClick={apply} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white">
              Find Candidates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPage;
