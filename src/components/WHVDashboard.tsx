import React, { useState, useEffect } from 'react';
import { Edit, FileText, Shield, Bell, Lock, HelpCircle, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileTagline, setProfileTagline] = useState<string>('');
  const [fullName, setFullName] = useState<string>('User');

  useEffect(() => {
    const fetchWHVProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("Auth user id:", user?.id);

      if (userError || !user) {
        navigate('/sign-in');
        return;
      }

      // Step 1: Get profile row using auth.user.id
      const { data: profileRow, error: profileError } = await supabase
        .from('profile')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileRow) {
        console.error('No profile row found:', profileError);
        return;
      }

      console.log("Matched profile row:", profileRow);

      // Step 2: Use profile.user_id to fetch WHV data
      const { data: whv, error } = await supabase
        .from('whv_maker')
        .select('given_name, middle_name, family_name, tagline, profile_photo')
        .eq('user_id', profileRow.user_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching WHV profile:', error);
        return;
      }

      console.log("Fetched WHV data:", whv);

      if (whv) {
        const nameParts = [whv.given_name, whv.middle_name, whv.family_name].filter(Boolean);
        setFullName(nameParts.join(' '));
        setProfileTagline(whv.tagline || '');
        setProfilePhoto(whv.profile_photo || null);
      }
    };

    fetchWHVProfile();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      {/* same JSX as Case A … */}
      {/* I left it out here since only the fetch logic differs */}
    </div>
  );
};

export default Dashboard;
