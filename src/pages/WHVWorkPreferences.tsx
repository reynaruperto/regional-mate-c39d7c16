import React from 'react';
import WHVWorkPreferences from '@/components/WHVWorkPreferences';

const WHVWorkPreferencesPage = () => {
  // These would typically come from routing params or context
  const visaType = "417"; // placeholder
  const visaStage = "1"; // placeholder
  const userId = "placeholder-user-id"; // placeholder
  
  return (
    <WHVWorkPreferences 
      visaType={visaType}
      visaStage={visaStage} 
      userId={userId}
    />
  );
};

export default WHVWorkPreferencesPage;