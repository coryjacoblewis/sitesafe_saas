import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTalkRecords } from '../../hooks/useTalkRecords';
import { CrewSignature, SafetyTopic } from '../../types';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import ClipboardListIcon from '../../components/icons/ClipboardListIcon';

const ReviewSubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { state } = routerLocation;

  const { topics, location, crew, foremanName, dateTime } = (state || {}) as {
    topics: SafetyTopic[];
    location: string;
    crew: CrewSignature[];
    foremanName: string;
    dateTime: string;
  };

  const { logout } = useAuth();
  const { addRecord } = useTalkRecords();

  useEffect(() => {
    if (!topics || !location || !crew || !foremanName || !dateTime) {
      console.warn("Review page loaded without necessary state, redirecting.");
      navigate('/foreman/select-talk');
    }
  }, [topics, location, crew, foremanName, dateTime, navigate]);

  const handleSubmitTalk = () => {
    topics.forEach(topic => {
      addRecord({
        dateTime: dateTime,
        location: location,
        topic: topic.name,
        topicId: topic.id,
        topicPdfUrl: topic.pdfUrl,
        foremanName: foremanName,
        crewSignatures: crew,
      });
    });

    alert(`Talk saved successfully! It will be submitted automatically when you're back online.`);
    navigate('/foreman/dashboard');
  };
  
  const signedCrewCount = useMemo(() => crew?.filter(c => c.signature).length || 0, [crew]);

  if (!topics || !location || !crew) {
    return (
        <div className="min-h-screen bg-brand-gray flex items-center justify-center">
            {/* Can show a spinner here */}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <ForemanHeader onLogout={logout} showBackButton />
      <main className="p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
            <p className="mt-1 text-gray-600">Please confirm the details below are correct before submitting.</p>
            
            <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-3">Talk Summary</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Topics Covered</h3>
                        <ul className="text-gray-800 list-disc list-inside space-y-1">
                            {topics.map(topic => <li key={topic.id}>{topic.name}</li>)}
                        </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium text-gray-500">Foreman:</div>
                        <div className="text-gray-800 text-right">{foremanName}</div>
                        
                        <div className="font-medium text-gray-500">Date:</div>
                        <div className="text-gray-800 text-right">{new Date(dateTime).toLocaleDateString()}</div>
                        
                        <div className="font-medium text-gray-500">Time:</div>
                        <div className="text-gray-800 text-right">{new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        
                        <div className="font-medium text-gray-500">Location:</div>
                        <div className="text-gray-800 text-right">{location}</div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <ClipboardListIcon className="h-6 w-6 text-gray-500"/>
                    <span>Attendees ({signedCrewCount}/{crew.length} Signed)</span>
                </h2>
                <div className="mt-3 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {crew.length > 0 ? crew.map((member, index) => (
                            <li key={index} className="flex items-center justify-between p-3">
                               <div>
                                  <span className="text-gray-800 font-medium">{member.name}</span>
                                  {member.isGuest && <span className="ml-2 text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Guest</span>}
                               </div>
                               {member.signature ? (
                                 <img 
                                   src={member.signature} 
                                   alt={`${member.name}'s signature`} 
                                   className="h-10 w-24 object-contain bg-gray-50 border border-gray-200 rounded p-1"
                                 />
                               ) : (
                                 <span className="text-sm text-red-500 italic">Not Signed</span>
                               )}
                            </li>
                        )) : (
                           <li className="p-4 text-center text-gray-500">No crew members were added to this talk.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmitTalk}
            disabled={signedCrewCount === 0}
            className="w-full py-3 px-4 bg-brand-blue text-white font-bold rounded-lg shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {signedCrewCount > 0 ? 'Confirm & Submit Talk' : 'At least one signature is required'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ReviewSubmitPage;