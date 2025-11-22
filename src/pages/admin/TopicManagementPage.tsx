import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSafetyTopics } from '../../hooks/useSafetyTopics';
import { useToast } from '../../hooks/useToast';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { SafetyTopic, ChangeLog } from '../../types';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import ArrowUpIcon from '../../components/icons/ArrowUpIcon';
import ArrowDownIcon from '../../components/icons/ArrowDownIcon';
import PencilSquareIcon from '../../components/icons/PencilSquareIcon';
import BookOpenIcon from '../../components/icons/BookOpenIcon';
import DocumentTextIcon from '../../components/icons/DocumentTextIcon';


const TopicManagementPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { safetyTopics, addSafetyTopic, updateSafetyTopic, toggleSafetyTopicStatus, loading } = useSafetyTopics();
    const { showToast } = useToast();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [topicToDeactivate, setTopicToDeactivate] = useState<SafetyTopic | null>(null);

    const [editingTopic, setEditingTopic] = useState<SafetyTopic | null>(null);
    const [viewingHistoryFor, setViewingHistoryFor] = useState<SafetyTopic | null>(null);
    const [topicName, setTopicName] = useState('');
    const [topicContent, setTopicContent] = useState('');
    const [newPdfFile, setNewPdfFile] = useState<{ name: string; dataUrl: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const openEditModal = (topic: SafetyTopic) => {
        setEditingTopic(topic);
        setTopicName(topic.name);
        setTopicContent(topic.content);
        setNewPdfFile(null); // Reset on open
        setIsEditModalOpen(true);
    };

    const openHistoryModal = (topic: SafetyTopic) => {
        setViewingHistoryFor(topic);
        setIsHistoryModalOpen(true);
    }

    const handleAddTopic = (e: React.FormEvent) => {
        e.preventDefault();
        addSafetyTopic(topicName, topicContent);
        showToast(`Topic "${topicName}" added successfully.`, { type: 'success' });
        setTopicName('');
        setTopicContent('');
        setIsAddModalOpen(false);
    };
    
    const handleUpdateTopic = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTopic) {
            updateSafetyTopic(editingTopic.id, topicName, topicContent, newPdfFile || undefined);
            showToast(`Topic "${topicName}" updated successfully.`, { type: 'success' });
        }
        setTopicName('');
        setTopicContent('');
        setNewPdfFile(null);
        setEditingTopic(null);
        setIsEditModalOpen(false);
    };
    
    const handleToggleStatus = (topic: SafetyTopic) => {
        if (topic.status === 'active') {
            setTopicToDeactivate(topic);
        } else {
            toggleSafetyTopicStatus(topic.id);
            showToast(`"${topic.name}" has been activated.`, { type: 'success' });
        }
    };

    const confirmDeactivation = () => {
        if (topicToDeactivate) {
            toggleSafetyTopicStatus(topicToDeactivate.id);
            showToast(`"${topicToDeactivate.name}" has been deactivated.`, { type: 'info' });
            setTopicToDeactivate(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setNewPdfFile({ name: file.name, dataUrl });
                showToast(`PDF "${file.name}" ready for upload.`, { type: 'info' });
            };
            reader.readAsDataURL(file);
        } else if (file) {
            showToast('Please select a valid PDF file.', { type: 'error' });
        }
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

    const extractFileName = (url: string) => {
        if (url.startsWith('data:')) {
            return 'Uploaded PDF';
        }
        return url.split('/').pop() || 'Unknown File';
    }
    
    const sortedAndFilteredTopics = useMemo(() => {
        return [...safetyTopics]
            .filter(topic => topic.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    }, [safetyTopics, searchTerm]);


    const renderTopicForm = (handleSubmit: (e: React.FormEvent) => void, isEditing: boolean) => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="topicName" className="block text-sm font-medium text-gray-700">
                    Topic Name
                </label>
                <div className="mt-1">
                    <input
                        id="topicName"
                        name="topicName"
                        type="text"
                        required
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                        style={{ colorScheme: 'light' }}
                        placeholder="e.g., Ladder Safety"
                        autoFocus
                    />
                </div>
            </div>
             <div>
                <label htmlFor="topicContent" className="block text-sm font-medium text-gray-700">
                    Topic Content / Description
                </label>
                <div className="mt-1">
                    <textarea
                        id="topicContent"
                        name="topicContent"
                        rows={4}
                        value={topicContent}
                        onChange={(e) => setTopicContent(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                        style={{ colorScheme: 'light' }}
                        placeholder="Enter key points or a brief summary of the topic."
                    />
                </div>
            </div>

            {isEditing && editingTopic && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        PDF Document
                    </label>
                    <div className="mt-1 flex items-center justify-between p-2 border border-gray-300 rounded-md bg-gray-50">
                        <div className="flex items-center space-x-2 truncate">
                            <DocumentTextIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-800 truncate" title={newPdfFile?.name || extractFileName(editingTopic.pdfUrl)}>
                                {newPdfFile?.name || extractFileName(editingTopic.pdfUrl)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm font-medium text-brand-blue hover:underline flex-shrink-0"
                        >
                            Change
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                            className="hidden"
                        />
                    </div>
                </div>
            )}


            <div className="pt-4 flex justify-end space-x-2">
                 <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                 <button type="submit" disabled={!topicName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark disabled:bg-gray-400">Save</button>
            </div>
        </form>
    );

    const HistoryActionIcon: React.FC<{ action: ChangeLog['action'] }> = ({ action }) => {
        switch(action) {
            case 'CREATED':
                return <PlusIcon className="h-5 w-5 text-blue-500 bg-blue-100 rounded-full p-0.5" />;
            case 'UPDATED_NAME':
            case 'UPDATED_CONTENT':
                return <PencilSquareIcon className="h-5 w-5 text-purple-500 bg-purple-100 rounded-full p-0.5" />;
            case 'UPDATED_PDF':
                 return <DocumentTextIcon className="h-5 w-5 text-indigo-500 bg-indigo-100 rounded-full p-0.5" />;
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

    return (
        <div className="min-h-screen bg-brand-gray">
            <Header userEmail={user?.email} userRole={user?.role} onLogout={logout} onFeedbackClick={() => {}} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-gray-200 pb-5 mb-5">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Topic Management</h1>
                            <p className="mt-1 text-sm text-gray-600">Add, edit, and manage your company's safety topics.</p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <Link to="/dashboard" className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                <ChevronLeftIcon className="h-5 w-5" />
                                <span>Dashboard</span>
                            </Link>
                            <button onClick={() => { setTopicName(''); setTopicContent(''); setIsAddModalOpen(true); }} className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">
                                <BookOpenIcon className="h-5 w-5" />
                                <span>Add Topic</span>
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
                                placeholder="Search topics..."
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
                                    ) : sortedAndFilteredTopics.map(topic => (
                                        <tr key={topic.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{topic.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${topic.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {topic.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(topic.dateAdded)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(topic.lastModified)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => openHistoryModal(topic)} className="text-gray-600 hover:text-brand-blue inline-flex items-center space-x-1 p-1" title="View History">
                                                    <ClockIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => openEditModal(topic)} className="text-gray-600 hover:text-brand-blue inline-flex items-center space-x-1 p-1" title="Edit Topic">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(topic)} className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded hover:bg-gray-100">
                                                    {topic.status === 'active' ? 'Deactivate' : 'Activate'}
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
            
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Safety Topic">
                {renderTopicForm(handleAddTopic, false)}
            </Modal>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Safety Topic">
                {renderTopicForm(handleUpdateTopic, true)}
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Change History for ${viewingHistoryFor?.name}`}>
                {renderHistoryModal()}
            </Modal>

             <ConfirmationModal
                isOpen={!!topicToDeactivate}
                onClose={() => setTopicToDeactivate(null)}
                onConfirm={confirmDeactivation}
                title="Deactivate Safety Topic"
                confirmText="Deactivate"
            >
                Are you sure you want to deactivate the topic "<span className="font-bold">{topicToDeactivate?.name}</span>"? It will no longer be available for selection in new talks.
            </ConfirmationModal>
        </div>
    );
};

export default TopicManagementPage;