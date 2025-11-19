
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTalkRecords } from '../../hooks/useTalkRecords';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import PlusIcon from '../../components/icons/PlusIcon';
import Pagination from '../../components/Pagination';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import ClipboardListIcon from '../../components/icons/ClipboardListIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import UserGroupIcon from '../../components/icons/UserGroupIcon';
import ArrowUpIcon from '../../components/icons/ArrowUpIcon';
import ArrowDownIcon from '../../components/icons/ArrowDownIcon';
import CloudCheckIcon from '../../components/icons/CloudCheckIcon';
import CloudArrowUpIcon from '../../components/icons/CloudArrowUpIcon';
import { CrewSignature } from '../../types';

type SortDirection = 'ascending' | 'descending';
type SortableKey = 'dateTime' | 'topic' | 'location' | 'crewSize' | 'syncStatus' | 'recordStatus';

interface SortConfig {
  key: SortableKey;
  direction: SortDirection;
}

interface TalkDraft {
  topics: string[];
  location: string;
  crew: CrewSignature[];
}

const DRAFT_KEY = 'siteSafeDraftTalk';

const SortableHeader: React.FC<{ 
  columnKey: SortableKey, 
  title: string, 
  sortConfig: SortConfig | null, 
  onRequestSort: (key: SortableKey) => void 
}> = ({ columnKey, title, sortConfig, onRequestSort }) => {
  const isSorted = sortConfig?.key === columnKey;
  const direction = sortConfig?.direction;
  
  return (
     <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer group" onClick={() => onRequestSort(columnKey)}>
         <div className="flex items-center space-x-1">
             <span className="group-hover:text-gray-800 dark:group-hover:text-gray-300 group-hover:underline transition-colors">{title}</span>
             {isSorted && (
                 direction === 'ascending' 
                 ? <ArrowUpIcon className="h-4 w-4 text-brand-blue dark:text-blue-400" /> 
                 : <ArrowDownIcon className="h-4 w-4 text-brand-blue dark:text-blue-400" />
             )}
         </div>
     </th>
  );
};


const ForemanDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { records, loading } = useTalkRecords();
  const navigate = useNavigate();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateTime', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [draft, setDraft] = useState<TalkDraft | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse draft talk", e);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  const handleResumeDraft = () => {
    navigate('/foreman/capture-signatures', { state: { resumeDraft: true } });
  };

  const handleDiscardDraft = () => {
    setConfirmingDiscard(true);
  };

  const executeDiscard = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    setConfirmingDiscard(false);
  };

  const handleStartNewTalk = () => {
    if (draft) {
      if (window.confirm("You have an in-progress talk. Starting a new one will discard your progress. Continue?")) {
        localStorage.removeItem(DRAFT_KEY);
        setDraft(null);
        navigate('/foreman/select-talk');
      }
    } else {
      navigate('/foreman/select-talk');
    }
  };
  
  const foremanTalks = useMemo(() => {
    if (!user) return [];
    // Filter matching records. 
    // Mock data uses names (e.g., 'Frank Miller'), auth uses emails (e.g., 'frank@sitesafe.com').
    // We match if the email prefix (e.g. 'frank') is contained in the foreman name case-insensitively.
    
    const userEmailPrefix = user.email.split('@')[0].toLowerCase();
    
    // Check if any record matches this fuzzy logic. If not, we might be in a strict mode or new user.
    // For the mock data specifically:
    const mockForemen = ['Frank Miller', 'Sarah Chen', 'David Kim'];
    const matchedMockName = mockForemen.find(name => name.toLowerCase().includes(userEmailPrefix));

    if (matchedMockName) {
         return records.filter(record => record.foremanName === matchedMockName);
    }
    
    // Default: Exact match (for new records created by this user) or fuzzy match on email prefix
    return records.filter(record => {
        return record.foremanName === user.email || 
               record.foremanName.toLowerCase().includes(userEmailPrefix);
    });

  }, [records, user]);

  const flaggedTalksCount = useMemo(() => foremanTalks.filter(t => t.recordStatus === 'flagged').length, [foremanTalks]);
  
  const requestSort = (key: SortableKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig?.key === key && sortConfig?.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecords = useMemo(() => {
    const sortableRecords = [...foremanTalks];
    // Always show flagged talks at the top
    sortableRecords.sort((a, b) => {
      if (a.recordStatus === 'flagged' && b.recordStatus !== 'flagged') return -1;
      if (a.recordStatus !== 'flagged' && b.recordStatus === 'flagged') return 1;
      return 0;
    });

    if (sortConfig) {
      sortableRecords.sort((a, b) => {
        // Keep flagged talks at the top regardless of other sorting
        if (a.recordStatus === 'flagged' && b.recordStatus !== 'flagged') return -1;
        if (a.recordStatus !== 'flagged' && b.recordStatus === 'flagged') return 1;

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
          case 'recordStatus':
             aValue = a.recordStatus;
             bValue = b.recordStatus;
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

  return (
    <div className="min-h-screen bg-brand-gray dark:bg-gray-900 transition-colors duration-200">
      <ForemanHeader userEmail={user?.email} onLogout={logout} />
      <main className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome, {user?.email ? user.email.split('@')[0] : 'Foreman'}
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Ready to start your next safety talk?</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                    <button
                        onClick={() => navigate('/foreman/my-crew')}
                        className="flex items-center justify-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm px-4 py-3 transition-colors"
                    >
                        <UserGroupIcon className="h-5 w-5" />
                        <span>View Crew Roster</span>
                    </button>
                    <button
                        onClick={handleStartNewTalk}
                        className="flex items-center justify-center space-x-3 text-lg font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark rounded-lg shadow-md px-6 py-3 transition-transform transform hover:scale-105"
                    >
                        <PlusIcon className="h-6 w-6" />
                        <span>Start New Talk</span>
                    </button>
                </div>
            </div>

            {flaggedTalksCount > 0 && (
                 <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-6 rounded-r-lg shadow">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 dark:text-yellow-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Action Required</p>
                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                You have {flaggedTalksCount} talk record(s) that require correction. Please review them in the table below.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {draft && (
                 <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 mb-6 rounded-r-lg shadow">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 dark:text-blue-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            {confirmingDiscard ? (
                                <>
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Are you sure?</p>
                                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">This will permanently delete your in-progress talk.</p>
                                    <div className="mt-3 flex space-x-3">
                                        <button
                                            onClick={executeDiscard}
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
                                        >
                                            Yes, Discard
                                        </button>
                                        <button
                                            onClick={() => setConfirmingDiscard(false)}
                                            className="px-3 py-1.5 text-sm font-medium text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">In-Progress Talk Found</p>
                                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">You have an unsaved toolbox talk. Would you like to continue where you left off?</p>
                                    <div className="mt-3 flex space-x-3">
                                        <button
                                            onClick={handleResumeDraft}
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark"
                                        >
                                            Resume
                                        </button>
                                        <button
                                            onClick={handleDiscardDraft}
                                            className="px-3 py-1.5 text-sm font-medium text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}


            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">My Talks</h2>
              <div className="shadow border-b border-gray-200 dark:border-gray-700 sm:rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <SortableHeader columnKey="dateTime" title="Date & Time" sortConfig={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader columnKey="topic" title="Topic" sortConfig={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader columnKey="location" title="Location" sortConfig={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader columnKey="crewSize" title="Crew Size" sortConfig={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader columnKey="recordStatus" title="Status" sortConfig={sortConfig} onRequestSort={requestSort} />
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">View Details</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                            <td colSpan={6} className="text-center py-16">
                                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <SpinnerIcon className="w-8 h-8 mb-2 text-brand-blue dark:text-blue-400" />
                                <p className="text-sm">Loading Talks...</p>
                                </div>
                            </td>
                            </tr>
                        ) : paginatedRecords.length > 0 ? (
                            paginatedRecords.map((talk) => (
                            <tr key={talk.id} onClick={() => navigate(`/foreman/talk-details/${talk.id}`)} className={`${talk.recordStatus === 'flagged' ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-150 ease-in-out cursor-pointer`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDateTime(talk.dateTime)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{talk.topic}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{talk.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">{talk.crewSignatures.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {talk.syncStatus === 'pending' ? (
                                        <div className="flex items-center text-amber-600 dark:text-amber-400" title="Saved locally, waiting to sync">
                                            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                                            <span className="font-medium">Saved Locally</span>
                                        </div>
                                    ) : talk.recordStatus === 'flagged' ? (
                                        <div className="flex items-center text-yellow-700 dark:text-yellow-400" title="Correction Needed">
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                            <span className="font-medium">Action Required</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-green-700 dark:text-green-400" title="Synced to cloud">
                                            <CloudCheckIcon className="h-5 w-5 mr-2" />
                                            <span className="font-medium">Synced</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span className="text-brand-blue dark:text-blue-400 hover:text-brand-blue-dark dark:hover:text-blue-300">View</span>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-16 px-4">
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <ClipboardListIcon className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Talks Conducted Yet</h3>
                                        <p className="text-sm mt-1">Your completed talks will appear here.</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                          Tap the <span className="font-bold text-brand-blue dark:text-blue-400">'Start New Talk'</span> button to begin.
                                        </p>
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