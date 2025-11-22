import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import { useSafetyTopics } from '../../hooks/useSafetyTopics';
import { useLocations } from '../../hooks/useLocations';
import { useToast } from '../../hooks/useToast';
import { CrewSignature } from '../../types';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import SignaturePad from '../../components/SignaturePad';
import Modal from '../../components/Modal';
import PlusIcon from '../../components/icons/PlusIcon';
import PencilIcon from '../../components/icons/PencilIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import XIcon from '../../components/icons/XIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import DocumentTextIcon from '../../components/icons/DocumentTextIcon';
import UserPlusIcon from '../../components/icons/UserPlusIcon';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';

const DRAFT_KEY = 'siteSafeDraftTalk';

const SignatureCapturePage: React.FC = () => {
  const navigate = useNavigate();
  const locationRouter = useLocation();
  const { showToast } = useToast();
  
  const { user, logout } = useAuth();
  const { crewMembers } = useCrewMembers();
  const { safetyTopics } = useSafetyTopics();
  const { locations } = useLocations();

  const activeLocations = useMemo(() => locations.filter(l => l.status === 'active'), [locations]);

  // Load initial state from either a resumed draft or the topic selection page
  const { topics: topicsFromSelection, resumeDraft } = (locationRouter.state || {}) as { topics?: string[], resumeDraft?: boolean };

  const getInitialDraft = () => {
    if (resumeDraft) {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                return JSON.parse(savedDraft);
            } catch (e) {
                console.error("Failed to parse draft, clearing.", e);
                localStorage.removeItem(DRAFT_KEY);
            }
        }
    }
    return null;
  }

  const initialDraft = getInitialDraft();
  const topics = useMemo(() => initialDraft?.topics || topicsFromSelection || [], [initialDraft, topicsFromSelection]);
  
  const [location, setLocation] = useState(initialDraft?.location || (activeLocations.length > 0 ? activeLocations[0].name : ''));
  const [crew, setCrew] = useState<CrewSignature[]>(initialDraft?.crew || []);
  const [crewMembersToAdd, setCrewMembersToAdd] = useState<string[]>([]);
  const [signingCrewMember, setSigningCrewMember] = useState<CrewSignature | null>(null);
  const [crewMemberToClear, setCrewMemberToClear] = useState<CrewSignature | null>(null);
  
  // State for adding a temporary guest
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');

  const signaturePadRef = useRef<{ clear: () => void; getSignature: () => string | null }>(null);

  useEffect(() => {
    if (!topics || topics.length === 0) {
      console.warn("No topics found in location state or draft, redirecting.");
      navigate('/foreman/select-talk');
    }
  }, [topics, navigate]);

  useEffect(() => {
    // Save draft to local storage on any change
    if (topics && topics.length > 0) {
        const draft = { topics, location, crew };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [topics, location, crew]);


  useEffect(() => {
    // If locations load after component mounts and location isn't set, set a default
    if (!location && activeLocations.length > 0) {
      setLocation(activeLocations[0].name);
    }
  }, [activeLocations, location]);
  
  const availableCrewMembers = useMemo(() => {
    const activeCrewFromMaster = crewMembers.filter(cm => cm.status === 'active').map(cm => cm.name);
    const addedNames = new Set(crew.map(c => c.name));
    return activeCrewFromMaster.filter(name => !addedNames.has(name));
  }, [crew, crewMembers]);

  const handleAddPermanentCrew = () => {
    if (crewMembersToAdd.length > 0) {
      const newCrewMembers = crewMembersToAdd
        .filter(name => !crew.some(c => c.name === name))
        .map(name => ({ name, signature: null as string | null }));
      
      setCrew(prevCrew => [...prevCrew, ...newCrewMembers]);
      setCrewMembersToAdd([]); // Clear selection after adding
    }
  };
  
  const handleAddGuestMember = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = guestName.trim();
    if (trimmedName) {
      // Check if name already exists in master or current list
      const isDuplicate = crewMembers.some(cm => cm.name.toLowerCase() === trimmedName.toLowerCase()) || crew.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        showToast(`A crew member named "${trimmedName}" already exists.`, { type: 'error' });
        return;
      }
      
      const newGuest: CrewSignature = { name: trimmedName, signature: null, isGuest: true };
      setCrew(prevCrew => [...prevCrew, newGuest]);
      setGuestName('');
      setIsGuestModalOpen(false);
    }
  };

  const handleRemoveCrewMember = (nameToRemove: string) => {
    setCrew(crew.filter(c => c.name !== nameToRemove));
  };

  const handleSaveSignature = () => {
    if (signingCrewMember && signaturePadRef.current) {
      const signature = signaturePadRef.current.getSignature();
      if (signature) {
        setCrew(crew.map(c => c.name === signingCrewMember.name ? { ...c, signature } : c));
        setSigningCrewMember(null);
      }
    }
  };

  const handleConfirmClearSignature = () => {
    if (crewMemberToClear) {
      setCrew(crew.map(c => c.name === crewMemberToClear.name ? { ...c, signature: null } : c));
      setCrewMemberToClear(null);
    }
  };

  const handleContinueToReview = () => {
    if (!location) {
        showToast("Please select a location.", { type: 'error' });
        return;
    }
     if (crew.length === 0) {
        showToast("Please add at least one crew member.", { type: 'error' });
        return;
    }

    const fullTopics = topics.map(name => safetyTopics.find(t => t.name === name)).filter(Boolean);
    if (fullTopics.length !== topics.length) {
        showToast("Topic data missing. Please go back and re-select.", { type: 'error' });
        return;
    }

    navigate('/foreman/review-submit', { 
        state: { 
            topics: fullTopics, // Pass full SafetyTopic objects for versioning
            location, 
            crew,
            foremanName: user?.email,
            dateTime: new Date().toISOString()
        } 
    });
  };

  return (
    <div className="min-h-screen bg-brand-gray">
      <ForemanHeader onLogout={logout} showBackButton />
      <main className="p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">Toolbox Talk Summary</h1>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="topicsCovered" className="block text-sm font-medium text-gray-500 mb-1">Topics Covered</label>
                <div id="topicsCovered" className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {topics.map(topicName => {
                      const topicData = safetyTopics.find(t => t.name === topicName);
                      return (
                        <li key={topicName} className="flex items-center justify-between py-2">
                          <span className="text-gray-800">{topicName}</span>
                          {topicData && (
                            <a
                              href={topicData.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-sm font-medium text-brand-blue hover:underline"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                              <span>View PDF</span>
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div>
                <label htmlFor="foremanName" className="block text-sm font-medium text-gray-500">Foreman</label>
                <p id="foremanName" className="text-gray-800">{user?.email}</p>
              </div>
              <div>
                <label htmlFor="dateTime" className="block text-sm font-medium text-gray-500">Date & Time</label>
                <p id="dateTime" className="text-gray-800">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-gray-900 bg-white"
                  style={{ colorScheme: 'light' }}
                  disabled={activeLocations.length === 0}
                >
                  {activeLocations.length > 0 ? (
                    activeLocations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))
                  ) : (
                    <option>No active locations available</option>
                  )}
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-800">Crew Signatures</h2>
            <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
               <div className="space-y-3">
                 <MultiSelectDropdown
                    label="Crew Member"
                    options={availableCrewMembers}
                    selectedValues={crewMembersToAdd}
                    onChange={setCrewMembersToAdd}
                    disabled={availableCrewMembers.length === 0}
                    placeholder={availableCrewMembers.length > 0 ? "Select permanent crew..." : "All active crew added"}
                 />
                 <button 
                    type="button"
                    onClick={handleAddPermanentCrew}
                    className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-brand-blue text-white font-medium rounded-md shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={crewMembersToAdd.length === 0}
                    aria-label="Add selected crew members"
                 >
                   <PlusIcon className="h-5 w-5" />
                   <span>
                      {crewMembersToAdd.length > 0 ? `Add ${crewMembersToAdd.length} Member(s)` : 'Add From Roster'}
                   </span>
                 </button>
                 <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-500 uppercase">Or</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                 </div>
                 <button 
                    type="button"
                    onClick={() => setIsGuestModalOpen(true)}
                    className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                 >
                   <UserPlusIcon className="h-5 w-5" />
                   <span>Add Temporary Member</span>
                 </button>
               </div>
            </div>
            <ul className="mt-2 space-y-2">
              {crew.length === 0 ? (
                <li className="text-center text-gray-500 py-4">No crew members added yet.</li>
              ) : (
                crew.map((member) => (
                  <li key={member.name} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                    <div className="flex items-center space-x-3">
                        {member.signature ? <CheckIcon className="h-6 w-6 text-green-500" /> : <PencilIcon className="h-6 w-6 text-gray-400" />}
                        <span className="text-gray-800">{member.name}</span>
                        {member.isGuest && <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Guest</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                       {member.signature ? (
                        <div className="flex items-center space-x-2">
                           <span className="text-sm font-medium text-green-600">Signed</span>
                           <button onClick={() => setCrewMemberToClear(member)} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Clear signature for ${member.name}`}>
                               <TrashIcon className="h-4 w-4" />
                           </button>
                        </div>
                      ) : (
                        <button onClick={() => setSigningCrewMember(member)} className="text-sm font-medium text-brand-blue hover:underline">
                            Sign
                        </button>
                      )}
                       <button onClick={() => handleRemoveCrewMember(member.name)} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Remove ${member.name}`}>
                         <XIcon className="h-4 w-4" />
                       </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleContinueToReview}
            disabled={!location || crew.length === 0}
            className="w-full py-3 px-4 bg-brand-blue text-white font-bold rounded-lg shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continue to Review ({crew.filter(c => c.signature).length}/{crew.length} Signed)
          </button>
        </div>
      </footer>
      
      {/* Signature Modal */}
      {signingCrewMember && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
             <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold">Signature for {signingCrewMember.name}</h3>
                <p className="text-sm text-gray-600">Please sign in the box below.</p>
             </div>
             <div className="p-4">
                <SignaturePad ref={signaturePadRef} />
             </div>
             <div className="p-4 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                <button onClick={() => signaturePadRef.current?.clear()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Clear</button>
                <button onClick={() => setSigningCrewMember(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveSignature} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark">Save Signature</button>
             </div>
          </div>
        </div>
      )}

      {/* Clear Signature Confirmation Modal */}
      {crewMemberToClear && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
             <h3 className="text-lg font-bold text-gray-900">Clear Signature?</h3>
             <p className="mt-2 text-sm text-gray-600">
               Are you sure you want to clear the signature for <span className="font-bold">{crewMemberToClear.name}</span>? They will need to sign again.
             </p>
             <div className="mt-6 flex justify-center space-x-3">
                <button onClick={() => setCrewMemberToClear(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 w-24">
                    Cancel
                </button>
                <button onClick={handleConfirmClearSignature} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 w-24">
                    Clear
                </button>
             </div>
          </div>
        </div>
      )}

       {/* Add Guest Modal */}
      <Modal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} title="Add Temporary Crew Member">
         <form onSubmit={handleAddGuestMember}>
            <p className="text-sm text-gray-600 mb-4">Add someone who is not on the permanent crew roster (e.g., a subcontractor). They will be added to this talk only and sent to a manager for approval to the main roster.</p>
            <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">
                Full Name
            </label>
            <div className="mt-1">
                <input
                    id="guestName"
                    name="guestName"
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900"
                    style={{ colorScheme: 'light' }}
                    placeholder="e.g., Bob the Electrician"
                    autoFocus
                />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
                 <button type="button" onClick={() => setIsGuestModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                 <button type="submit" disabled={!guestName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark disabled:bg-gray-400">Add Member</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default SignatureCapturePage;