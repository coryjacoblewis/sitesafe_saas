import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTalkRecords } from '../../hooks/useTalkRecords';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import PlusIcon from '../../components/icons/PlusIcon';
import Pagination from '../../components/Pagination';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import SearchIcon from '../../components/icons/SearchIcon';

type SortDirection = 'ascending' | 'descending';
type SortableKey = 'dateTime' | 'topic' | 'location' | 'crewSize' | 'syncStatus';

interface SortConfig {
  key: SortableKey;
  direction: SortDirection;
}


const ForemanDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { records, loading } = useTalkRecords();
  const navigate = useNavigate();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateTime', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const foremanTalks = useMemo(() => {
    if (!user) return [];
    // In a real app with user-specific data, this filter might be redundant if the hook only fetches user's data.
    // For this demo, we filter all records to find those matching the logged-in foreman.
    // The mock data uses 'Frank Miller' and 'Sarah Chen' etc, but login uses email. We'll simulate by checking both.
    const foremanEmails = ['Frank Miller', 'Sarah Chen', 'David Kim'];
    const isMockForeman = foremanEmails.some(name => user.email.startsWith(name.split(' ')[0].toLowerCase()));

    if(isMockForeman) {
      return records.filter(record => record.foremanName.startsWith(user.email.split('@')[0]));
    }
    
    // Default filter for newly created users
    return records.filter(record => record.foremanName === user.email);

  }, [records, user]);
  
  const requestSort = (key: SortableKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig?.key === key && sortConfig?.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecords = useMemo(() => {
    const sortableRecords = [...foremanTalks];
    if (sortConfig) {
      sortableRecords.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortConfig.key) {
          case 'crewSize':
            aValue = a.crewSignatures.length;
            bValue = b.crewSignatures.length;
            break;
          case 'dateTime':
             aValue = new Date(a.dateTime).getTime();
             bValue = new Date(b.dateTime).getTime();
             break;
          case 'syncStatus':
            aValue = a.syncStatus || 'synced';
            bValue = b.syncStatus || 'synced';
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        
        const compareResult = () => {
             if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
             }
             if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue);
             }
             return 0;
        }

        return sortConfig.direction === 'ascending' ? compareResult() : -compareResult();
      });
    }

    return sortableRecords;
  }, [foremanTalks, sortConfig]);

  const totalItems = sortedRecords.length;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);
  
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
  };

  const SortableHeader = ({ columnKey, title }: { columnKey: SortableKey, title: string }) => (
     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        <button onClick={() => requestSort(columnKey)} className="w-full text-left focus:outline-none group">
          <span className="group-hover:text-gray-800 group-hover:underline transition-colors">{title}</span>
        </button>
     </th>
  )

  return (
    <div className="min-h-screen bg-brand-gray">
      <ForemanHeader userEmail={user?.email} onLogout={logout} />
      <main className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome, {user?.email ? user.email.split('@')[0] : 'Foreman'}
                    </h1>
                    <p className="mt-1 text-gray-600">Ready to start your next safety talk?</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => navigate('/foreman/select-talk')}
                        className="w-full sm:w-auto flex items-center justify-center space-x-3 text-lg font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark rounded-lg shadow-md px-6 py-3 transition-transform transform hover:scale-105"
                    >
                        <PlusIcon className="h-6 w-6" />
                        <span>Start New Talk</span>
                    </button>
                </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">My Talks</h2>
              <div className="shadow border-b border-gray-200 sm:rounded-lg bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                        <tr>
                            <SortableHeader columnKey="dateTime" title="Date & Time" />
                            <SortableHeader columnKey="topic" title="Topic" />
                            <SortableHeader columnKey="location" title="Location" />
                            <SortableHeader columnKey="crewSize" title="Crew Size" />
                            <SortableHeader columnKey="syncStatus" title="Status" />
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">View Details</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                            <td colSpan={6} className="text-center py-16">
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                <SpinnerIcon className="w-8 h-8 mb-2 text-brand-blue" />
                                <p className="text-sm">Loading Talks...</p>
                                </div>
                            </td>
                            </tr>
                        ) : paginatedRecords.length > 0 ? (
                            paginatedRecords.map((talk) => (
                            <tr key={talk.id} onClick={() => navigate(`/foreman/talk-details/${talk.id}`)} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(talk.dateTime)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{talk.topic}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{talk.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{talk.crewSignatures.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {talk.syncStatus === 'pending' ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Pending Sync
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Synced
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span className="text-brand-blue hover:text-brand-blue-dark">View</span>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-16">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <SearchIcon className="w-12 h-12 mb-2 text-gray-400" />
                                        <h3 className="text-lg font-semibold text-gray-700">No Talks Found</h3>
                                        <p className="text-sm">Your completed talks will appear here.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalItems / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={totalItems}
                />
              </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ForemanDashboardPage;
