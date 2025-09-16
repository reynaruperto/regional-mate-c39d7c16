import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Users, Heart, MessageCircle, User } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on an employer or WHV page to show appropriate navigation
  const isEmployerPage = location.pathname.includes('/employer') || 
                         location.pathname === '/post-jobs' || 
                         location.pathname === '/browse-candidates' ||
                         location.pathname.startsWith('/employer');
  
  const employerNavItems = [
    { id: 'profile', label: 'Profile', icon: User, path: '/employer/dashboard' },
    { id: 'post-jobs', label: 'Post Jobs', icon: Briefcase, path: '/post-jobs' },
    { id: 'browse', label: 'Browse Candidates', icon: Users, path: '/browse-candidates' },
    { id: 'matches', label: 'Matches', icon: Heart, path: '/employer/matches' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/employer/messages' },
  ];

  const whvNavItems = [
    { id: 'profile', label: 'Profile', icon: User, path: '/whv/dashboard' },
    { id: 'browse', label: 'Browse Employers', icon: Briefcase, path: '/whv/browse-employers' },
    { id: 'matches', label: 'Matches', icon: Heart, path: '/whv/matches' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/whv/messages' },
  ];

  const navItems = isEmployerPage ? employerNavItems : whvNavItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="py-2 border-t border-gray-200 bg-white rounded-b-[48px]">
      <div className="flex h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center transition-colors rounded-lg ${
                active
                  ? isEmployerPage
                    ? 'bg-[#1E293B]/10 text-[#1E293B]'
                    : 'bg-orange-500/10 text-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
