import WHVProfileSetup from '@/components/WHVProfileSetup';

const WHVProfileSetupPage = () => {
  // Placeholder props - these should come from routing/context in a real app
  const userId = "placeholder-user-id";
  const visaType = "417";
  const visaStage = "1";
  
  return <WHVProfileSetup userId={userId} visaType={visaType} visaStage={visaStage} />;
};

export default WHVProfileSetupPage;