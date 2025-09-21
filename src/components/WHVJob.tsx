import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, DollarSign, Users, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface JobData {
  job_id: number;
  description: string;
  employment_type: string;
  salary_range: string;
  start_date: string;
  state: string;
  suburb_city: string;
  postcode: string;
  job_status: string;
  req_experience: string;
  role: string;
  employer: {
    company_name: string;
    given_name: string;
    family_name: string;
    user_id: string;
    profile_photo?: string;
  };
}

const WHVJob = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        const { data, error } = await supabase
          .from('job')
          .select(`
            job_id,
            description,
            employment_type,
            salary_range,
            start_date,
            state,
            suburb_city,
            postcode,
            job_status,
            req_experience,
            user_id,
            industry_role_id,
            industry_role!inner(role),
            employer:user_id(
              company_name,
              given_name,
              family_name,
              user_id,
              profile_photo
            )
          `)
          .eq('job_id', parseInt(jobId))
          .eq('job_status', 'active')
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          return;
        }

        if (data) {
          setJob({
            ...data,
            role: data.industry_role.role,
            employer: data.employer
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const handleBack = () => {
    navigate('/whv/browse-jobs');
  };

  const handleViewEmployer = () => {
    if (job?.employer?.user_id) {
      navigate(`/whv/employer-profile/${job.employer.user_id}`);
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'casual':
        return 'bg-yellow-100 text-yellow-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job not found</h2>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
          <div className="bg-white rounded-[2.5rem] overflow-hidden h-[640px] relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
            
            <div className="pt-8 pb-6 px-6 h-full overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Job Details</h1>
                <div className="w-8"></div>
              </div>

              {/* Company Info */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{job.employer.company_name}</h2>
                      <p className="text-sm text-gray-600">
                        {job.employer.given_name} {job.employer.family_name}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleViewEmployer}
                    className="w-full"
                  >
                    View Employer Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Job Title & Type */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.role}</h2>
                <Badge className={getJobTypeColor(job.employment_type)}>
                  {job.employment_type}
                </Badge>
              </div>

              {/* Job Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{job.suburb_city}, {job.state} {job.postcode}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>Start: {new Date(job.start_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <DollarSign className="w-5 h-5" />
                  <span>{job.salary_range}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span>Experience: {job.req_experience}</span>
                </div>
              </div>

              {/* Job Description */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVJob;