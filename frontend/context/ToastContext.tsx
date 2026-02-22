import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
    toast: { message: string; type: ToastType; visible: boolean };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    const timeoutRef = useRef<any>(null);

    const showToast = useCallback(({ message, type = 'success', duration = 3000 }: ToastOptions) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setToast({ message, type, visible: true });

        timeoutRef.current = setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, duration);
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, toast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Internal hook for the Toast component to listen to state
export const useToastState = () => {
    const context = useContext(ToastContext);
    // Since we only use this in the Toast component which is inside the provider, we don't need to check.
    // However, to satisfy types and state, we'll expose the internal state too if needed, 
    // but better to keep it simple and just use the context for the component too.
    return context;
};
