import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeConfirmationModalProps {
  candidateName?: string;    // For candidate/employer names
  jobTitle?: string;         // For job titles  
  companyName?: string;      // For company names
  onClose: () => void;
  isVisible: boolean;
}

const LikeConfirmationModal: React.FC<LikeConfirmationModalProps> = ({ 
  candidateName,
  jobTitle, 
  companyName, 
  onClose, 
  isVisible 
}) => {
  if (!isVisible) return null;

  const displayText = candidateName 
    ? candidateName
    : `${jobTitle} at ${companyName}`;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 rounded-[48px]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs mx-auto shadow-xl">
        {/* Heart Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-orange-500 fill-orange-500" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-900 font-medium leading-relaxed">
            You hearted <span className="font-semibold">{displayText}</span>!
          </p>
          <p className="text-gray-600 text-sm mt-2">
            The employer will be notified. If they heart you back, you’ll unlock
            full connection.
          </p>
        </div>

        {/* Got It Button */}
        <Button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium"
        >
          Got It
        </Button>
      </div>
    </div>
  );
};

export default LikeConfirmationModal;
