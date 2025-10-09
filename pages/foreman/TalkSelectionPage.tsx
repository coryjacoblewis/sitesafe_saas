import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSafetyTopics } from '../../hooks/useSafetyTopics';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import SearchIcon from '../../components/icons/SearchIcon';
import InformationCircleIcon from '../../components/icons/InformationCircleIcon';
import TopicPreviewModal from '../../components/foreman/TopicPreviewModal';
import { SafetyTopic } from '../../types';

const TalkSelectionPage: React.FC = () => {
  const { logout } = useAuth();
  const { safetyTopics } = useSafetyTopics();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [previewingTopic, setPreviewingTopic] = useState<SafetyTopic | null>(null);

  const filteredTopics = useMemo(() => {
    return safetyTopics.filter(topic =>
      topic.status === 'active' &&
      topic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, safetyTopics]);

  const handleToggleTopic = (topicName: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName]
    );
  };

  const handleContinue = () => {
    if (selectedTopics.length > 0) {
      navigate('/foreman/capture-signatures', { state: { topics: selectedTopics } });
    }
  };

  return (
    <div className="bg-brand-gray min-h-screen">
      <ForemanHeader onLogout={logout} showBackButton backPath="/foreman/dashboard" />
      
      {/* 
        The main content area is padded to account for the sticky header (h-16 -> pt-16) 
        and the fixed footer (pb-24) allowing the entire page to scroll naturally.
      */}
      <main className="pt-16 pb-24">
        <div className="max-w-md mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Select Topic(s)</h1>
          <p className="mt-1 text-gray-600">Choose one or more safety topics for today's toolbox talk.</p>
          
          <div className="mt-6 relative">
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

          <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <ul className="divide-y divide-gray-200">
              {filteredTopics.length > 0 ? (
                filteredTopics.map(topic => {
                  const isSelected = selectedTopics.includes(topic.name);
                  return (
                    <li key={topic.id} className={`${isSelected ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <label htmlFor={`topic-${topic.id}`} className="flex-grow flex items-center cursor-pointer">
                              <span className="font-medium text-gray-800">{topic.name}</span>
                          </label>
                          <div className="flex items-center space-x-3 ml-4">
                              <button
                                  onClick={() => setPreviewingTopic(topic)}
                                  className="p-1 text-gray-400 hover:text-brand-blue"
                                  aria-label={`Preview topic: ${topic.name}`}
                              >
                                  <InformationCircleIcon className="h-6 w-6" />
                              </button>
                              <input
                                  id={`topic-${topic.id}`}
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleTopic(topic.name)}
                                  className="h-5 w-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                  style={{ colorScheme: 'light' }}
                              />
                          </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="p-4 text-center text-gray-500">
                  No topics found.
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleContinue}
            disabled={selectedTopics.length === 0}
            className="w-full py-3 px-4 bg-brand-blue text-white font-bold rounded-lg shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {selectedTopics.length > 0 ? `Continue with ${selectedTopics.length} Topic(s)` : 'Select at least one topic'}
          </button>
        </div>
      </footer>

      <TopicPreviewModal 
        topic={previewingTopic}
        onClose={() => setPreviewingTopic(null)}
      />
    </div>
  );
};

export default TalkSelectionPage;