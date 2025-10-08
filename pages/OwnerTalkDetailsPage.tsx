import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTalkRecords } from '../hooks/useTalkRecords';
import Header from '../components/Header';
import FeedbackModal from '../components/FeedbackModal';
import { FeedbackSubmission } from '../types';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';

const OwnerTalkDetailsPage: React.FC = () => {
  const { talkId } = useParams<{ talkId: string }>();
  const { records } = useTalkRecords();
  const { user, logout } = useAuth();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const talk = records.find(record => record.id === talkId);

  const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
    console.log('Feedback submitted:', JSON.stringify(feedback, null, 2));
    alert('Thank you for your feedback!');
    setIsFeedbackModalOpen(false);
  };
  
  const handleDownload = () => {
    alert(`Initiating PDF download for talk record: ${talkId}`);
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
                    <div className="mt-4 md:mt-0 flex space-x-3 flex-shrink-0">
                        <Link to="/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to Dashboard
                        </Link>
                        <button onClick={handleDownload} className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">
                            <DownloadIcon className="h-4 w-4" />
                            <span>Download Record</span>
                        </button>
                    </div>
                </div>
                
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
    </div>
  );
};

export default OwnerTalkDetailsPage;