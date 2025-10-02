import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployerFullProfile {
  id: string;
  name: string;
  employerName: string;
  description: string;
  location: string;
  industry: string;
  rolesOffered: string[];
  jobAvailability: string;
  payBenefits: string;
  facilities: string;
  profileImage: string;
  contactEmail: string;
  contactPhone: string;
  companySize: string;
  establishedYear: string;
  certifications: string[];
  workEnvironment: string;
  // Job details
  abn: string;
  jobOpenings: {
    title: string;
    status: string;
    period?: string;
  }[];
  visaAcceptance: string[];
  experienceSkills: string[];
  licenses: string[];
  salary: {
    hourlyRate: string;
    overtimeRate: string;
    inclusions: string[];
  };
  employmentType: string;
  duration: string;
  extensions: string;
}

const WHVEmployerFullProfileCard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [showLikeModal, setShowLikeModal] = useState(false);

  // Mock employer data with full details for mutual matches
  const employerProfiles: { [key: string]: EmployerFullProfile } = {
    '4': {
      id: '4',
      name: 'Green Harvest Farms',
      employerName: 'Sarah Mitchell',
      description: 'Sustainable organic farm in northern NSW, specializing in diverse crop production and eco-friendly farming practices. We offer hands-on experience in modern sustainable agriculture with opportunities for skill development and organic certification training.',
      location: 'Northrivers, NSW 2470',
      industry: 'Agriculture & Farming',
      rolesOffered: ['Farm Assistant', 'Organic Crop Technician', 'Equipment Operator', 'Quality Control Inspector'],
      jobAvailability: 'Available from Aug 2025 - March 2026',
      payBenefits: '$29/hour + super + organic produce allowance + overtime rates',
      facilities: 'Shared accommodation on-farm, Meals provided, Equipment training, Transport to town weekly',
      profileImage: '/lovable-uploads/a8da007e-b9f6-4996-9a54-c5cb294d1f4f.png',
      contactEmail: 'sarah@greenharvest.com.au',
      contactPhone: '+61 2 6687 5432',
      companySize: '25-40 employees',
      establishedYear: '2010',
      certifications: ['Organic Certification Australia', 'Sustainable Agriculture Initiative', 'Fair Work Standards'],
      workEnvironment: 'Outdoor sustainable farming in beautiful northern NSW. Modern equipment and techniques with focus on environmental responsibility and worker wellbeing.',
      abn: '22 333 444 555',
      jobOpenings: [
        { title: 'Farm Assistant', status: 'Current Opening' },
        { title: 'Seasonal Harvest Workers', status: 'September-December', period: 'September-December' },
        { title: 'Packing & Sorting Operators', status: 'Available' }
      ],
      visaAcceptance: ['WHV (subclass 417 & 462) accepted'],
      experienceSkills: [
        'Prior farm or outdoor work (preferred, not required)',
        'Physically fit for manual labor',
        'Team-oriented, punctual, safety-conscious'
      ],
      licenses: ['Forklift License (advantage)', 'Drivers License (advantage)'],
      salary: {
        hourlyRate: 'AUD $28.26 (per Fair Work casual rate, Agriculture Award)',
        overtimeRate: 'Overtime & Penalty Rates: Paid as per Fair Work standards',
        inclusions: [
          'Accommodation available on-site at discounted rates',
          'Weekly transport to town provided',
          'Farm safety training included',
          'Eligible work for 2nd & 3rd year WHV extension'
        ]
      },
      employmentType: 'Seasonal, Full-time (6 months)',
      duration: 'Extensions possible based on performance and farm needs',
      extensions: 'Extensions possible based on performance and farm needs'
    },
    '5': {
      id: '5',
      name: 'Coastal Breeze Resort',
      employerName: 'Marcus Thompson',
      description: 'Premier beachfront resort on the Gold Coast offering exceptional hospitality experiences. We provide comprehensive training in hospitality service excellence and career development opportunities in a luxury tourism environment.',
      location: 'Coolangatta, QLD 4225',
      industry: 'Hospitality and Tourism',
      rolesOffered: ['Barista', 'Front Desk Associate', 'Housekeeping Supervisor', 'Food Service Attendant', 'Event Coordinator'],
      jobAvailability: 'Available from Sep 2025 - May 2026',
      payBenefits: '$27/hour + super + tips + staff discounts + performance bonuses',
      facilities: 'Staff accommodation available, Meal allowances, Staff gym access, Professional development programs',
      profileImage: '/lovable-uploads/dde1f5c0-2bba-4180-ab2c-b05bcb7b7def.png',
      contactEmail: 'marcus@coastalbreeze.com.au',
      contactPhone: '+61 7 5536 8901',
      companySize: '80-120 employees',
      establishedYear: '2005',
      certifications: ['Tourism Industry Council', 'Hospitality Excellence Award', 'Green Tourism Certification'],
      workEnvironment: 'Dynamic beachfront resort environment with international guests. Modern facilities and professional team culture focused on service excellence.',
      abn: '33 444 555 666',
      jobOpenings: [
        { title: 'Barista', status: 'Current Opening' },
        { title: 'Front Desk Associate', status: 'Available' },
        { title: 'Housekeeping Supervisor', status: 'Current Opening' }
      ],
      visaAcceptance: ['WHV (subclass 417 & 462) accepted'],
      experienceSkills: [
        'Hospitality experience preferred',
        'Excellent English communication',
        'Customer service focused',
        'Professional presentation'
      ],
      licenses: ['RSA Certificate (Required)', 'Food Safety Certificate (advantage)'],
      salary: {
        hourlyRate: 'AUD $27.50 (per Hospitality Award)',
        overtimeRate: 'Penalty rates apply for weekends and public holidays',
        inclusions: [
          'Staff accommodation available',
          'Meal allowances during shifts',
          'Staff gym and facilities access',
          'Professional development programs'
        ]
      },
      employmentType: 'Full-time, Permanent',
      duration: 'Minimum 6 months commitment',
      extensions: 'Career progression opportunities available'
    },
    '6': {
      id: '6',
      name: 'Gotall Estates',
      employerName: 'Robert Williams',
      description: 'Family-owned dairy farm operation on the Sunshine Coast, combining traditional farming values with modern dairy technology. We offer comprehensive dairy farming experience with opportunities to learn cutting-edge agricultural techniques.',
      location: 'Sunshine Coast, QLD 4019',
      industry: 'Dairy Farm',
      rolesOffered: ['Farm Maintenance', 'Dairy Hand', 'Livestock Technician', 'Equipment Operator', 'Quality Assurance'],
      jobAvailability: 'Available from Oct 2025 - September 2026',
      payBenefits: '$30/hour + super + dairy products allowance + skill development bonuses',
      facilities: 'On-site cottage accommodation, Meals included, Equipment certification training, Transport provided',
      profileImage: '/lovable-uploads/3961a45e-fda8-48f4-97cc-a5573079e6ac.png',
      contactEmail: 'robert@gotallestates.com.au',
      contactPhone: '+61 7 5494 7234',
      companySize: '12-18 employees',
      establishedYear: '1987',
      certifications: ['Australian Dairy Standards', 'Animal Welfare Certification', 'Sustainable Farming Practices'],
      workEnvironment: 'Traditional dairy farm with modern equipment on beautiful Sunshine Coast. Close-knit team environment with focus on quality dairy production and animal welfare.',
      abn: '44 555 666 777',
      jobOpenings: [
        { title: 'Dairy Hand', status: 'Current Opening' },
        { title: 'Farm Maintenance', status: 'Available' },
        { title: 'Livestock Technician', status: 'Current Opening' }
      ],
      visaAcceptance: ['WHV (subclass 417 & 462) accepted'],
      experienceSkills: [
        'Farm work experience preferred',
        'Early morning availability (4:30 AM starts)',
        'Animal handling experience (advantage)',
        'Mechanical aptitude helpful'
      ],
      licenses: ['Drivers License (Required)', 'Chemical Handling Certificate (provided)'],
      salary: {
        hourlyRate: 'AUD $30.15 (per Pastoral Award)',
        overtimeRate: 'Overtime rates apply after 38 hours per week',
        inclusions: [
          'On-site cottage accommodation',
          'Fresh dairy products included',
          'Equipment operation training',
          'Eligible for 2nd year visa extension'
        ]
      },
      employmentType: 'Full-time, Ongoing',
      duration: '12 months minimum commitment',
      extensions: 'Long-term opportunities for suitable candidates'
    }
  };

  const employer = employerProfiles[id || '1'];

  const handleViewJobs = () => {
    navigate(`/whv/employer/jobs/${id}?from=whv-full-profile&tab=matches`);
  };

  const handleBackNavigation = () => {
    const fromPage = searchParams.get('from');
    const tab = searchParams.get('tab');
    
    if (fromPage === 'whv-matches') {
      navigate(`/whv/matches?tab=${tab || 'matches'}`);
    } else {
      navigate('/whv/matches?tab=matches');
    }
  };

  if (!employer) {
    return <div>Employer not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* iPhone 16 Pro Max Frame */}
      <div className="w-[430px] h-[932px] bg-black rounded-[60px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Dynamic Island - Fixed */}
          <div className="w-32 h-6 bg-black rounded-full mx-auto mt-2 mb-4 flex-shrink-0 sticky top-2 z-10"></div>
          
          {/* Header - Fixed */}
          <div className="px-4 py-3 flex-shrink-0 sticky top-8 z-10 bg-white border-b">
            <button onClick={handleBackNavigation}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            
            {/* Profile Card */}
            <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-lg">
              
              {/* Match Header */}
              <div className="bg-gradient-to-r from-orange-500 to-blue-900 text-white text-center py-4 rounded-2xl mb-6">
                <h2 className="text-xl font-bold">🎉 IT'S A MATCH! 🎉</h2>
                <p className="text-sm mt-1">with {employer.name.toUpperCase()}</p>
              </div>

              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden">
                  <img 
                    src={employer.profileImage}
                    alt={employer.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Quote/Description */}
              <div className="text-center mb-6 bg-gray-50 rounded-2xl p-4">
                <p className="text-gray-700 text-sm italic leading-relaxed">
                  {employer.description}
                </p>
              </div>

              {/* Key Details */}
              <div className="space-y-3 text-sm mb-6">
                <div><span className="font-semibold">ABN:</span> {employer.abn}</div>
                <div><span className="font-semibold">Location:</span> {employer.location}</div>
                <div><span className="font-semibold">Industry:</span> {employer.industry}</div>
                <div><span className="font-semibold">Company Size:</span> {employer.companySize}</div>
                <div><span className="font-semibold">Established:</span> {employer.establishedYear}</div>
                <div><span className="font-semibold">Roles Offered:</span> {employer.rolesOffered.join(', ')}</div>
                <div><span className="font-semibold">Job Availability:</span> {employer.jobAvailability}</div>
                <div><span className="font-semibold">Pay & Benefits:</span> {employer.payBenefits}</div>
                <div><span className="font-semibold">Facilities:</span> {employer.facilities}</div>
                <div><span className="font-semibold">Certifications:</span> {employer.certifications.join(', ')}</div>
                <div><span className="font-semibold">Work Environment:</span> {employer.workEnvironment}</div>
              </div>

              {/* Contact Information - Available because it's a match */}
              <div className="bg-gradient-to-r from-orange-500 to-blue-900 text-white rounded-2xl p-6 text-center">
                <h3 className="font-bold text-lg mb-3">🎉 Contact Details Unlocked! 🎉</h3>
                <div className="space-y-2">
                  <div className="bg-white/20 rounded-xl p-3">
                    <div className="font-semibold">Email:</div>
                    <div className="text-lg">{employer.contactEmail}</div>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3">
                    <div className="font-semibold">Phone:</div>
                    <div className="text-lg">{employer.contactPhone}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/90">
                  You can now contact {employer.name} directly!
                </p>
              </div>

              {/* View Jobs Button */}
              <div className="mt-6">
                <button
                  onClick={handleViewJobs}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-12 flex items-center justify-center gap-2 font-medium"
                >
                  View Available Jobs
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WHVEmployerFullProfileCard;