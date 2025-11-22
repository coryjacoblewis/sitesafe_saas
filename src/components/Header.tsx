import React from 'react';
import { Link } from 'react-router-dom';
import LogoIcon from './icons/LogoIcon';

interface HeaderProps {
  userEmail?: string;
  userRole?: 'owner' | 'foreman';
  onLogout: () => void;
  onFeedbackClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, userRole, onLogout, onFeedbackClick }) => {
  const dashboardPath = userRole === 'owner' ? '/dashboard' : '/foreman/dashboard';

  return (
    <header className="bg-white shadow-sm relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={dashboardPath} className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-brand-blue" />
            <span className="text-xl font-bold text-gray-800">SiteSafe</span>
          </Link>
          <div className="flex items-center space-x-4">
            {userEmail && (
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, <span className="font-medium">{userEmail}</span>
              </span>
            )}
            <button
              onClick={onFeedbackClick}
              className="text-sm font-medium text-gray-600 hover:text-brand-blue transition-colors"
            >
              Feedback
            </button>
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