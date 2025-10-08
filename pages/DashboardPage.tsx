import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TalkRecord, FeedbackSubmission, PendingCrewMember } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTalkRecords } from '../hooks/useTalkRecords';
import { useSafetyTopics } from '../hooks/useSafetyTopics';
import { useLocations } from '../hooks/useLocations';
import { usePendingCrew } from '../hooks/usePendingCrew';
import Header from '../components/Header';
import DownloadIcon from '../components/icons/DownloadIcon';
import SearchIcon from '../components/icons/SearchIcon';
import ResetIcon from '../components/icons/ResetIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import PencilSquareIcon from '../components/icons/PencilSquareIcon';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Pagination from '../components/Pagination';
import FeedbackModal from '../components/FeedbackModal';


type SortDirection = 'ascending' | 'descending';
type SortableKey = 'dateTime' | 'topic' | 'foremanName' | 'location' | 'crewSize' | 'syncStatus';

interface SortConfig {
  key: SortableKey;
  direction: SortDirection;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; description: string }> = ({ icon, title, value, description }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-start space-x-4">
        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-brand-blue rounded-lg text-white">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);

const ListStatCard: React.FC<{ icon: React.ReactNode; title: string; items: string[]; description: string; }> = ({ icon, title, items, description }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-start space-x-4">
        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-brand-blue rounded-lg text-white">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {items.length > 0 ? (
                <ol className="mt-1 text-sm list-decimal list-inside text-gray-800 space-y-0.5">
                    {items.map((item, index) => (
                        <li key={index} className="font-semibold">
                           <span className="font-medium text-gray-600 break-words">{item}</span>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="text-2xl font-bold text-gray-900">...</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
    </div>
);


const PendingApprovals: React.FC<{
  pendingCrew: PendingCrewMember[];
  onApprove: (member: PendingCrewMember) => void;
  onReject: (member: PendingCrewMember) => void;
}> = ({ pendingCrew, onApprove, onReject }) => {
  if (pendingCrew.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-bold text-yellow-900">Pending Crew Approvals</h2>
      <p className="text-sm text-yellow-800 mt-1">
        A foreman has added the following people during a talk. Approve them to add them to the permanent crew roster.
      </p>
      <ul className="mt-4 space-y-2">
        {pendingCrew.map(member => (
          <li key={member.id} className="flex items-center justify-between p-2 bg-white rounded-md border border-yellow-200">
            <div>
              <p className="font-semibold text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-500">
                Added by {member.source.foremanEmail} on {new Date(member.source.dateAdded).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onReject(member)}
                className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-red-100 hover:text-red-700 transition-colors"
                title="Reject"
              >
                <XIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onApprove(member)}
                className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-green-100 hover:text-green-700 transition-colors"
                title="Approve"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { records, loading: recordsLoading } = useTalkRecords();
  const { safetyTopics, loading: topicsLoading } = useSafetyTopics();
  const { locations, loading: locationsLoading } = useLocations();
  const { pendingCrew, approveMember, rejectMember, loading: pendingCrewLoading } = usePendingCrew();
  
  const loading = recordsLoading || topicsLoading || locationsLoading || pendingCrewLoading;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const dashboardStats = useMemo(() => {
    if (loading || records.length === 0) {
      return {
        talksThisMonth: '...',
        signaturesThisMonth: '...',
        topTopics: [],
        topForemen: [],
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const recordsThisMonth = records.filter(r => {
        const recordDate = new Date(r.dateTime);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const signaturesThisMonth = recordsThisMonth.reduce((sum, r) => sum + r.crewSignatures.length, 0);

    const getTopThree = (key: 'topic' | 'foremanName'): string[] => {
      const counts = records.reduce((acc, record) => {
        const value = record[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
    };

    return {
        talksThisMonth: recordsThisMonth.length,
        signaturesThisMonth,
        topTopics: getTopThree('topic'),
        topForemen: getTopThree('foremanName'),
    };
  }, [records, loading]);
  
  const { uniqueTopics, uniqueForemen, uniqueLocations, uniqueCrewSizes } = useMemo(() => {
    const foremen = new Set<string>();
    const crewSizes = new Set<number>();
    records.forEach(record => {
      foremen.add(record.foremanName);
      crewSizes.add(record.crewSignatures.length);
    });
    return {
      uniqueTopics: [...safetyTopics].sort((a,b) => a.name.localeCompare(b.name)).map(t => t.name),
      uniqueForemen: Array.from(foremen).sort(),
      uniqueLocations: [...locations].sort((a,b) => a.name.localeCompare(b.name)).map(l => l.name),
      uniqueCrewSizes: Array.from(crewSizes).sort((a, b) => a - b),
    };
  }, [records, safetyTopics, locations]);

  const [filters, setFilters] = useState({
    topic: [] as string[],
    foreman: [] as string[],
    location: [] as string[],
    minCrew: '',
    maxCrew: '',
    startDate: '',
    endDate: '',
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleMultiSelectChange = useCallback((name: 'topic' | 'foreman' | 'location', values: string[]) => {
    setFilters(prev => ({ ...prev, [name]: values }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      topic: [],
      foreman: [],
      location: [],
      minCrew: '',
      maxCrew: '',
      startDate: '',
      endDate: '',
    });
  }, []);


  const requestSort = (key: SortableKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig?.key === key && sortConfig?.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredRecords = useMemo(() => {
    const recordsToFilter = [...records];

    const filtered = recordsToFilter.filter(record => {
      const crewSize = record.crewSignatures.length;
      const recordDate = new Date(record.dateTime);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      return (
        (filters.topic.length === 0 || filters.topic.includes(record.topic)) &&
        (filters.foreman.length === 0 || filters.foreman.includes(record.foremanName)) &&
        (filters.location.length === 0 || filters.location.includes(record.location)) &&
        (filters.minCrew === '' || crewSize >= Number(filters.minCrew)) &&
        (filters.maxCrew === '' || crewSize <= Number(filters.maxCrew)) &&
        (!startDate || recordDate >= startDate) &&
        (!endDate || recordDate <= endDate)
      );
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
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

    return filtered;
  }, [records, filters, sortConfig]);

  const totalItems = sortedAndFilteredRecords.length;

  // Adjust itemsPerPage if it's larger than the total number of items after filtering.
  // This typically happens when "All" was selected or a large page size was chosen
  // before filters were applied. Setting it to totalItems ensures the dropdown
  // reflects "All" correctly and avoids showing empty pages.
  useEffect(() => {
    if (totalItems > 0 && itemsPerPage > totalItems) {
      setItemsPerPage(totalItems);
    }
  }, [totalItems, itemsPerPage]);

  // Reset to page 1 when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems, itemsPerPage]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredRecords, currentPage, itemsPerPage]);


  const handleSelectRecord = useCallback((recordId: string) => {
    setSelectedRecordIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(recordId)) {
        newSelected.delete(recordId);
      } else {
        newSelected.add(recordId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const pageRecordIds = paginatedRecords.map(r => r.id);
    const allOnPageSelected = pageRecordIds.length > 0 && pageRecordIds.every(id => selectedRecordIds.has(id));

    setSelectedRecordIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allOnPageSelected) {
        pageRecordIds.forEach(id => newSelected.delete(id));
      } else {
        pageRecordIds.forEach(id => newSelected.add(id));
      }
      return newSelected;
    });
  }, [paginatedRecords, selectedRecordIds]);
  
  const { isAllOnPageSelected, isIndeterminate } = useMemo(() => {
    if (paginatedRecords.length === 0) {
      return { isAllOnPageSelected: false, isIndeterminate: false };
    }
    const pageRecordIds = paginatedRecords.map(r => r.id);
    const selectedOnPageCount = pageRecordIds.filter(id => selectedRecordIds.has(id)).length;
    
    const isAllOnPageSelected = selectedOnPageCount === pageRecordIds.length;
    const isIndeterminate = selectedOnPageCount > 0 && !isAllOnPageSelected;

    return { isAllOnPageSelected, isIndeterminate };
  }, [paginatedRecords, selectedRecordIds]);

  const handleDownload = (recordId: string) => {
    alert(`Initiating PDF download for talk record: ${recordId}`);
  };

  const handleBulkDownload = () => {
    const selectedIds = Array.from(selectedRecordIds).join(', ');
    alert(`Initiating bulk PDF download for ${selectedRecordIds.size} selected record(s):\n${selectedIds}`);
    setSelectedRecordIds(new Set());
  };
  
  const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
    console.log('Feedback submitted:', JSON.stringify(feedback, null, 2));
    alert('Thank you for your feedback!');
    setIsFeedbackModalOpen(false);
  };

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
      <Header
        userEmail={user?.email}
        onLogout={logout}
        onFeedbackClick={() => setIsFeedbackModalOpen(true)}
      />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">Review safety talk records and manage company data.</p>
              </div>
              <div className="mt-4 sm:mt-0 ml-0 sm:ml-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Link to="/admin/crew-management" className="relative inline-flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                  <UserGroupIcon className="h-5 w-5" />
                  <span>Manage Crew</span>
                  {pendingCrew.length > 0 && (
                     <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900 ring-2 ring-white">
                        {pendingCrew.length}
                     </span>
                  )}
                </Link>
                 <Link to="/admin/topic-management" className="inline-flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                  <BookOpenIcon className="h-5 w-5" />
                  <span>Manage Topics</span>
                </Link>
                 <Link to="/admin/location-management" className="inline-flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                  <MapPinIcon className="h-5 w-5" />
                  <span>Manage Locations</span>
                </Link>
              </div>
            </div>
          <PendingApprovals pendingCrew={pendingCrew} onApprove={approveMember} onReject={rejectMember} />
          
           {/* At-a-Glance Summary */}
          <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">At-a-Glance Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                      icon={<ClipboardListIcon className="h-6 w-6" />}
                      title="Total Talks"
                      value={dashboardStats.talksThisMonth}
                      description="This Month"
                  />
                   <StatCard 
                      icon={<PencilSquareIcon className="h-6 w-6" />}
                      title="Total Signatures"
                      value={dashboardStats.signaturesThisMonth}
                      description="This Month"
                  />
                   <ListStatCard 
                      icon={<BookOpenIcon className="h-6 w-6" />}
                      title="Top 3 Topics"
                      items={dashboardStats.topTopics}
                      description="All Time"
                  />
                   <ListStatCard 
                      icon={<UserGroupIcon className="h-6 w-6" />}
                      title="Top 3 Foremen"
                      items={dashboardStats.topForemen}
                      description="By Talks Conducted"
                  />
              </div>
          </div>


          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="pb-5">
              <h2 className="text-lg font-semibold text-gray-800">Toolbox Talk Records</h2>
              <p className="mt-1 text-sm text-gray-600">Review, filter, and download submitted safety talk reports.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
               <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start</label>
                      <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} disabled={loading}/>
                  </div>
                  <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End</label>
                      <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} disabled={loading}/>
                  </div>
                </div>
               <div>
                  <label htmlFor="Topic-multiselect" className="block text-sm font-medium text-gray-700">Topic</label>
                  <MultiSelectDropdown
                    label="Topic"
                    options={uniqueTopics}
                    selectedValues={filters.topic}
                    onChange={(values) => handleMultiSelectChange('topic', values)}
                    disabled={loading}
                    placeholder="All Topics"
                  />
               </div>
               <div>
                  <label htmlFor="Foreman-multiselect" className="block text-sm font-medium text-gray-700">Foreman</label>
                  <MultiSelectDropdown
                    label="Foreman"
                    options={uniqueForemen}
                    selectedValues={filters.foreman}
                    onChange={(values) => handleMultiSelectChange('foreman', values)}
                    disabled={loading}
                    placeholder="All Foremen"
                  />
               </div>
               <div>
                  <label htmlFor="Location-multiselect" className="block text-sm font-medium text-gray-700">Location</label>
                  <MultiSelectDropdown
                    label="Location"
                    options={uniqueLocations}
                    selectedValues={filters.location}
                    onChange={(values) => handleMultiSelectChange('location', values)}
                    disabled={loading}
                    placeholder="All Locations"
                  />
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="minCrew" className="block text-sm font-medium text-gray-700">Min Crew</label>
                    <select
                      name="minCrew"
                      id="minCrew"
                      value={filters.minCrew}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900"
                      style={{ colorScheme: 'light' }}
                      disabled={loading}
                    >
                      <option value="">Any</option>
                      {uniqueCrewSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maxCrew" className="block text-sm font-medium text-gray-700">Max Crew</label>
                    <select
                      name="maxCrew"
                      id="maxCrew"
                      value={filters.maxCrew}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900"
                      style={{ colorScheme: 'light' }}
                      disabled={loading}
                    >
                      <option value="">Any</option>
                      {uniqueCrewSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
                 <div className="sm:col-span-2 lg:col-span-5 flex items-end justify-end space-x-2 pt-4 lg:pt-0">
                    <button 
                        onClick={handleBulkDownload}
                        disabled={selectedRecordIds.size === 0 || loading}
                        className="w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      <span>Download Selected ({selectedRecordIds.size})</span>
                    </button>
                    <button onClick={resetFilters} disabled={loading} className="w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-300 disabled:cursor-not-allowed">
                      <ResetIcon className="h-4 w-4" />
                      <span>Reset Filters</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="shadow border-b border-gray-200 sm:rounded-lg bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                        <span className="sr-only">Select row</span>
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-400 bg-gray-100 text-brand-blue focus:ring-brand-blue"
                            style={{ colorScheme: 'light' }}
                            checked={isAllOnPageSelected}
                            ref={el => {
                                if (el) {
                                    el.indeterminate = isIndeterminate;
                                }
                            }}
                            onChange={handleSelectAll}
                            disabled={loading || paginatedRecords.length === 0}
                        />
                    </th>
                    <SortableHeader columnKey="dateTime" title="Date & Time" />
                    <SortableHeader columnKey="topic" title="Topic" />
                    <SortableHeader columnKey="foremanName" title="Foreman" />
                    <SortableHeader columnKey="location" title="Location" />
                    <SortableHeader columnKey="crewSize" title="Crew Size" />
                    <SortableHeader columnKey="syncStatus" title="Status" />
                    <th scope="col" className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <SpinnerIcon className="w-12 h-12 mb-4 text-brand-blue" />
                          <h3 className="text-lg font-semibold text-gray-700">Loading Records...</h3>
                          <p className="text-sm">Please wait while we fetch the latest data.</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
                      <tr key={record.id} className={`${selectedRecordIds.has(record.id) ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors duration-150 ease-in-out`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-400 bg-gray-100 text-brand-blue focus:ring-brand-blue"
                            style={{ colorScheme: 'light' }}
                            checked={selectedRecordIds.has(record.id)}
                            onChange={() => handleSelectRecord(record.id)}
                            aria-label={`Select record ${record.id}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(record.dateTime)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.topic}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.foremanName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{record.crewSignatures.length}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.syncStatus === 'pending' ? (
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
                          <div className="flex items-center justify-end space-x-4">
                            <Link to={`/talk-details/${record.id}`} className="text-brand-blue hover:text-brand-blue-dark hover:underline">
                              View
                            </Link>
                            <button
                              onClick={() => handleDownload(record.id)}
                              className="text-gray-500 hover:text-brand-blue"
                              aria-label={`Download PDF for ${record.topic} on ${formatDateTime(record.dateTime)}`}
                            >
                              <DownloadIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                     <tr>
                        <td colSpan={8} className="text-center py-16">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                <SearchIcon className="w-12 h-12 mb-2 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-700">No Records Found</h3>
                                <p className="text-sm">Try adjusting your filters to find what you're looking for.</p>
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
      </main>
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        userEmail={user?.email}
      />
    </div>
  );
};

export default DashboardPage;