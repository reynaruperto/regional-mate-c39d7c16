import { useParams } from 'react-router-dom';
import ShortCandidateProfileCard from '@/components/ShortCandidateProfileCard';

const ShortCandidateProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  
  return <ShortCandidateProfileCard candidateId={id || '1'} />;
};

export default ShortCandidateProfilePage;