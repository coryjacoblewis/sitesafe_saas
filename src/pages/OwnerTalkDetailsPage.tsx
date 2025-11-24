
import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTalkRecords } from '../hooks/useTalkRecords';
import { useToast } from '../hooks/useToast';
import { generateTalkRecordPDF } from '../utils/pdfGenerator';
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
import CheckIcon from '../components/icons/CheckIcon';
import ClockIcon from '../components/icons/ClockIcon';
import PencilSquareIcon from '../components/icons/PencilSquareIcon';
import PlusIcon from '../components/icons/PlusIcon';
import CameraIcon from '../components/icons/CameraIcon';
import { isNotEmpty, sanitizeString } from '../utils/validation';

const OwnerTalkDetailsPage: React.FC = () => {
    const { talkId } = useParams<{ talkId: string }>();
    const [searchParams] = useSearchParams();
    const { records, updateTalkRecord } = useTalkRecords();
    const { user, logout } = useAuth();
    const { showToast } = useToast();

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [talkToResolve, setTalkToResolve] = useState<TalkRecord | null>(null);

    const talk = records.find(record => record.id === talkId);

    useEffect(() => {
        // Legacy print query param handling, optional to keep or remove.
        if (talk && searchParams.get('print') === 'true') {
            // We could auto-download PDF here, but browser blocking might occur.
        }
    }, [talk, searchParams]);

    const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
        setIsFeedbackModalOpen(false);
    };

    const handleDownload = () => {
        if (talk) {
            showToast(`Generating PDF...`, { type: 'info' });
            try {
                generateTalkRecordPDF(talk);
                showToast(`PDF downloaded.`, { type: 'success' });
            } catch (error) {
                console.error("PDF generation failed", error);
                showToast(`Failed to generate PDF.`, { type: 'error' });
            }
        }
    };

    const handleFlagSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isNotEmpty(flagReason)) {
            showToast("Please provide a reason for flagging this report.", { type: 'error' });
            return;
        }
        const sanitizedReason = sanitizeString(flagReason);

        if (talk && user) {
            const updates: Partial<TalkRecord> = {
                recordStatus: 'flagged',
                flag: {
                    flaggedBy: user.email,
                    flaggedAt: new Date().toISOString(),
                    reason: sanitizedReason,
                }
            };
            const changeLog: ChangeLog = {
                timestamp: new Date().toISOString(),
                action: 'FLAGGED',
                details: `Report flagged for correction. Reason: "${sanitizedReason}"`,
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

    const getHistoryIcon = (action: ChangeLog['action']) => {
        switch (action) {
            case 'CREATED':
                return <span className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"><PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /></span>;
            case 'FLAGGED':
                return <span className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"><FlagIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></span>;
            case 'AMENDED':
                return <span className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"><PencilSquareIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" /></span>;
            case 'FLAG_RESOLVED':
                return <span className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"><CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" /></span>;
            default:
                return <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"><InformationCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /></span>;
        }
    };

    if (!talk) {
        return (
            <div className="min-h-screen bg-brand-gray dark:bg-gray-900 transition-colors duration-200">
                <Header
                    userEmail={user?.email}
                    userRole={user?.role}
                    onLogout={logout}
                    onFeedbackClick={() => setIsFeedbackModalOpen(true)}
                />
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talk Not Found</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">The requested talk record could not be found.</p>
                        <Link to="/dashboard" className="mt-6 inline-block text-brand-blue dark:text-blue-400 hover:underline">
                            Return to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    // Sort history to show newest first
    const sortedHistory = [...talk.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="min-h-screen bg-brand-gray dark:bg-gray-900 transition-colors duration-200">
            <div className="no-print">
                <Header
                    userEmail={user?.email}
                    userRole={user?.role}
                    onLogout={logout}
                    onFeedbackClick={() => setIsFeedbackModalOpen(true)}
                />
            </div>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-gray-200 dark:border-gray-700 pb-5 mb-5">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{talk.topic}</h1>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Conducted by {talk.foremanName} on {new Date(talk.dateTime).toLocaleDateString()}</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0 no-print">
                            <Link to="/dashboard" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                Back to Dashboard
                            </Link>
                            {talk.recordStatus !== 'flagged' ? (
                                <button onClick={() => setIsFlagModalOpen(true)} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700">
                                    <FlagIcon className="h-4 w-4" />
                                    <span>Flag for Correction</span>
                                </button>
                            ) : (
                                <button onClick={() => setTalkToResolve(talk)} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">
                                    <CheckIcon className="h-4 w-4" />
                                    <span>Resolve Flag</span>
                                </button>
                            )}
                            <button onClick={handleDownload} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">
                                <DownloadIcon className="h-4 w-4" />
                                <span>Download Record PDF</span>
                            </button>
                        </div>
                    </div>

                    {talk.recordStatus === 'flagged' && talk.flag && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-6 rounded-r-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <InformationCircleIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-300">This report is flagged for correction.</p>
                                    <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                                        Flagged by <span className="font-medium">{talk.flag.flaggedBy}</span> on {new Date(talk.flag.flaggedAt).toLocaleDateString()}:
                                        <span className="italic"> "{talk.flag.reason}"</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="md:col-span-1 space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Talk Details</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-900 dark:text-gray-200">Foreman:</span>
                                        <span className="text-gray-800 dark:text-gray-300 text-right">{talk.foremanName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-900 dark:text-gray-200">Date:</span>
                                        <span className="text-gray-800 dark:text-gray-300 text-right">{new Date(talk.dateTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-900 dark:text-gray-200">Time:</span>
                                        <span className="text-gray-800 dark:text-gray-300 text-right">{new Date(talk.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-900 dark:text-gray-200">Location:</span>
                                        <span className="text-gray-800 dark:text-gray-300 text-right">{talk.location}</span>
                                    </div>
                                    {talk.gpsCoordinates && (
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-900 dark:text-gray-200">GPS Verification:</span>
                                            <div className="text-right">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${talk.gpsCoordinates.latitude},${talk.gpsCoordinates.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-brand-blue dark:text-blue-400 hover:underline"
                                                >
                                                    {talk.gpsCoordinates.latitude.toFixed(5)}, {talk.gpsCoordinates.longitude.toFixed(5)}
                                                </a>
                                                <span className="text-xs text-gray-600 dark:text-gray-400 block">
                                                    (±{Math.round(talk.gpsCoordinates.accuracy)}m)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {talk.topicPdfUrl && (
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="font-bold text-gray-900 dark:text-gray-200">Topic Material Used:</span>
                                            <a
                                                href={talk.topicPdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1.5 text-sm font-medium text-brand-blue dark:text-blue-400 hover:underline"
                                            >
                                                <DocumentTextIcon className="h-4 w-4" />
                                                <span>View PDF</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {talk.photoEvidence && (
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                        <CameraIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                                        Photo Evidence
                                    </h2>
                                    <img
                                        src={talk.photoEvidence}
                                        alt="Evidence"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                        onClick={() => window.open(talk.photoEvidence, '_blank')}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <ClipboardListIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                <span>Signed Crew Members ({talk.crewSignatures.length})</span>
                            </h2>
                            <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {talk.crewSignatures.length > 0 ? (
                                        talk.crewSignatures.map((member, index) => (
                                            <li key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <span className="text-gray-800 dark:text-gray-200 font-medium">{member.name}</span>
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
                                        <li className="p-4 text-center text-gray-500 dark:text-gray-400">No crew members were signed for this talk.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Activity History Section */}
                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-6">
                            <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <span>Activity History</span>
                        </h2>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {sortedHistory.map((event, eventIdx) => (
                                    <li key={eventIdx}>
                                        <div className="relative pb-8">
                                            {eventIdx !== sortedHistory.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    {getHistoryIcon(event.action)}
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                                            <span className="font-medium">{event.action.replace(/_/g, ' ')}</span>: {event.details}
                                                        </p>
                                                        {event.actor && (
                                                            <p className="text-xs text-gray-700 dark:text-gray-400 mt-0.5">By: {event.actor}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        <time dateTime={event.timestamp}>
                                                            {new Date(event.timestamp).toLocaleString()}
                                                        </time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">The foreman will be notified that this report needs correction. Please provide a clear reason.</p>
                    <label htmlFor="flagReason" className="block text-sm font-bold text-gray-900 dark:text-gray-200">
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
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="e.g., Incorrect location selected, missing signature for Bob."
                            autoFocus
                        />
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button type="button" onClick={() => setIsFlagModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={!flagReason.trim()} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md shadow-sm hover:bg-yellow-600 disabled:bg-gray-400 dark:disabled:bg-gray-600">Flag Report</button>
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