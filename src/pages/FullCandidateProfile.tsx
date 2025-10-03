import { useParams } from 'react-router-dom';
import EMPCandidateFull from '@/components/EMPCandidateFull';

const FullCandidateProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  
  return <EMPCandidateFull candidateId={id || '1'} />;
};

export default FullCandidateProfilePage;