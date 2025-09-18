import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobDetails {
  job_id: number;
  role: string;
  description: string;
  employment_type: string;
  salary_range: string;
  req_experience: string;
  state: string;
  suburb_city: string;
  postcode: string;
  start_date: string;
  job_status: string;
  company_name: string;
  tagline: string;
}

interface MockCandidate {
  id: string;
  name: string;
  age: number;
  nationality: string;
  profileImage: string;
  experience: string;
  skills: string[];
  rating: number;
  distance: string;
}

const EmployerJobMatchPreview: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);

  // Mock candidates data
  const mockCandidates: MockCandidate[] = [
    {
      id: "1",
      name: "Emma Thompson",
      age: 24,
      nationality: "British",
      profileImage: "/lovable-uploads/8ff82176-d379-4d34-b436-f2c63b90c153.png",
      experience: "2+ years",
      skills: ["Mining Operations", "Safety Protocols", "Heavy Machinery"],
      rating: 4.8,
      distance: "15km away"
    },
    {
      id: "2", 
      name: "Marcus Chen",
      age: 26,
      nationality: "Canadian",
      profileImage: "/lovable-uploads/5672fb16-6ddf-42ed-bddd-ea2395f6b999.png",
      experience: "3+ years",
      skills: ["Coal Processing", "Equipment Maintenance", "Quality Control"],
      rating: 4.9,
      distance: "8km away"
    },
    {
      id: "3",
      name: "Sofia Rodriguez",
      age: 25,
      nationality: "Spanish",
      profileImage: "/lovable-uploads/616bea44-f5b8-46dc-8948-70e269f076a0.png", 
      experience: "1+ years",
      skills: ["Site Management", "Team Leadership", "Documentation"],
      rating: 4.7,
      distance: "22km away"
    }
  ];

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        const { data, error } = await supabase
          .from("job")
          .select(`
            job_id,
            description,
            employment_type,
            salary_range,
            req_experience,
            state,
            suburb_city,
            postcode,
            start_date,
            job_status,
            industry_role (
              role
            )
          `)
          .eq("job_id", parseInt(jobId))
          .single();

        if (error) {
          toast({ title: "Error loading job", description: error.message });
          return;
        }

        if (data) {
          const jobData = data as any;
          setJobDetails({
            job_id: jobData.job_id,
            description: jobData.description || "No description available", 
            employment_type: jobData.employment_type || "Full-time",
            salary_range: jobData.salary_range || "$25-30",
            req_experience: jobData.req_experience || "1-2",
            state: jobData.state || "Queensland",
            suburb_city: jobData.suburb_city || "Brisbane",
            postcode: jobData.postcode || "4000",
            start_date: jobData.start_date || new Date().toISOString().split('T')[0],
            job_status: jobData.job_status || "active",
            role: jobData.industry_role?.role || "Unknown Role",
            company_name: "Your Company",
            tagline: "Leading employer in the industry"
          });
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, toast]);

  const handleLike = () => {
    toast({ 
      title: "Candidate Liked!", 
      description: `You liked ${mockCandidates[currentCandidateIndex].name}` 
    });
    nextCandidate();
  };

  const handlePass = () => {
    toast({ 
      title: "Candidate Passed", 
      description: `You passed on ${mockCandidates[currentCandidateIndex].name}` 
    });
    nextCandidate();
  };

  const nextCandidate = () => {
    if (currentCandidateIndex < mockCandidates.length - 1) {
      setCurrentCandidateIndex(currentCandidateIndex + 1);
    } else {
      setCurrentCandidateIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading match preview...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600">Job not found</p>
                <Button onClick={() => navigate("/post-jobs")} className="mt-4">
                  Back to Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCandidate = mockCandidates[currentCandidateIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* iPhone frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[48px] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50"></div>

          <div className="w-full h-full flex flex-col relative bg-gradient-to-br from-orange-50 to-pink-50">
            {/* Header */}
            <div className="px-6 pt-16 pb-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-white rounded-xl shadow-sm"
                onClick={() => navigate("/post-jobs")}
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Button>
              <div className="text-center">
                <h1 className="text-lg font-semibold text-gray-900">Match Preview</h1>
                <p className="text-sm text-gray-600">{jobDetails.role}</p>
              </div>
              <div className="w-12 h-12"></div>
            </div>

            {/* Match Card */}
            <div className="flex-1 px-6 overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6 relative overflow-hidden">
                {/* Candidate Photo */}
                <div className="text-center mb-6">
                  <div className="relative">
                    <img 
                      src={currentCandidate.profileImage} 
                      alt={currentCandidate.name}
                      className="w-32 h-32 rounded-3xl mx-auto object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {currentCandidateIndex + 1}
                    </div>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{currentCandidate.name}</h3>
                  <p className="text-gray-600 mb-2">{currentCandidate.age} years old • {currentCandidate.nationality}</p>
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-gray-700 font-medium">{currentCandidate.rating}</span>
                    <span className="text-gray-500 ml-2">• {currentCandidate.distance}</span>
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Experience</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{currentCandidate.experience}</p>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentCandidate.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Job Match Info */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Match</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <p className="font-medium text-gray-900">{jobDetails.role}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium text-gray-900">{jobDetails.employment_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Salary:</span>
                      <p className="font-medium text-gray-900">{jobDetails.salary_range}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium text-gray-900">{jobDetails.suburb_city}, {jobDetails.state}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl py-4 text-lg border-2 border-gray-300 hover:border-gray-400"
                    onClick={handlePass}
                  >
                    Pass
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-2xl py-4 text-lg"
                    onClick={handleLike}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Like
                  </Button>
                </div>

                {/* Match Counter */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    Candidate {currentCandidateIndex + 1} of {mockCandidates.length}
                  </p>
                </div>
              </div>
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobMatchPreview;