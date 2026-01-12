import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
}

interface Toast extends ToastOptions {
    id: number;
}

interface ToastContextType {
    toast: (options: ToastOptions) => void;
    currentToast: Toast | null;
    closeToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [currentToast, setCurrentToast] = useState<Toast | null>(null);
    const toastIdRef = useRef(0);

    const toast = useCallback((options: ToastOptions) => {
        toastIdRef.current += 1;
        setCurrentToast({ ...options, id: toastIdRef.current });
    }, []);

    const closeToast = useCallback(() => {
        setCurrentToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ toast, currentToast, closeToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToastContext deve ser usado dentro de ToastProvider');
    }
    return context;
}
