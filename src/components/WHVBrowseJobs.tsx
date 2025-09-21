import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNavigation from '@/components/BottomNavigation';
import WHVFilterPage from '@/components/WHVFilterPage';
import LikeConfirmationModal from '@/components/LikeConfirmationModal';

interface Job {
  id: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  startDate: string;
  logo: string;
}

const WHVBrowseJobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedJobTitle, setLikedJobTitle] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([
    { label: 'Industry: Agriculture', value: 'agriculture' },
    { label: 'Start Date: Sep-Dec', value: 'sep-dec' }
  ]);

  // Mock job data
  const jobs: Job[] = [
    {
      id: '1',
      title: 'Fruit Picker',
      company: 'Kangafarm',
      industry: 'Agriculture & Farming',
      location: 'Clontarf, QLD, 4017',
      startDate: 'Sep 2025',
      logo: '/lovable-uploads/b18ec59d-46ed-4c8c-95cb-65e60d9aea25.png'
    },
    {
      id: '2',
      title: 'Farm Supervisor',
      company: 'Sunny Wines',
      industry: 'Wine Production',
      location: 'Sunshine Coast, 4551',
      startDate: 'Oct 2025',
      logo: '/lovable-uploads/07a3f593-64d9-4f5c-871d-4d9114963942.png'
    },
    {
      id: '3',
      title: 'Dairy Farm Assistant',
      company: 'Oakridge Farm',
      industry: 'Agriculture & Farming',
      location: 'Toowoomba, 4350',
      startDate: 'Oct 2025',
      logo: '/lovable-uploads/5672fb16-6ddf-42ed-bddd-ea2395f6b999.png'
    }
  ];

  const removeFilter = (filterValue: string) => {
    setSelectedFilters(selectedFilters.filter(f => f.value !== filterValue));
  };

  const handleLikeJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setLikedJobTitle(job.title);
      setShowLikeModal(true);
    }
  };

  const handleCloseLikeModal = () => {
    setShowLikeModal(false);
    setLikedJobTitle('');
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applied filters:', filters);
  };

  if (showFilters) {
    return <WHVFilterPage onClose={() => setShowFilters(false)} onApplyFilters={handleApplyFilters} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* iPhone 16 Pro Max Frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0"></div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigate('/whv/dashboard')}>
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Browse Jobs</h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Browse for jobs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-10 rounded-xl border-gray-200 bg-white"
              />
              <button 
                onClick={() => setShowFilters(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedFilters.map((filter) => (
                <div
                  key={filter.value}
                  className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                >
                  <span className="text-xs text-gray-700">{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.value)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Jobs List */}
            <div className="space-y-4 pb-20">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">{job.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">{job.company}</p>
                      <p className="text-sm text-gray-600 mb-1">{job.industry}</p>
                      <p className="text-sm text-gray-600 mb-1">{job.location}</p>
                      <p className="text-sm text-gray-600">Start: {job.startDate}</p>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={() => navigate(`/whv/job/${job.id}`)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl"
                        >
                          View Job
                        </Button>
                        <button
                          onClick={() => handleLikeJob(job.id)}
                          className="h-11 w-11 flex-shrink-0 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all duration-200 shadow-sm"
                        >
                          <Heart size={18} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t flex-shrink-0 rounded-b-[48px]">
            <BottomNavigation />
          </div>

          {/* Like Confirmation Modal */}
          <LikeConfirmationModal
            candidateName={likedJobTitle}
            onClose={handleCloseLikeModal}
            isVisible={showLikeModal}
          />
        </div>
      </div>
    </div>
  );
};

export default WHVBrowseJobs;
