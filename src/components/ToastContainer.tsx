import React, { useContext, useEffect } from 'react';
import { InternalToastContext } from '../hooks/useToast';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import XIcon from './icons/XIcon';

const TOAST_ICONS = {
  success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
  error: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
  info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
};

const TOAST_DURATION = 5000; // 5 seconds

interface ToastProps {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, TOAST_DURATION);

    return () => {
      clearTimeout(timer);
    };
  }, [id, onDismiss]);

  return (
    <div className="max-w-sm w-full bg-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {TOAST_ICONS[type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(id)}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useContext(InternalToastContext);

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;