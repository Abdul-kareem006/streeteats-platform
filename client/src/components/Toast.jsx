import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type, entering: true }]);
        // Mark as entered after animation
        setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, entering: false } : t)), 50);
        // Start exit animation
        setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t)), duration);
        // Remove from DOM
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 400);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            {/* Toast container */}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: '380px' }}>
                {toasts.map(toast => {
                    const Icon = icons[toast.type] || Info;
                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-xl backdrop-blur-sm ${colors[toast.type] || colors.info}`}
                            style={{
                                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: toast.entering || toast.exiting ? 0 : 1,
                                transform: toast.entering ? 'translateX(100%)' : toast.exiting ? 'translateX(100%)' : 'translateX(0)',
                            }}
                        >
                            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
                            <p className="text-sm font-medium flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
                            >
                                <X className="h-4 w-4 opacity-50" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
