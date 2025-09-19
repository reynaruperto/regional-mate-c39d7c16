import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeConfirmationModalProps {
  candidateName: string;
  onClose: () => void;
  isVisible: boolean;
}

const LikeConfirmationModal: React.FC<LikeConfirmationModalProps> = ({ 
  candidateName, 
  onClose, 
  isVisible 
}) => {
  if (!isVisible) return null;

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
            You hearted {candidateName}
            {"'"}s profile! They{"'"}ll be notified, and if they heart you back, you{"'"}ll unlock full profile access.
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
