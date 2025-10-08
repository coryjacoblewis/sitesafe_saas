import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '../icons/LogoIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';

interface ForemanHeaderProps {
  userEmail?: string;
  onLogout: () => void;
  showBackButton?: boolean;
  backPath?: string;
}

const ForemanHeader: React.FC<ForemanHeaderProps> = ({ onLogout, showBackButton = false, backPath }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            {showBackButton ? (
              <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
                <ChevronLeftIcon className="h-6 w-6" />
                <span className="sr-only">Back</span>
              </button>
            ) : (
              <LogoIcon className="h-8 w-8 text-brand-blue" />
            )}
            <span className="text-xl font-bold text-gray-800">SiteSafe</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={onLogout}
              className="text-sm font-medium text-gray-600 hover:text-brand-blue px-3 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ForemanHeader;