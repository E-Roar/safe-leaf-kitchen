import React, { useState, useEffect } from 'react';
import { Bug, Download, Smartphone, X, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
}

interface BrowserInfo {
  userAgent: string;
  vendor: string;
  platform: string;
  cookieEnabled: boolean;
  language: string;
  onLine: boolean;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    pixelDepth: number;
  };
  localStorage: {
    available: boolean;
    size: number;
    keys: string[];
  };
  serviceWorker: {
    supported: boolean;
    registered: boolean;
  };
}

export default function MobileDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'errors' | 'browser' | 'storage'>('errors');

  useEffect(() => {
    // Collect browser information
    const collectBrowserInfo = async () => {
      const info: BrowserInfo = {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          pixelDepth: screen.pixelDepth,
        },
        localStorage: {
          available: typeof Storage !== 'undefined',
          size: 0,
          keys: [],
        },
        serviceWorker: {
          supported: 'serviceWorker' in navigator,
          registered: false,
        }
      };

      // Check localStorage
      if (typeof Storage !== 'undefined') {
        info.localStorage.keys = Object.keys(localStorage);
        info.localStorage.size = JSON.stringify(localStorage).length;
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          info.serviceWorker.registered = !!registration;
        } catch (e) {
          info.serviceWorker.registered = false;
        }
      }

      setBrowserInfo(info);
    };

    collectBrowserInfo();

    // Load existing error logs
    const savedLogs = localStorage.getItem('safeleaf_debug_logs');
    if (savedLogs) {
      try {
        setErrorLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to parse saved logs:', e);
      }
    }

    // Override console methods to capture errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const logError = (level: 'error' | 'warn' | 'info', args: any[]) => {
      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        level,
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: level === 'error' && args[0] instanceof Error ? args[0].stack : undefined
      };

      setErrorLogs(prev => {
        const updated = [...prev, errorLog].slice(-50); // Keep last 50 logs
        localStorage.setItem('safeleaf_debug_logs', JSON.stringify(updated));
        return updated;
      });
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      logError('error', args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      logError('warn', args);
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      logError('error', [event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }]);
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      logError('error', ['Unhandled Promise Rejection:', event.reason]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    // Test Stats Page specific functionality
    const testStatsPageFeatures = () => {
      try {
        // Test chart library imports
        if (typeof window.recharts === 'undefined') {
          logError('warn', ['Recharts library not found in window object']);
        }

        // Test localStorage access
        const testKey = 'safeleaf_test_key';
        localStorage.setItem(testKey, 'test');
        const retrieved = localStorage.getItem(testKey);
        if (retrieved !== 'test') {
          logError('error', ['localStorage test failed']);
        } else {
          localStorage.removeItem(testKey);
          logError('info', ['localStorage test passed']);
        }

        // Test API services
        const apiService = require('@/services/apiService');
        if (apiService) {
          logError('info', ['APIService imported successfully']);
        } else {
          logError('error', ['Failed to import APIService']);
        }

        // Test analytics service
        const analyticsService = require('@/services/analyticsService');
        if (analyticsService) {
          logError('info', ['AnalyticsService imported successfully']);
        } else {
          logError('error', ['Failed to import AnalyticsService']);
        }

      } catch (e) {
        logError('error', ['Stats Page feature test failed:', e]);
      }
    };

    // Run tests after a delay to allow page to load
    setTimeout(testStatsPageFeatures, 2000);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  const clearLogs = () => {
    setErrorLogs([]);
    localStorage.removeItem('safeleaf_debug_logs');
  };

  const downloadLogs = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      browserInfo,
      errorLogs,
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        if (key.includes('safeleaf')) {
          acc[key] = localStorage.getItem(key);
        }
        return acc;
      }, {} as Record<string, string | null>)
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeleaf-debug-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareDebugInfo = async () => {
    const debugInfo = `
🔍 Safe Leaf Kitchen Debug Info
Browser: ${browserInfo?.userAgent || 'Unknown'}
Platform: ${browserInfo?.platform || 'Unknown'}
Screen: ${browserInfo?.screen.width}x${browserInfo?.screen.height}
LocalStorage: ${browserInfo?.localStorage.available ? 'Available' : 'Not Available'}
ServiceWorker: ${browserInfo?.serviceWorker.supported ? 'Supported' : 'Not Supported'}
Recent Errors: ${errorLogs.slice(-3).map(log => `${log.level}: ${log.message}`).join('\n')}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Safe Leaf Kitchen Debug Info',
          text: debugInfo,
        });
      } catch (e) {
        console.warn('Share failed, copying to clipboard instead');
        navigator.clipboard?.writeText(debugInfo);
      }
    } else {
      navigator.clipboard?.writeText(debugInfo);
      alert('Debug info copied to clipboard!');
    }
  };

  const checkChromeSpecificIssues = () => {
    const issues: string[] = [];
    
    if (browserInfo?.userAgent.includes('Chrome')) {
      if (!browserInfo?.localStorage.available) {
        issues.push('localStorage not available');
      }
      
      if (!browserInfo?.serviceWorker.supported) {
        issues.push('Service Worker not supported');
      }
      
      if (!browserInfo?.cookieEnabled) {
        issues.push('Cookies disabled');
      }
      
      // Check if in private/incognito mode
      if (typeof window.chrome !== 'undefined' && window.chrome.runtime && window.chrome.runtime.onStartup) {
        // Likely in incognito mode
        issues.push('Possible incognito/private mode');
      }
    }
    
    return issues;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-red-500 text-white p-3 rounded-full shadow-lg"
        title="Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full h-2/3 rounded-t-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Debug Panel</h3>
            {errorLogs.filter(log => log.level === 'error').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {errorLogs.filter(log => log.level === 'error').length} errors
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadLogs} className="p-2 text-gray-600 hover:bg-gray-200 rounded">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={shareDebugInfo} className="p-2 text-gray-600 hover:bg-gray-200 rounded">
              <Smartphone className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-600 hover:bg-gray-200 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'errors' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-600'
            }`}
          >
            Errors ({errorLogs.filter(log => log.level === 'error').length})
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'browser' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            Browser Info
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'storage' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600'
            }`}
          >
            Storage
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'errors' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {errorLogs.length} logs captured
                </span>
                <button onClick={clearLogs} className="text-sm text-red-600 hover:underline">
                  Clear All
                </button>
              </div>
              
              {/* Chrome-specific issues */}
              {browserInfo?.userAgent.includes('Chrome') && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Chrome Issues</span>
                  </div>
                  {checkChromeSpecificIssues().map((issue, index) => (
                    <div key={index} className="text-sm text-orange-700">• {issue}</div>
                  ))}
                  {checkChromeSpecificIssues().length === 0 && (
                    <div className="text-sm text-green-700">No Chrome-specific issues detected</div>
                  )}
                </div>
              )}
              
              {errorLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No error logs captured yet</p>
                </div>
              ) : (
                errorLogs.slice().reverse().map((log, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 text-sm ${
                      log.level === 'error' ? 'border-red-200 bg-red-50' :
                      log.level === 'warn' ? 'border-orange-200 bg-orange-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-medium ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warn' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-700 break-words">{log.message}</div>
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-600">Stack Trace</summary>
                        <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{log.stack}</pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'browser' && browserInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Browser Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>User Agent:</strong> {browserInfo.userAgent}</div>
                  <div><strong>Vendor:</strong> {browserInfo.vendor}</div>
                  <div><strong>Platform:</strong> {browserInfo.platform}</div>
                  <div><strong>Language:</strong> {browserInfo.language}</div>
                  <div><strong>Online:</strong> {browserInfo.onLine ? 'Yes' : 'No'}</div>
                  <div><strong>Cookies:</strong> {browserInfo.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Screen Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Resolution:</strong> {browserInfo.screen.width}x{browserInfo.screen.height}</div>
                  <div><strong>Available:</strong> {browserInfo.screen.availWidth}x{browserInfo.screen.availHeight}</div>
                  <div><strong>Pixel Depth:</strong> {browserInfo.screen.pixelDepth}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Feature Support</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>LocalStorage:</strong> {browserInfo.localStorage.available ? 'Supported' : 'Not Supported'}</div>
                  <div><strong>Service Worker:</strong> {browserInfo.serviceWorker.supported ? 'Supported' : 'Not Supported'}</div>
                  <div><strong>SW Registered:</strong> {browserInfo.serviceWorker.registered ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && browserInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">LocalStorage Status</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Available:</strong> {browserInfo.localStorage.available ? 'Yes' : 'No'}</div>
                  <div><strong>Size:</strong> {browserInfo.localStorage.size} bytes</div>
                  <div><strong>Keys:</strong> {browserInfo.localStorage.keys.length} total</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Safe Leaf Keys</h4>
                <div className="space-y-1">
                  {browserInfo.localStorage.keys
                    .filter(key => key.includes('safeleaf'))
                    .map(key => (
                      <div key={key} className="text-sm bg-gray-100 p-2 rounded">
                        <div className="font-mono text-xs text-gray-600">{key}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {localStorage.getItem(key)?.slice(0, 100)}...
                        </div>
                      </div>
                    ))}
                  {browserInfo.localStorage.keys.filter(key => key.includes('safeleaf')).length === 0 && (
                    <div className="text-gray-500 text-sm">No Safe Leaf data found</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}