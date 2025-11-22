import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import SearchIcon from '../../components/icons/SearchIcon';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import UserGroupIcon from '../../components/icons/UserGroupIcon';

const MyCrewPage: React.FC = () => {
  const { logout } = useAuth();
  const { crewMembers, loading } = useCrewMembers();
  const [searchTerm, setSearchTerm] = useState('');

  const activeCrew = useMemo(() => {
    return crewMembers
      .filter(member => member.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [crewMembers]);

  const filteredCrew = useMemo(() => {
    return activeCrew.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeCrew]);

  return (
    <div className="bg-brand-gray min-h-screen">
      <ForemanHeader onLogout={logout} showBackButton backPath="/foreman/dashboard" />
      
      <main>
        <div className="max-w-md mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Crew Roster</h1>
          <p className="mt-1 text-gray-600">A view-only list of all active crew members. Contact a manager to make changes.</p>
          
          <div className="mt-6 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search crew members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-gray-900"
              style={{ colorScheme: 'light' }}
              disabled={loading}
            />
          </div>

          <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
             {loading ? (
                <div className="flex justify-center items-center py-20">
                    <SpinnerIcon className="h-8 w-8 text-brand-blue" />
                </div>
             ) : (
                <ul className="divide-y divide-gray-200">
                {filteredCrew.length > 0 ? (
                    filteredCrew.map(member => (
                    <li key={member.id} className="p-4">
                        <span className="font-medium text-gray-800">{member.name}</span>
                    </li>
                    ))
                ) : (
                    <li className="p-10 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                            <UserGroupIcon className="h-12 w-12 text-gray-300 mb-2" />
                            <h3 className="font-semibold text-gray-700">No Crew Members Found</h3>
                            <p className="text-sm mt-1">{searchTerm ? "Try adjusting your search." : "There are no active crew members in the roster."}</p>
                        </div>
                    </li>
                )}
                </ul>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyCrewPage;
