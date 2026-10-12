import { useState, useEffect } from 'react';
import './ToastNotice.css';

/**
 * Dispatch toast notification from anywhere in the app
 * @param {string} message
 * @param {string} icon
 * @param {string} type 'success' | 'info' | 'warning'
 */
export function showToast(message, icon = '✨', type = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gx-toast', {
        detail: { id: Date.now() + Math.random(), message, icon, type },
      })
    );
  }
}

export default function ToastNotice() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      if (!e.detail) return;
      const newToast = e.detail;
      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener('gx-toast', handleToastEvent);
    return () => window.removeEventListener('gx-toast', handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="gx-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`gx-toast-item is-${t.type}`}>
          <span className="gx-toast-icon">{t.icon}</span>
          <span className="gx-toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
