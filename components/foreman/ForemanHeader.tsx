
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '../icons/LogoIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import ThemeToggle from '../ThemeToggle';

interface ForemanHeaderProps {
  userEmail?: string;
  onLogout: () => void;
  showBackButton?: boolean;
  backPath?: string;
}

const ForemanHeader: React.FC<ForemanHeaderProps> = ({ onLogout, showBackButton = false, backPath }) => {
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWAInstall();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            {showBackButton ? (
              <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <ChevronLeftIcon className="h-6 w-6" />
                <span className="sr-only">Back</span>
              </button>
            ) : (
              <LogoIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            )}
            <span className="text-xl font-bold text-gray-800 dark:text-white">SiteSafe</span>
          </div>
          <div className="flex items-center space-x-3">
             {isInstallable && (
                <button
                    onClick={installApp}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
                    title="Install App"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Install</span>
                </button>
            )}
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 px-3 py-2 rounded-md transition-colors"
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