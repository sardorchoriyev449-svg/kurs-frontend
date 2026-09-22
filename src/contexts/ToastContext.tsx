'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    
    setToasts((prev) => [...prev, { id, type, message }]);

    // 4 soniyadan so'ng avtomatik yo'qolish
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, removeToast }}>
      {children}

      {/* Toast bildirishnomalari konteyneri - pastki o'ng burchakda */}
      <div 
        aria-live="assertive" 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
                isSuccess
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-500/5'
                  : isError
                  ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-500/5'
                  : 'bg-indigo-50/95 border-indigo-200 text-indigo-900 shadow-indigo-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {isSuccess && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 stroke-[2]" />
                )}
                {isError && (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 stroke-[2]" />
                )}
                {!isSuccess && !isError && (
                  <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5 stroke-[2]" />
                )}
                <div className="text-xs sm:text-sm font-medium leading-relaxed">
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-3 -mr-1 -mt-1 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast hooki ToastProvider ichida ishlatilishi shart");
  }
  return context;
};