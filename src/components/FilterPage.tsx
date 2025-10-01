// src/components/FilterPage.tsx
import React, { useState, useEffect } from "react";
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
  onApplyFilters: (filters: any) => void;
}

const FilterPage: React.FC<FilterPageProps> = ({ onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
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
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // ✅ Fetch distinct states & suburb+postcode
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("maker_pref_location")
        .select("state, suburb_city, postcode");

      if (!error && data) {
        setStates([...new Set(data.map((l) => l.state).filter(Boolean))]);
        setSuburbPostcodes([
          ...new Set(
            data
              .map((l) =>
                l.suburb_city && l.postcode
                  ? `${l.suburb_city} – ${l.postcode}`
                  : null
              )
              .filter(Boolean)
          ),
        ]);
      }
    };

    fetchLocations();
  }, []);

  // ✅ Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("industry")
        .select("industry_id, name");

      if (!error && data) {
        setIndustries(data.map((row) => ({ id: row.industry_id, name: row.name })));
      }
    };
    fetchIndustries();
  }, []);

  // ✅ Fetch licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error } = await supabase.from("license").select("license_id, name");
      if (!error && data) {
        setLicenses(data.map((row) => ({ id: row.license_id, name: row.name })));
      }
    };
    fetchLicenses();
  }, []);

  // ✅ Experience Levels
  useEffect(() => {
    setExperienceLevels([
      "None",
      "<1",
      "1-2",
      "3-4",
      "5-7",
      "8-10",
      "10+",
    ]);
  }, []);

  const handleSelectChange = (category: string, value: string | number) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const applyFilters = () => {
    const cleaned = Object.fromEntries(
      Object.entries(selectedFilters).filter(([_, v]) => v && v.toString().trim() !== "")
    );
    onApplyFilters(cleaned);
    onClose();
  };

  const DropdownSection = ({
    title,
    items,
    category,
    placeholder,
    isObject = false,
  }: {
    title: string;
    items: any[];
    category: string;
    placeholder: string;
    isObject?: boolean;
  }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <Select
        value={selectedFilters[category as keyof typeof selectedFilters] as any}
        onValueChange={(value) => handleSelectChange(category, value)}
      >
        <SelectTrigger className="w-full bg-white border border-gray-300 z-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 shadow-lg z-50 max-h-60 overflow-y-auto">
          {items.length > 0 ? (
            items.map((item) =>
              isObject ? (
                <SelectItem key={item.id} value={String(item.id)} className="hover:bg-gray-100">
                  {item.name}
                </SelectItem>
              ) : (
                <SelectItem key={item} value={String(item)} className="hover
