import React, { useState, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'chat'>('landing');

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  const navigateToChat = () => setCurrentView('chat');
  const navigateToLanding = () => setCurrentView('landing');

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage onNavigateToChat={navigateToChat} />
      ) : (
        <ChatInterface onBack={navigateToLanding} />
      )}
    </>
  );
};

export default Index;
