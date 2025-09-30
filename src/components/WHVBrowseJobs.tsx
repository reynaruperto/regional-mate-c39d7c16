// src/components/WHVBrowseJobs.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import LikeConfirmationModal from "@/components/LikeConfirmationModal";

import { supabase } from "@/integrations/supabase/client";

interface JobCard {
  job_id: number;
  company: string;
  profile_photo: string;
  role: string;
  industry: string;
  location: string;
  salary_range: string;
  employment_type: string;
  description?: string;
  isLiked?: boolean;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = (url: string) => {
    window.location.href = url;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState("");
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [allJobs, setAllJobs] = useState<JobCard[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [whvId, setWhvId] = useState<string | null>(null);

  const [visaStageLabel, setVisaStageLabel] = useState<string>("");

  // ✅ Get logged-in WHV ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setWhvId(user.id);
    };
    getUser();
  }, []);

  // ✅ Fetch jobs (only eligible for WHV user, via RPC)
  useEffect(() => {
    const fetchJobs = async () => {
      if (!whvId) return;

      // 1️⃣ Get latest visa stage label
      const { data: visa } = await supabase
        .from("maker_visa")
        .select("stage_id, visa_stage(label)")
        .eq("user_id", whvId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setVisaStageLabel(visa?.visa_stage?.label || "");

      // 2️⃣ Fetch jobs from RPC
      const { data: jobsData, error } = await (supabase as any).rpc("view_all_eligible_jobs", {
        p_maker_id: whvId,
      });

      if (error) {
        console.error("Error fetching eligible jobs:", error);
        return;
      }
      if (!jobsData) return;

      // 🛠 Debug: log & alert first job object
      console.log("Jobs data sample:", jobsData[0]);
      alert(JSON.stringify(jobsData[0], null, 2));

      setJobs(jobsData);
      setAllJobs(jobsData);
    };

    fetchJobs();
  }, [whvId]);

  return showFilters ? (
    <WHVFilterPage 
      onClose={() => setShowFilters(false)} 
      onResults={(jobs) => {
        setJobs(jobs);
        setAllJobs(jobs);
        setShowFilters(false);
      }}
      user={{
        id: whvId || "",
        subClass: "417", // Default value, should be from user data
        countryId: 1, // Default value, should be from user data  
        stage: 1 // Default value, should be from user data
      }}
    />
  ) : (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate("/whv/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs (Debug Mode)</h1>
            </div>

            {/* Visa Info */}
            <div className="bg-gray-100 px-6 py-2 text-sm text-gray-700 text-center">
              <p>
                Your visa: <strong>{visaStageLabel || "Unknown"}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Only jobs eligible for your visa will appear here.
              </p>
            </div>

            {/* Jobs JSON Debug Dump */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              <pre className="text-xs bg-gray-200 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(jobs, null, 2)}
              </pre>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          <LikeConfirmationModal
            candidateName={likedJobTitle}
            onClose={() => setShowLikeModal(false)}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
