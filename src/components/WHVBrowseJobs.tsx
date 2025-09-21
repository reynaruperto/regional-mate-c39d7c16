import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import WHVFilterPage from "@/components/WHVFilterPage";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  job_id: number;
  description: string;
  employment_type: string;
  salary_range: string;
  state: string;
  suburb_city: string;
  postcode: string;
  company_name: string;
  profile_photo: string | null;
  industry: string;
  role: string;
  isLiked?: boolean;
}

const BrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<any>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("job")
        .select(`
          job_id,
          description,
          employment_type,
          salary_range,
          state,
          suburb_city,
          postcode,
          employer:employer(company_name, profile_photo),
          industry_role:industry_role(role, industry:industry(name))
        `)
        .eq("job_status", "active");

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      const mapped: Job[] =
        data?.map((j: any) => ({
          job_id: j.job_id,
          description: j.description,
          employment_type: j.employment_type,
          salary_range: j.salary_range,
          state: j.state,
          suburb_city: j.suburb_city,
          postcode: j.postcode,
          company_name: j.employer?.company_name || "Unknown",
          profile_photo: j.employer?.profile_photo
            ? supabase.storage.from("profile_photo").getPublicUrl(j.employer.profile_photo).data.publicUrl
            : "/default-avatar.png",
          industry: j.industry_role?.industry?.name || "Unknown",
          role: j.industry_role?.role || "Unknown",
        })) || [];

      setJobs(mapped);
      setAllJobs(mapped);
    };

    fetchJobs();
  }, []);

  // 🔎 Apply filters in real-time
  const applyFilters = (filters: any) => {
    setSelectedFilters(filters);
    let filtered = [...allJobs];

    if (filters.state) {
      filtered = filtered.filter((j) => j.state === filters.state);
    }
    if (filters.citySuburb) {
      filtered = filtered.filter((j) =>
        j.suburb_city.toLowerCase().includes(filters.citySuburb.toLowerCase())
      );
    }
    if (filters.postcode) {
      filtered = filtered.filter((j) => j.postcode === filters.postcode);
    }
    if (filters.interestedIndustry) {
      filtered = filtered.filter(
        (j) => j.industry.toLowerCase() === filters.interestedIndustry.toLowerCase()
      );
    }
    if (filters.interestedRole) {
      filtered = filtered.filter(
        (j) => j.role.toLowerCase() === filters.interestedRole.toLowerCase()
      );
    }
    if (filters.lookingForJobType) {
      filtered = filtered.filter((j) => j.employment_type === filters.lookingForJobType);
    }
    if (filters.minPayRate) {
      filtered = filtered.filter((j) => parseInt(j.salary_range) >= parseInt(filters.minPayRate));
    }
    if (filters.maxPayRate) {
      filtered = filtered.filter((j) => parseInt(j.salary_range) <= parseInt(filters.maxPayRate));
    }

    setJobs(filtered);
    setShowFilters(false);
  };

  if (showFilters) {
    return <WHVFilterPage onClose={() => setShowFilters(false)} onApplyFilters={applyFilters} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
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
            <h1 className="text-lg font-semibold text-gray-900">Browse Jobs</h1>
          </div>

          {/* Search */}
          <div className="relative px-6 mb-4">
            <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-12 rounded-xl border-gray-200 bg-white"
            />
            <button
              onClick={() => setShowFilters(true)}
              className="absolute right-8 top-1/2 transform -translate-y-1/2"
            >
              <Filter className="text-gray-400" size={20} />
            </button>
          </div>

          {/* Job List */}
          <div className="flex-1 px-6 overflow-y-auto pb-24">
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.job_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <img
                      src={job.profile_photo || "/default-avatar.png"}
                      alt={job.company_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{job.company_name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{job.role} – {job.industry}</p>
                      <p className="text-sm text-gray-600">{job.suburb_city}, {job.state} {job.postcode}</p>
                    </div>
                    <button className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-300 hover:bg-slate-100">
                      <Heart className="text-slate-800" size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-center text-gray-500">No jobs found matching filters</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-b-[48px]">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;
