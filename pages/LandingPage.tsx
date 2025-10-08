import React from 'react';
import { Link } from 'react-router-dom';
import LogoIcon from '../components/icons/LogoIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-gray flex flex-col justify-center items-center p-4">
      <div className="text-center">
        <div className="mx-auto h-16 w-auto text-brand-blue flex justify-center items-center space-x-3">
          <LogoIcon className="h-14 w-14" />
          <span className="text-5xl font-bold">SiteSafe</span>
        </div>
        <p className="mt-4 text-lg text-gray-600">
          Digitizing Toolbox Talks for Safer Construction Sites.
        </p>
      </div>

      <div className="mt-12 w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold text-gray-800">
          Who are you?
        </h2>
        <div className="mt-6 space-y-4">
          <Link
            to="/login"
            className="group flex items-center justify-between w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-brand-blue hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-bold text-lg text-gray-900">Owner / Manager</h3>
              <p className="text-sm text-gray-600">Access the compliance dashboard.</p>
            </div>
            <ChevronRightIcon className="h-6 w-6 text-gray-400 group-hover:text-brand-blue transition-colors" />
          </Link>

          <Link
            to="/foreman/login"
            className="group flex items-center justify-between w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-brand-blue hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-bold text-lg text-gray-900">Foreman</h3>
              <p className="text-sm text-gray-600">Conduct a new toolbox talk.</p>
            </div>
             <ChevronRightIcon className="h-6 w-6 text-gray-400 group-hover:text-brand-blue transition-colors" />
          </Link>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand-blue hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
