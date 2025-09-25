// src/pages/WHV/WHVBrowseJobs.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";

interface JobCard {
  job_id: number;
  state: string;
  suburb_city: string;
  postcode: string | number;
  salary_range: string;
  employment_type: string;
  start_date?: string;
  description?: string;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("*")
        .eq("job_status", "active")
        .limit(20);

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        console.log("Fetched jobs:", data); // 👀 Debug here
        setJobs(data || []);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm mr-4"
                onClick={() => navigate("/whv/dashboard")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Browse Jobs (Debug)</h1>
            </div>

            {/* Search */}
            <div className="relative mb-4 px-6">
              <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white w-full"
              />
            </div>

            {/* Jobs List */}
            <div className="flex-1 px-6 overflow-y-auto" style={{ paddingBottom: "100px" }}>
              {jobs.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  <p>No jobs found (check console for results).</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.job_id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Placeholder Role</h2>
                    <p className="text-sm text-gray-600">Industry: Placeholder Industry</p>
                    <p className="text-sm text-gray-500">
                      {job.suburb_city}, {job.state} {job.postcode}
                    </p>
                    <p className="text-sm text-gray-500">💰 {job.salary_range}</p>
                    <p className="text-sm text-gray-500">Type: {job.employment_type}</p>
                    <p className="text-sm text-gray-500">Start: {job.start_date}</p>
                    <p className="text-sm text-gray-700 mt-2">{job.description || "No description"}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
