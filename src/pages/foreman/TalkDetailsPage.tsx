import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTalkRecords } from '../../hooks/useTalkRecords';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import ClipboardListIcon from '../../components/icons/ClipboardListIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import InformationCircleIcon from '../../components/icons/InformationCircleIcon';

const TalkDetailsPage: React.FC = () => {
  const { talkId } = useParams<{ talkId: string }>();
  const { records } = useTalkRecords();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const talk = records.find(record => record.id === talkId);

  if (!talk) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <ForemanHeader onLogout={logout} showBackButton />
        <main className="p-4 sm:p-6">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900">Talk Not Found</h1>
            <p className="mt-2 text-gray-600">The requested talk record could not be found.</p>
            <Link to="/foreman/dashboard" className="mt-6 inline-block text-brand-blue hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <ForemanHeader onLogout={logout} showBackButton />
      <main className="p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          {talk.recordStatus === 'flagged' && talk.flag && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow">
                  <div className="flex">
                      <div className="flex-shrink-0">
                          <InformationCircleIcon className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="ml-3">
                          <p className="text-sm font-bold text-yellow-900">Correction Requested</p>
                          <p className="mt-1 text-sm text-yellow-800">
                              Reason from manager: <span className="italic">"{talk.flag.reason}"</span>
                          </p>
                           <button 
                              onClick={() => navigate(`/foreman/amend-talk/${talk.id}`)}
                              className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                            >
                                Amend This Talk
                            </button>
                      </div>
                  </div>
              </div>
          )}

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">{talk.topic}</h1>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Foreman:</span>
                <span className="text-gray-800">{talk.foremanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Date:</span>
                <span className="text-gray-800">{new Date(talk.dateTime).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Time:</span>
                <span className="text-gray-800">{new Date(talk.dateTime).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Location:</span>
                <span className="text-gray-800">{talk.location}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <ClipboardListIcon className="h-6 w-6 text-gray-500"/>
                <span>Signed Crew Members ({talk.crewSignatures.length})</span>
            </h2>
            <div className="mt-3 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200">
                {talk.crewSignatures.map((member, index) => (
                    <li key={index} className="flex items-center justify-between p-3">
                       <span className="text-gray-800 font-medium">{member.name}</span>
                       {member.signature ? (
                         <img 
                           src={member.signature} 
                           alt={`${member.name}'s signature`} 
                           className="h-10 w-24 object-contain bg-gray-100 border border-gray-300 rounded"
                         />
                       ) : (
                         <span className="text-sm text-gray-400 italic">No signature image</span>
                       )}
                    </li>
                ))}
                </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TalkDetailsPage;