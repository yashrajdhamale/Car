import React from 'react';
import HeaderHome from './HeaderHome';
import Footer from './Footer';
import TranslateWidget from '../TranslateWidget';
import { NotificationDisplay } from '../context/NotificationContext';
import { useLocation } from 'react-router-dom';
const MainLayout = ({ children, currentIndex = 0 }) => {
  const location = useLocation();
  const hideFooter = location.pathname.includes('confirm-pickup');
  return (
    <div className="flex flex-col min-h-screen relative">
      
      {/* Translate widget – visual only */}
      <div className="pointer-events-none">
        <TranslateWidget />
      </div>

      <HeaderHome index_Current={currentIndex} />

      {/* Page content */}
       <main className="flex-grow overflow-auto p-4 relative z-10 pointer-events-auto">
        {children}
      </main>
      {!hideFooter && <Footer />}
      {/* Notifications must NOT block clicks */}
      <div className="pointer-events-none">
        <NotificationDisplay />
      </div>
    </div>
  );
};


export default MainLayout;
