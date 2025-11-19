
import React from 'react';
import LogoIcon from './icons/LogoIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import { usePWAInstall } from '../hooks/usePWAInstall';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  userEmail?: string;
  onLogout: () => void;
  onFeedbackClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onLogout, onFeedbackClick }) => {
  const { isInstallable, installApp } = usePWAInstall();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">SiteSafe</span>
          </div>
          <div className="flex items-center space-x-4">
            {userEmail && (
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                Welcome, <span className="font-medium text-gray-800 dark:text-gray-100">{userEmail}</span>
              </span>
            )}
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
            <button
              onClick={onFeedbackClick}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 transition-colors"
            >
              Feedback
            </button>
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;