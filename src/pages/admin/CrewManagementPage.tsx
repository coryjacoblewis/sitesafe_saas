import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import { useToast } from '../../hooks/useToast';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { CrewMember, ChangeLog } from '../../types';
import UserPlusIcon from '../../components/icons/UserPlusIcon';
import PencilSquareIcon from '../../components/icons/PencilSquareIcon';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import ArrowUpIcon from '../../components/icons/ArrowUpIcon';
import ArrowDownIcon from '../../components/icons/ArrowDownIcon';
import ArrowUpTrayIcon from '../../components/icons/ArrowUpTrayIcon';
import ArrowDownTrayIcon from '../../components/icons/ArrowDownTrayIcon';


interface ParsedRow {
    data: { name: string; status: 'active' | 'inactive' };
    status: 'new' | 'update' | 'error';
    error?: string;
}


const CrewManagementPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { crewMembers, addCrewMember, updateCrewMember, toggleCrewMemberStatus, bulkAddOrUpdateCrew, loading } = useCrewMembers();
    const { showToast } = useToast();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [memberToDeactivate, setMemberToDeactivate] = useState<CrewMember | null>(null);

    const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
    const [viewingHistoryFor, setViewingHistoryFor] = useState<CrewMember | null>(null);
    const [newMemberName, setNewMemberName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
    const [parsedCsvData, setParsedCsvData] = useState<ParsedRow[]>([]);
    const [importFileName, setImportFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const sortedAndFilteredMembers = useMemo(() => {
        return [...crewMembers]
            .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    }, [crewMembers, searchTerm]);

    const openEditModal = (member: CrewMember) => {
        setEditingMember(member);
        setNewMemberName(member.name);
        setIsEditModalOpen(true);
    };

    const openHistoryModal = (member: CrewMember) => {
        setViewingHistoryFor(member);
        setIsHistoryModalOpen(true);
    }

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        addCrewMember(newMemberName);
        showToast(`Crew member "${newMemberName}" added successfully.`, { type: 'success' });
        setNewMemberName('');
        setIsAddModalOpen(false);
    };
    
    const handleUpdateMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            updateCrewMember(editingMember.id, newMemberName);
            showToast(`Crew member updated to "${newMemberName}".`, { type: 'success' });
        }
        setNewMemberName('');
        setEditingMember(null);
        setIsEditModalOpen(false);
    };

    const handleToggleStatus = (member: CrewMember) => {
        if (member.status === 'active') {
            setMemberToDeactivate(member);
        } else {
            toggleCrewMemberStatus(member.id);
            showToast(`${member.name} has been activated.`, { type: 'success' });
        }
    };
    
    const confirmDeactivation = () => {
        if (memberToDeactivate) {
            toggleCrewMemberStatus(memberToDeactivate.id);
            showToast(`${memberToDeactivate.name} has been deactivated.`, { type: 'info' });
            setMemberToDeactivate(null);
        }
    };
    
    const handleExportCSV = useCallback(() => {
        if (sortedAndFilteredMembers.length === 0) {
            showToast("No data to export.", { type: 'error' });
            return;
        }
        const header = "name,status\n";
        const rows = sortedAndFilteredMembers.map(m => `"${m.name.replace(/"/g, '""')}",${m.status}`).join("\n");
        const csvContent = header + rows;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "crew_export.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Crew data export started.", { type: 'success' });
        }
    }, [sortedAndFilteredMembers, showToast]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                processCSV(text);
            };
            reader.readAsText(file);
        }
    };
    
    const processCSV = (csvText: string) => {
        const rows = csvText.split(/\r?\n/).filter(Boolean);
        if (rows.length <= 1) {
            showToast("CSV file is empty or contains only a header.", { type: 'error' });
            return;
        }

        const header = rows[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
        const nameIndex = header.indexOf('name');
        const statusIndex = header.indexOf('status');
        
        if (nameIndex === -1 || statusIndex === -1) {
            showToast('CSV must contain "name" and "status" columns.', { type: 'error' });
            return;
        }

        const existingMembersMap = new Map(crewMembers.map(m => [m.name.toLowerCase(), m]));
        const previewData: ParsedRow[] = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split(',');
            const name = (row[nameIndex] || '').trim().replace(/"/g, '');
            const status = (row[statusIndex] || '').trim().toLowerCase() as 'active' | 'inactive';

            if (!name) {
                previewData.push({ data: { name: '', status: 'active' }, status: 'error', error: 'Name is empty.' });
                continue;
            }
            if (status !== 'active' && status !== 'inactive') {
                previewData.push({ data: { name, status: 'active' }, status: 'error', error: `Invalid status: "${row[statusIndex]}". Use 'active' or 'inactive'.` });
                continue;
            }

            const existingMember = existingMembersMap.get(name.toLowerCase());
            if (existingMember) {
                if (existingMember.status !== status) {
                     previewData.push({ data: { name, status }, status: 'update' });
                }
            } else {
                 previewData.push({ data: { name, status }, status: 'new' });
            }
        }
        setParsedCsvData(previewData);
        setImportStep('preview');
    };

    const handleConfirmImport = async () => {
        const validData = parsedCsvData.filter(row => row.status !== 'error').map(row => row.data);
        if (validData.length === 0) {
            showToast("No valid data to import.", { type: 'error' });
            return;
        }
        setIsProcessing(true);
        try {
            const { added, updated } = await bulkAddOrUpdateCrew(validData);
            showToast(`Import successful! Added: ${added}, Updated: ${updated}`, { type: 'success' });
            closeImportModal();
        } catch (error) {
            console.error("Import failed:", error);
            showToast("An error occurred during the import process.", { type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const closeImportModal = () => {
        setIsImportModalOpen(false);
        setImportStep('upload');
        setParsedCsvData([]);
        setImportFileName('');
    };

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    }
    
    const renderMemberForm = (handleSubmit: (e: React.FormEvent) => void) => (
        <form onSubmit={handleSubmit}>
            <label htmlFor="crewMemberName" className="block text-sm font-medium text-gray-700">
                Crew Member Name
            </label>
            <div className="mt-1">
                <input
                    id="crewMemberName"
                    name="crewMemberName"
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                    style={{ colorScheme: 'light' }}
                    placeholder="e.g., John Doe"
                    autoFocus
                />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
                 <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                 <button type="submit" disabled={!newMemberName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark disabled:bg-gray-400">Save</button>
            </div>
        </form>
    );

    const HistoryActionIcon: React.FC<{ action: ChangeLog['action'] }> = ({ action }) => {
        switch(action) {
            case 'CREATED':
                return <PlusIcon className="h-5 w-5 text-blue-500 bg-blue-100 rounded-full p-0.5" />;
            case 'UPDATED_NAME':
                return <PencilSquareIcon className="h-5 w-5 text-purple-500 bg-purple-100 rounded-full p-0.5" />;
            case 'ACTIVATED':
                return <ArrowUpIcon className="h-5 w-5 text-green-500 bg-green-100 rounded-full p-0.5" />;
            case 'DEACTIVATED':
                return <ArrowDownIcon className="h-5 w-5 text-red-500 bg-red-100 rounded-full p-0.5" />;
            default:
                return null;
        }
    }

    const renderHistoryModal = () => {
        if (!viewingHistoryFor) return null;
        
        const sortedHistory = [...viewingHistoryFor.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return (
            <div className="space-y-4">
                <ul className="max-h-96 overflow-y-auto pr-2 -mr-2">
                   {sortedHistory.map((log, index) => (
                      <li key={index} className="flex items-start space-x-3 py-3">
                          <HistoryActionIcon action={log.action} />
                          <div className="flex-1">
                              <p className="text-sm text-gray-800">{log.details}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                 {log.actor && (
                                    <>
                                        by <span className="font-medium">{log.actor}</span> &bull;{' '}
                                    </>
                                 )}
                                 {formatDateTime(log.timestamp)}
                              </p>
                          </div>
                      </li>
                   ))}
                </ul>
                <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Close</button>
                </div>
            </div>
        );
    }
    
    const renderImportModal = () => {
        const changes = useMemo(() => ({
            new: parsedCsvData.filter(r => r.status === 'new').length,
            update: parsedCsvData.filter(r => r.status === 'update').length,
            error: parsedCsvData.filter(r => r.status === 'error').length,
        }), [parsedCsvData]);
        
        return (
            <div>
            {importStep === 'upload' && (
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        Upload a CSV file with "name" and "status" columns.
                        The status must be either "active" or "inactive".
                    </p>
                     <label htmlFor="csv-upload" className="w-full flex justify-center px-6 py-10 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                        <div className="space-y-1 text-center">
                            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <span>Upload a file</span>
                                <input id="csv-upload" name="csv-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileSelect} />
                            </div>
                            <p className="text-xs text-gray-500">CSV up to 5MB</p>
                        </div>
                    </label>
                    {importFileName && <p className="mt-2 text-sm text-center text-gray-600">Selected file: {importFileName}</p>}
                </div>
            )}
            {importStep === 'preview' && (
                <div>
                    <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                        <h4 className="font-semibold text-gray-800">Import Summary</h4>
                        <div className="flex justify-around text-sm mt-2">
                            <span className="text-green-600 font-medium">New: {changes.new}</span>
                            <span className="text-blue-600 font-medium">Updates: {changes.update}</span>
                            <span className="text-red-600 font-medium">Errors: {changes.error}</span>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Change / Error</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {parsedCsvData.map((row, i) => (
                                    <tr key={i} className={row.status === 'error' ? 'bg-red-50' : ''}>
                                        <td className="px-4 py-2 whitespace-nowrap">{row.data.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{row.data.status}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {row.status === 'new' && <span className="text-green-700">New Member</span>}
                                            {row.status === 'update' && <span className="text-blue-700">Update Status</span>}
                                            {row.status === 'error' && <span className="text-red-700">{row.error}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="mt-4 flex justify-between items-center">
                        <button type="button" onClick={() => setImportStep('upload')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Back</button>
                        <div>
                            <button type="button" onClick={closeImportModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 mr-2">Cancel</button>
                            <button
                                type="button"
                                onClick={handleConfirmImport}
                                disabled={isProcessing || changes.new + changes.update === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark disabled:bg-gray-400"
                            >
                                {isProcessing ? <SpinnerIcon className="h-4 w-4" /> : 'Confirm Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-gray">
            <Header userEmail={user?.email} userRole={user?.role} onLogout={logout} onFeedbackClick={() => {}} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-gray-200 pb-5 mb-5">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Crew Management</h1>
                            <p className="mt-1 text-sm text-gray-600">Add, edit, and manage your company's crew roster.</p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <Link to="/dashboard" className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                <ChevronLeftIcon className="h-5 w-5" />
                                <span>Dashboard</span>
                            </Link>
                            <div className="flex space-x-2">
                                <button onClick={() => setIsImportModalOpen(true)} className="inline-flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    <ArrowUpTrayIcon className="h-5 w-5" />
                                    <span>Import</span>
                                </button>
                                <button onClick={handleExportCSV} className="inline-flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                    <span>Export</span>
                                </button>
                            </div>
                            <button onClick={() => { setNewMemberName(''); setIsAddModalOpen(true); }} className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">
                                <UserPlusIcon className="h-5 w-5" />
                                <span>Add Member</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                         <div className="relative">
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
                            />
                         </div>
                    </div>
                    
                    <div className="shadow border border-gray-200 sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                                        <th scope="col" className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16"><SpinnerIcon className="h-8 w-8 mx-auto text-brand-blue" /></td>
                                        </tr>
                                    ) : sortedAndFilteredMembers.map(member => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {member.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(member.dateAdded)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(member.lastModified)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => openHistoryModal(member)} className="text-gray-600 hover:text-brand-blue inline-flex items-center space-x-1 p-1" title="View History">
                                                    <ClockIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => openEditModal(member)} className="text-gray-600 hover:text-brand-blue inline-flex items-center space-x-1 p-1" title="Edit Name">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(member)} className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded hover:bg-gray-100">
                                                    {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Crew Member">
                {renderMemberForm(handleAddMember)}
            </Modal>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Crew Member">
                {renderMemberForm(handleUpdateMember)}
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Change History for ${viewingHistoryFor?.name}`}>
                {renderHistoryModal()}
            </Modal>
            
            <Modal isOpen={isImportModalOpen} onClose={closeImportModal} title="Import Crew from CSV">
                {renderImportModal()}
            </Modal>

             <ConfirmationModal
                isOpen={!!memberToDeactivate}
                onClose={() => setMemberToDeactivate(null)}
                onConfirm={confirmDeactivation}
                title="Deactivate Crew Member"
                confirmText="Deactivate"
            >
                Are you sure you want to deactivate <span className="font-bold">{memberToDeactivate?.name}</span>? They will not be available for selection in new talks.
            </ConfirmationModal>
        </div>
    );
};

export default CrewManagementPage;