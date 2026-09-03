import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { SplashScreen } from '../components/SplashScreen';

export const MainLayout: React.FC = () => {
  const [isSplashOpen, setIsSplashOpen] = useState(false);

  useEffect(() => {
    const handleOpenSplash = () => {
      setIsSplashOpen(true);
    };

    window.addEventListener('open-splash', handleOpenSplash);
    return () => window.removeEventListener('open-splash', handleOpenSplash);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SplashScreen
        isOpen={isSplashOpen}
        onClose={() => setIsSplashOpen(false)}
      />
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
