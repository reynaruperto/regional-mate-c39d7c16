// src/components/WHVEditProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ==============================
// Types
// ==============================
type AustralianState =
  | "Australian Capital Territory"
  | "New South Wales"
  | "Northern Territory"
  | "Queensland"
  | "South Australia"
  | "Tasmania"
  | "Victoria"
  | "Western Australia";

interface Industry {
  id: number;
  name: string;
}
interface Role {
  id: number;
  name: string;
  industryId: number;
}
interface Region {
  state: string;
  area: string;
  region_rules_id: number;
}
interface License {
  id: number;
  name: string;
}
interface WorkExperience {
  id: string;
  industryId: number | null;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}
interface JobReference {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  role: string;
}
interface VisaStage {
  stage_id: number;
  label: string;
  sub_class: string;
  stage: number;
}
interface CountryEligibility {
  stage_id: number;
}

// ==============================
// Validation helpers
// ==============================
const isValidAUPhone = (phone: string) =>
  /^(\+614\d{8}|04\d{8})$/.test(phone);

const isValidExpiry = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const expiryDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate > today;
};

// ==============================
// Component
// ==============================
const WHVEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Core state
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [visaStages, setVisaStages] = useState<VisaStage[]>([]);
  const [visaType, setVisaType] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<{
    address1: string;
    address2: string;
    suburb: string;
    state: AustralianState | "";
    postcode: string;
  }>({
    address1: "",
    address2: "",
    suburb: "",
    state: "",
    postcode: "",
  });

  // ... keep everything else from the previous version ...
  // Key difference: when you set state from DB or on change, CAST to AustralianState

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: maker } = await supabase
        .from("whv_maker")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (maker) {
        setNationality(maker.nationality);
        setDob(maker.birth_date);
        setTagline(maker.tagline || "");
        setPhone(maker.mobile_num || "");
        setAddress({
          address1: maker.address_line1 || "",
          address2: maker.address_line2 || "",
          suburb: maker.suburb || "",
          state: (maker.state as AustralianState) || "",
          postcode: maker.postcode || "",
        });
      }

      // ... rest of loadProfile logic unchanged ...
    };

    loadProfile();
  }, []);

  // ==============================
  // Render snippet for State Select
  // ==============================
  // Inside Step 1 render:
  /*
  <div>
    <label className="text-sm font-medium">State *</label>
    <Select
      value={address.state}
      onValueChange={(v) =>
        setAddress({ ...address, state: v as AustralianState })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select state" />
      </SelectTrigger>
      <SelectContent>
        {[...new Set(regions.map((r) => r.state))].map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  */
};

export default WHVEditProfile;
