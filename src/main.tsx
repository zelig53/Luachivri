import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50" dir="rtl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <RefreshCw className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">אופס, משהו השתבש</h2>
          <p className="text-gray-500 mb-8 font-bold">אירעה שגיאה בלתי צפויה בטעינת האפליקציה.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#002F6C] text-white px-10 py-4 rounded-3xl font-black shadow-xl hover:scale-105 transition-all"
          >
            רענן אפליקציה
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
