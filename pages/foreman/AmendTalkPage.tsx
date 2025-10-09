import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTalkRecords } from '../../hooks/useTalkRecords';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import { useLocations } from '../../hooks/useLocations';
import { useToast } from '../../hooks/useToast';
import { CrewSignature, TalkRecord, ChangeLog } from '../../types';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import SignaturePad from '../../components/SignaturePad';
import Modal from '../../components/Modal';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import UserPlusIcon from '../../components/icons/UserPlusIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import PencilIcon from '../../components/icons/PencilIcon';
import XIcon from '../../components/icons/XIcon';
import TrashIcon from '../../components/icons/TrashIcon';

const AmendTalkPage: React.FC = () => {
    const { talkId } = useParams<{ talkId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const { user, logout } = useAuth();
    const { records, updateTalkRecord } = useTalkRecords();
    const { crewMembers } = useCrewMembers();
    const { locations } = useLocations();

    const originalTalk = useMemo(() => records.find(r => r.id === talkId), [records, talkId]);

    const [location, setLocation] = useState('');
    const [crew, setCrew] = useState<CrewSignature[]>([]);
    const [amendmentReason, setAmendmentReason] = useState('');
    
    const [crewMembersToAdd, setCrewMembersToAdd] = useState<string[]>([]);
    const [signingCrewMember, setSigningCrewMember] = useState<CrewSignature | null>(null);
    const [crewMemberToClear, setCrewMemberToClear] = useState<CrewSignature | null>(null);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [guestName, setGuestName] = useState('');

    const signaturePadRef = useRef<{ clear: () => void; getSignature: () => string | null }>(null);

    useEffect(() => {
        if (originalTalk) {
            setLocation(originalTalk.location);
            setCrew(originalTalk.crewSignatures);
        } else {
            // If the talk isn't found (e.g., on a page refresh before records have loaded),
            // we might want to wait or redirect. For now, we'll redirect if it's missing after loading.
            if (records.length > 0) {
                 showToast("The talk you are trying to amend could not be found.", { type: 'error' });
                 navigate('/foreman/dashboard');
            }
        }
    }, [originalTalk, records, navigate, showToast]);

    const activeLocations = useMemo(() => locations.filter(l => l.status === 'active'), [locations]);

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
            setCrewMembersToAdd([]);
        }
    };
  
    const handleAddGuestMember = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = guestName.trim();
        if (trimmedName) {
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
    
    const getChanges = (): string[] => {
        if (!originalTalk) return [];
        const changes: string[] = [];

        // 1. Check location
        if (originalTalk.location !== location) {
            changes.push(`Location changed from "${originalTalk.location}" to "${location}".`);
        }

        const originalCrewMap = new Map(originalTalk.crewSignatures.map(c => [c.name, c.signature]));
        const newCrewMap = new Map(crew.map(c => [c.name, c.signature]));

        // 2. Check for added/removed crew
        const added = [...newCrewMap.keys()].filter(name => !originalCrewMap.has(name));
        const removed = [...originalCrewMap.keys()].filter(name => !newCrewMap.has(name));

        if (added.length > 0) changes.push(`Added crew: ${added.join(', ')}.`);
        if (removed.length > 0) changes.push(`Removed crew: ${removed.join(', ')}.`);

        // 3. Check for signature changes on existing crew
        const signatureUpdates: string[] = [];
        newCrewMap.forEach((newSig, name) => {
            if (originalCrewMap.has(name)) { // Check only members that existed before
                const oldSig = originalCrewMap.get(name);
                if (oldSig !== newSig) {
                    signatureUpdates.push(name);
                }
            }
        });

        if (signatureUpdates.length > 0) {
            changes.push(`Updated signatures for: ${signatureUpdates.join(', ')}.`);
        }

        return changes;
    };


    const handleSubmitAmendment = async () => {
        if (!originalTalk || !user) return;
        if (!amendmentReason.trim()) {
            showToast("Please provide a reason for the amendment.", { type: 'error' });
            return;
        }

        const changes = getChanges();
        if (changes.length === 0) {
            showToast("No changes were made to the report.", { type: 'info' });
            return;
        }

        const updates: Partial<TalkRecord> = {
            location,
            crewSignatures: crew,
            recordStatus: 'submitted', // Clears the 'flagged' status
            flag: undefined,
        };

        const changeLog: ChangeLog = {
            timestamp: new Date().toISOString(),
            action: 'AMENDED',
            details: `Report amended. Reason: "${amendmentReason.trim()}". Changes: ${changes.join(' ')}`,
            actor: user.email,
        };
        
        await updateTalkRecord(originalTalk.id, updates, changeLog);
        showToast("Talk record successfully amended.", { type: 'success' });
        navigate('/foreman/dashboard');
    };

    if (!originalTalk) {
        return (
            <div className="min-h-screen bg-brand-gray flex items-center justify-center">
                <SpinnerIcon className="h-10 w-10 text-brand-blue" />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-brand-gray">
            <ForemanHeader onLogout={logout} showBackButton backPath={`/foreman/talk-details/${talkId}`} />
            <main className="p-4 sm:p-6 pb-24">
                <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900">Amend Talk: {originalTalk.topic}</h1>
                    <p className="mt-1 text-gray-600">Correct the details for the talk conducted on {new Date(originalTalk.dateTime).toLocaleDateString()}.</p>
                    
                    <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                            <select
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-gray-900 bg-white"
                                disabled={activeLocations.length === 0}
                            >
                                {activeLocations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                            </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700">Crew Attendance</label>
                           <p className="text-xs text-gray-500">Add or remove crew members. Signatures for existing crew are preserved.</p>
                        </div>
                    </div>
                     <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                       <div className="space-y-3">
                         <MultiSelectDropdown
                            label="Crew Member"
                            options={availableCrewMembers}
                            selectedValues={crewMembersToAdd}
                            onChange={setCrewMembersToAdd}
                            placeholder={availableCrewMembers.length > 0 ? "Select permanent crew..." : "All active crew added"}
                         />
                         <button type="button" onClick={handleAddPermanentCrew} className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-brand-blue text-white font-medium rounded-md shadow-sm hover:bg-brand-blue-dark disabled:bg-gray-400" disabled={crewMembersToAdd.length === 0}>
                           <PlusIcon className="h-5 w-5" />
                           <span>Add {crewMembersToAdd.length > 0 ? `${crewMembersToAdd.length} Member(s)` : 'From Roster'}</span>
                         </button>
                         <div className="relative flex items-center"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink mx-4 text-xs text-gray-500 uppercase">Or</span><div className="flex-grow border-t border-gray-200"></div></div>
                         <button type="button" onClick={() => setIsGuestModalOpen(true)} className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50">
                           <UserPlusIcon className="h-5 w-5" />
                           <span>Add Temporary Member</span>
                         </button>
                       </div>
                    </div>
                     <ul className="mt-2 space-y-2">
                        {crew.map((member) => (
                          <li key={member.name} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                                <div>
                                    <span className="text-gray-800 font-medium">{member.name}</span>
                                    {member.isGuest && <span className="ml-2 text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Guest</span>}
                                </div>
                                <div className="flex items-center space-x-2">
                                    {member.signature ? (
                                        <div className="flex items-center space-x-2">
                                            <img 
                                                src={member.signature} 
                                                alt={`${member.name}'s signature`} 
                                                className="h-10 w-24 object-contain bg-gray-50 border border-gray-200 rounded p-1"
                                            />
                                            <button onClick={() => setCrewMemberToClear(member)} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Clear signature for ${member.name}`}>
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setSigningCrewMember(member)} className="inline-flex items-center space-x-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">
                                            <PencilIcon className="h-4 w-4" />
                                            <span>Sign</span>
                                        </button>
                                    )}
                                    <button onClick={() => handleRemoveCrewMember(member.name)} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Remove ${member.name}`}>
                                        <XIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                     <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                         <label htmlFor="amendmentReason" className="block text-sm font-medium text-gray-700">Reason for Amendment</label>
                         <p className="text-xs text-gray-500">This will be logged in the report's history.</p>
                         <textarea
                            id="amendmentReason"
                            rows={3}
                            value={amendmentReason}
                            onChange={(e) => setAmendmentReason(e.target.value)}
                            className="mt-2 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-gray-900 bg-white"
                            placeholder="e.g., Corrected the location from Site A to Site B."
                         />
                    </div>
                </div>
            </main>
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSubmitAmendment}
                        disabled={!amendmentReason.trim()}
                        className="w-full py-3 px-4 bg-brand-blue text-white font-bold rounded-lg shadow-sm hover:bg-brand-blue-dark disabled:bg-gray-400"
                    >
                        Submit Amendment
                    </button>
                </div>
            </footer>
             {signingCrewMember && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                     <div className="p-4 border-b border-gray-200"><h3 className="text-lg font-bold">Signature for {signingCrewMember.name}</h3></div>
                     <div className="p-4"><SignaturePad ref={signaturePadRef} /></div>
                     <div className="p-4 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                        <button onClick={() => signaturePadRef.current?.clear()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Clear</button>
                        <button onClick={() => setSigningCrewMember(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSaveSignature} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark">Save Signature</button>
                     </div>
                  </div>
                </div>
            )}
             {crewMemberToClear && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                     <h3 className="text-lg font-bold text-gray-900">Clear Signature?</h3>
                     <p className="mt-2 text-sm text-gray-600">Are you sure you want to clear the signature for <span className="font-bold">{crewMemberToClear.name}</span>?</p>
                     <div className="mt-6 flex justify-center space-x-3">
                        <button onClick={() => setCrewMemberToClear(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 w-24">Cancel</button>
                        <button onClick={handleConfirmClearSignature} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 w-24">Clear</button>
                     </div>
                  </div>
                </div>
            )}
            <Modal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} title="Add Temporary Crew Member">
                 <form onSubmit={handleAddGuestMember}>
                    <p className="text-sm text-gray-600 mb-4">Add someone not on the permanent roster. They will be sent for manager approval.</p>
                    <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1">
                        <input id="guestName" name="guestName" type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-gray-900" autoFocus />
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

export default AmendTalkPage;