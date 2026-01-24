import { logger } from '@/lib/logger';

// PWA Registration and Utilities

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.debug('ServiceWorker registration successful:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, show update notification
              showUpdateNotification();
            }
          });
        }
      });
    } catch (error) {
      logger.debug('ServiceWorker registration failed:', error);
    }
  }
};

export const showUpdateNotification = (): void => {
  if (Notification.permission === 'granted') {
    new Notification('SafeLeafKitchen Update Available', {
      body: 'A new version is available. Refresh to update.',
      icon: '/icons/icon-192x192.png',
      tag: 'update-available'
    });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const canInstallPWA = (): boolean => {
  return 'beforeinstallprompt' in window;
};

let deferredPrompt: any = null;

export const setupPWAInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
};

// Detect if user is on mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Check if app is running in PWA mode
export const isPWA = (): boolean => {
  return isStandalone() || window.matchMedia('(display-mode: standalone)').matches;
};

// Cache management utilities
export const clearAppCache = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
};

export const getCacheSize = async (): Promise<number> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
};