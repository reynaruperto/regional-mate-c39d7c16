import EmployerMatches from '@/components/EmployerMatches';
import { useParams } from 'react-router-dom';

const EmployerMatchesPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  
  return <EmployerMatches jobId={Number(jobId)} />;
};

export default EmployerMatchesPage;