import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTalkRecords } from '../../hooks/useTalkRecords';
import { useToast } from '../../hooks/useToast';
import { CrewSignature, SafetyTopic } from '../../types';
import ForemanHeader from '../../components/foreman/ForemanHeader';
import ClipboardListIcon from '../../components/icons/ClipboardListIcon';
import SpinnerIcon from '../../components/icons/SpinnerIcon';
import CameraIcon from '../../components/icons/CameraIcon';
import TrashIcon from '../../components/icons/TrashIcon';

const DRAFT_KEY = 'siteSafeDraftTalk';

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
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!topics || !location || !crew || !foremanName || !dateTime) {
      console.warn("Review page loaded without necessary state, redirecting.");
      navigate('/foreman/select-talk');
    }
  }, [topics, location, crew, foremanName, dateTime, navigate]);

  const getPosition = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
      }
    });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Photo is too large (max 5MB).', {type: 'error'});
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmitTalk = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatusText('Verifying location...');

    let gpsCoordinates = undefined;

    try {
        const position = await getPosition();
        gpsCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };
        showToast('Location verified.', { type: 'success' });
    } catch (error) {
        console.warn("GPS failed", error);
        showToast('Could not verify location. Submitting without GPS.', { type: 'info' });
        // Proceed without GPS coordinates - MVP "soft fail"
    }

    setStatusText('Submitting...');

    try {
      // Create an array of promises to ensure all records are saved before navigating
      const submissionPromises = topics.map(topic =>
        addRecord({
          dateTime: dateTime,
          location: location,
          topic: topic.name,
          topicId: topic.id,
          topicPdfUrl: topic.pdfUrl,
          foremanName: foremanName,
          crewSignatures: crew,
          gpsCoordinates: gpsCoordinates,
          photoEvidence: photo || undefined,
        })
      );

      await Promise.all(submissionPromises);

      localStorage.removeItem(DRAFT_KEY);
      showToast('Talk saved! It will sync when you are online.', { type: 'success' });
      navigate('/foreman/dashboard');
    } catch (error) {
      console.error("Failed to submit talks:", error);
      showToast('Failed to save talks. Please try again.', { type: 'error' });
      setIsSubmitting(false);
    }
  };
  
  const signedCrewCount = useMemo(() => crew?.filter(c => c.signature).length || 0, [crew]);

  if (!topics || !location || !crew) {
    return (
        <div className="min-h-screen bg-brand-gray flex items-center justify-center">
             <SpinnerIcon className="h-10 w-10 text-brand-blue" />
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
            
            <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Photo Evidence (Optional)</h2>
                <p className="text-sm text-gray-500 mb-4">Take a photo of the crew or the hazard discussed to provide proof of attendance.</p>
                
                {photo ? (
                    <div className="relative">
                        <img src={photo} alt="Evidence" className="w-full rounded-lg border border-gray-300" />
                        <button 
                            onClick={() => setPhoto(null)} 
                            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md text-red-600 hover:bg-gray-100"
                            aria-label="Remove photo"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <CameraIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 font-semibold">Tap to take a photo</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoCapture} />
                    </label>
                )}
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
            disabled={signedCrewCount === 0 || isSubmitting}
            className="w-full py-3 px-4 bg-brand-blue text-white font-bold rounded-lg shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
             {isSubmitting && <SpinnerIcon className="h-5 w-5 text-white" />}
             <span>{isSubmitting ? statusText : (signedCrewCount > 0 ? 'Confirm & Submit Talk' : 'At least one signature is required')}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ReviewSubmitPage;