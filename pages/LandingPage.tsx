import React from 'react';
import { Link } from 'react-router-dom';
import LogoIcon from '../components/icons/LogoIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import ThemeToggle from '../components/ThemeToggle';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-gray dark:bg-gray-900 flex flex-col justify-center items-center p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <div className="mx-auto h-16 w-auto text-brand-blue dark:text-blue-400 flex justify-center items-center space-x-3">
          <LogoIcon className="h-14 w-14" />
          <span className="text-5xl font-bold text-gray-900 dark:text-white">SiteSafe</span>
        </div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Digitizing Toolbox Talks for Safer Construction Sites.
        </p>
      </div>

      <div className="mt-12 w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold text-gray-800 dark:text-white">
          Who are you?
        </h2>
        <div className="mt-6 space-y-4">
          <Link
            to="/login"
            className="group flex items-center justify-between w-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:border-brand-blue dark:hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Owner / Manager</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Access the compliance dashboard.</p>
            </div>
            <ChevronRightIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 group-hover:text-brand-blue dark:group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            to="/foreman/login"
            className="group flex items-center justify-between w-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:border-brand-blue dark:hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Foreman</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conduct a new toolbox talk.</p>
            </div>
             <ChevronRightIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 group-hover:text-brand-blue dark:group-hover:text-blue-400 transition-colors" />
          </Link>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand-blue dark:text-blue-400 hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;