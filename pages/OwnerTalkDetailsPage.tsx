import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTalkRecords } from '../hooks/useTalkRecords';
import { useToast } from '../hooks/useToast';
import Header from '../components/Header';
import FeedbackModal from '../components/FeedbackModal';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { FeedbackSubmission, ChangeLog, TalkRecord } from '../types';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import FlagIcon from '../components/icons/FlagIcon';
import InformationCircleIcon from '../components/icons/InformationCircleIcon';
// FIX: Import the CheckIcon component to resolve the 'Cannot find name' error.
import CheckIcon from '../components/icons/CheckIcon';

const OwnerTalkDetailsPage: React.FC = () => {
  const { talkId } = useParams<{ talkId: string }>();
  const { records, updateTalkRecord } = useTalkRecords();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [talkToResolve, setTalkToResolve] = useState<TalkRecord | null>(null);

  const talk = records.find(record => record.id === talkId);

  const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
    console.log('Feedback submitted:', JSON.stringify(feedback, null, 2));
    setIsFeedbackModalOpen(false);
  };
  
  const handleDownload = () => {
    showToast(`Initiating PDF download for talk record...`);
  };

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (talk && user && flagReason.trim()) {
        const updates: Partial<TalkRecord> = {
            recordStatus: 'flagged',
            flag: {
                flaggedBy: user.email,
                flaggedAt: new Date().toISOString(),
                reason: flagReason.trim(),
            }
        };
        const changeLog: ChangeLog = {
            timestamp: new Date().toISOString(),
            action: 'FLAGGED',
            details: `Report flagged for correction. Reason: "${flagReason.trim()}"`,
            actor: user.email,
        };
        await updateTalkRecord(talk.id, updates, changeLog);
        showToast("Report has been flagged for correction.", { type: 'success' });
        setFlagReason('');
        setIsFlagModalOpen(false);
    }
  };

  const handleConfirmResolve = async () => {
     if (talkToResolve && user) {
        const updates: Partial<TalkRecord> = {
            recordStatus: 'submitted',
            flag: undefined,
        };
        const changeLog: ChangeLog = {
            timestamp: new Date().toISOString(),
            action: 'FLAG_RESOLVED',
            details: `Flag was manually resolved by manager.`,
            actor: user.email,
        };
        await updateTalkRecord(talkToResolve.id, updates, changeLog);
        showToast("Flag has been resolved.", { type: 'success' });
        setTalkToResolve(null);
     }
  };
  
  if (!talk) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <Header 
            userEmail={user?.email} 
            onLogout={logout} 
            onFeedbackClick={() => setIsFeedbackModalOpen(true)}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900">Talk Not Found</h1>
            <p className="mt-2 text-gray-600">The requested talk record could not be found.</p>
            <Link to="/dashboard" className="mt-6 inline-block text-brand-blue hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
       <Header 
          userEmail={user?.email} 
          onLogout={logout} 
          onFeedbackClick={() => setIsFeedbackModalOpen(true)}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-gray-200 pb-5 mb-5">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{talk.topic}</h1>
                        <p className="mt-1 text-sm text-gray-600">Conducted by {talk.foremanName} on {new Date(talk.dateTime).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
                        <Link to="/dashboard" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to Dashboard
                        </Link>
                        {talk.recordStatus !== 'flagged' ? (
                            <button onClick={() => setIsFlagModalOpen(true)} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600">
                                <FlagIcon className="h-4 w-4" />
                                <span>Flag for Correction</span>
                            </button>
                        ) : (
                            <button onClick={() => setTalkToResolve(talk)} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600">
                                <CheckIcon className="h-4 w-4" />
                                <span>Resolve Flag</span>
                            </button>
                        )}
                        <button onClick={handleDownload} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">
                            <DownloadIcon className="h-4 w-4" />
                            <span>Download Record</span>
                        </button>
                    </div>
                </div>

                {talk.recordStatus === 'flagged' && talk.flag && (
                     <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-bold text-yellow-900">This report is flagged for correction.</p>
                                <p className="mt-1 text-sm text-yellow-800">
                                    Flagged by <span className="font-medium">{talk.flag.flaggedBy}</span> on {new Date(talk.flag.flaggedAt).toLocaleDateString()}:
                                    <span className="italic"> "{talk.flag.reason}"</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="md:col-span-1 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Talk Details</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-500">Foreman:</span>
                                <span className="text-gray-800 text-right">{talk.foremanName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-500">Date:</span>
                                <span className="text-gray-800 text-right">{new Date(talk.dateTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-500">Time:</span>
                                <span className="text-gray-800 text-right">{new Date(talk.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-500">Location:</span>
                                <span className="text-gray-800 text-right">{talk.location}</span>
                            </div>
                            {talk.topicPdfUrl && (
                                <div className="flex justify-between items-center pt-1">
                                    <span className="font-medium text-gray-500">Topic Material Used:</span>
                                    <a
                                        href={talk.topicPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1.5 text-sm font-medium text-brand-blue hover:underline"
                                    >
                                        <DocumentTextIcon className="h-4 w-4" />
                                        <span>View PDF</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                            <ClipboardListIcon className="h-6 w-6 text-gray-500"/>
                            <span>Signed Crew Members ({talk.crewSignatures.length})</span>
                        </h2>
                        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {talk.crewSignatures.length > 0 ? (
                                    talk.crewSignatures.map((member, index) => (
                                        <li key={index} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                           <span className="text-gray-800 font-medium">{member.name}</span>
                                           {member.signature ? (
                                             <img 
                                               src={member.signature} 
                                               alt={`${member.name}'s signature`} 
                                               className="h-10 w-24 object-contain bg-white border border-gray-300 rounded p-1"
                                             />
                                           ) : (
                                             <span className="text-sm text-gray-400 italic">No signature image</span>
                                           )}
                                        </li>
                                    ))
                                ) : (
                                    <li className="p-4 text-center text-gray-500">No crew members were signed for this talk.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSubmit={handleFeedbackSubmit}
            userEmail={user?.email}
        />
        <Modal isOpen={isFlagModalOpen} onClose={() => setIsFlagModalOpen(false)} title="Flag Report for Correction">
             <form onSubmit={handleFlagSubmit}>
                <p className="text-sm text-gray-600 mb-4">The foreman will be notified that this report needs correction. Please provide a clear reason.</p>
                <label htmlFor="flagReason" className="block text-sm font-medium text-gray-700">
                    Reason for Flagging
                </label>
                <div className="mt-1">
                    <textarea
                        id="flagReason"
                        name="flagReason"
                        rows={3}
                        required
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                        placeholder="e.g., Incorrect location selected, missing signature for Bob."
                        autoFocus
                    />
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <button type="button" onClick={() => setIsFlagModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={!flagReason.trim()} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md shadow-sm hover:bg-yellow-600 disabled:bg-gray-400">Flag Report</button>
                </div>
            </form>
        </Modal>
        <ConfirmationModal
            isOpen={!!talkToResolve}
            onClose={() => setTalkToResolve(null)}
            onConfirm={handleConfirmResolve}
            title="Resolve Flag"
            confirmText="Yes, Resolve"
        >
            Are you sure you want to manually resolve this flag? This should only be done if the issue has been addressed outside of the amendment process.
        </ConfirmationModal>
    </div>
  );
};

export default OwnerTalkDetailsPage;