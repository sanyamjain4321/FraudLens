import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with rich blue tint */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Popup Box with scaling pop animation */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl border border-sky-200 shadow-2xl shadow-sky-900/20 overflow-hidden z-10 animate-modal-pop`}
      >
        {/* Modal Header with Blue Gradient Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 to-indigo-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 font-semibold mt-0.5">{subtitle}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto font-sans">{children}</div>
      </div>
    </div>
  );
}
