import React, { useState, useEffect } from 'react';
import WifiOffIcon from './icons/WifiOffIcon';

const ConnectivityBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-gray-800 text-white px-4 py-3 text-center text-sm font-medium z-50 fixed bottom-0 left-0 right-0 flex justify-center items-center space-x-3 shadow-lg print:hidden">
       <WifiOffIcon className="h-5 w-5 text-gray-400" />
       <div className="flex flex-col sm:flex-row items-center sm:space-x-1">
          <span>You are currently offline.</span>
          <span className="text-gray-300 font-normal">Changes are saved locally and will sync when connection is restored.</span>
       </div>
    </div>
  );
};

export default ConnectivityBanner;