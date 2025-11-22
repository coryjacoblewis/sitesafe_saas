import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const InternalToastContext = createContext<{ toasts: Toast[]; removeToast: (id: number) => void; }>({ toasts: [], removeToast: () => {} });

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const { type = 'info' } = options;
    const newToast: Toast = {
      id: Date.now(),
      message,
      type,
    };
    setToasts(currentToasts => [...currentToasts, newToast]);
  }, []);

  const internalValue = { toasts, removeToast };
  const publicValue = { showToast };

  // FIX: The original code used JSX in a .ts file, which is not allowed and caused parsing errors.
  // Replaced with React.createElement to resolve the issue.
  return React.createElement(
    ToastContext.Provider,
    { value: publicValue },
    React.createElement(
      InternalToastContext.Provider,
      { value: internalValue },
      children
    )
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
