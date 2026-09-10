import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import dashboardService from '../../services/dashboardService';

export function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await dashboardService.checkHealth();
        if (isMounted) setHealthStatus(res);
      } catch (err) {
        if (isMounted) setHealthStatus({ status: 'offline', error: err.message });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} healthStatus={healthStatus} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default Layout;
