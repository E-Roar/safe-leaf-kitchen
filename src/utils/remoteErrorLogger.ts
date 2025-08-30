import { logger } from '@/lib/logger';

export interface RemoteLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  sessionId: string;
  extra?: any;
}

export class RemoteErrorLogger {
  private static sessionId = this.generateSessionId();
  private static logs: RemoteLog[] = [];
  private static maxLogs = 100;
  private static isLogging = false; // Prevent recursion
  
  static initialize() {
    // Override console methods
    this.interceptConsole();
    
    // Capture unhandled errors
    this.captureUnhandledErrors();
    
    // Log initialization
    this.log('info', 'RemoteErrorLogger initialized', { 
      browser: this.getBrowserInfo(),
      features: this.getFeatureSupport()
    });
  }

  static log(level: 'error' | 'warn' | 'info' | 'debug', message: string, extra?: any) {
    // Prevent infinite recursion
    if (this.isLogging) return;
    
    try {
      this.isLogging = true;
      
      const remoteLog: RemoteLog = {
        timestamp: new Date().toISOString(),
        level,
        message,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId,
        extra
      };

      // Add to local storage for persistence
      this.logs.push(remoteLog);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      
      // Store in localStorage with error handling
      try {
        localStorage.setItem('safeleaf_remote_logs', JSON.stringify(this.logs));
      } catch (e) {
        // Silently fail if localStorage is not available
      }

      // Log to console with special formatting for easy identification
      const prefix = `[SAFELEAF-${level.toUpperCase()}]`;
      const formatted = `${prefix} ${message}`;
      
      // Use original console methods to avoid recursion
      const originalMethods = (window as any)._originalConsole || {
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
      };
      
      switch (level) {
        case 'error':
          originalMethods.error(formatted, extra);
          break;
        case 'warn':
          originalMethods.warn(formatted, extra);
          break;
        case 'info':
          originalMethods.info(formatted, extra);
          break;
        case 'debug':
          originalMethods.debug(formatted, extra);
          break;
      }

      // Try to send to remote endpoint if available
      this.sendToRemote(remoteLog);
      
    } finally {
      this.isLogging = false;
    }
  }

  static getLogs(): RemoteLog[] {
    // Get logs from localStorage
    try {
      const stored = localStorage.getItem('safeleaf_remote_logs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to retrieve logs from localStorage');
    }
    return this.logs;
  }

  static exportLogs(): string {
    const allLogs = this.getLogs();
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      browser: this.getBrowserInfo(),
      features: this.getFeatureSupport(),
      logs: allLogs
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  static clearLogs() {
    this.logs = [];
    localStorage.removeItem('safeleaf_remote_logs');
    this.log('info', 'Logs cleared');
  }

  // Create a shareable debug URL with logs
  static createShareableDebugInfo(): string {
    const logs = this.getLogs();
    const recentErrors = logs.filter(log => log.level === 'error').slice(-5);
    const recentWarnings = logs.filter(log => log.level === 'warn').slice(-3);
    
    const debugInfo = {
      browser: this.getBrowserInfo(),
      timestamp: new Date().toISOString(),
      errors: recentErrors,
      warnings: recentWarnings,
      features: this.getFeatureSupport()
    };
    
    // Create a base64 encoded shareable string
    const encoded = btoa(JSON.stringify(debugInfo));
    return `${window.location.origin}?debug=${encoded}`;
  }

  // Decode debug info from URL
  static loadDebugFromUrl(): any {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    if (debugParam) {
      try {
        return JSON.parse(atob(debugParam));
      } catch (e) {
        console.warn('Failed to decode debug info from URL');
      }
    }
    return null;
  }

  private static generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static interceptConsole() {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    
    // Store them globally for access in log method
    (window as any)._originalConsole = {
      error: originalError,
      warn: originalWarn,
      info: originalInfo,
      debug: originalDebug
    };
    
    // Prevent infinite recursion by checking if we're already logging
    let isLogging = false;
    
    console.error = (...args) => {
      originalError.apply(console, args);
      if (!isLogging && args.length > 0 && !String(args[0]).includes('[SAFELEAF-ERROR]')) {
        isLogging = true;
        try {
          this.log('error', args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
        } catch (e) {
          // Silently fail to prevent recursion
        } finally {
          isLogging = false;
        }
      }
    };
    
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      if (!isLogging && args.length > 0 && !String(args[0]).includes('[SAFELEAF-WARN]')) {
        // Filter out repetitive Recharts ResponsiveContainer warnings
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        
        // Enhanced filter for ResponsiveContainer warnings
        if ((message.includes('width') && message.includes('height') && message.includes('ResponsiveContainer')) ||
            (message.includes('fixed numbers') && message.includes('ResponsiveContainer')) ||
            message.includes('maybe you don\'t need to use a ResponsiveContainer')) {
          return; // Skip logging this repetitive warning
        }
        
        // Filter out other common chart library warnings
        if (message.includes('recharts') && (message.includes('Warning:') || message.includes('warn2'))) {
          return; // Skip logging chart library warnings
        }
        
        // Filter out translation key warnings to prevent infinite loops
        if (message.includes('Translation key not found:') ||
            message.includes('landing.video.') ||
            message.includes('useI18n.tsx')) {
          return; // Skip logging translation warnings to prevent recursion
        }
        
        isLogging = true;
        try {
          this.log('warn', message);
        } catch (e) {
          // Silently fail to prevent recursion
        } finally {
          isLogging = false;
        }
      }
    };
  }

  private static captureUnhandledErrors() {
    window.addEventListener('error', (event) => {
      this.log('error', 'Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private static getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelDepth: screen.pixelDepth
      }
    };
  }

  private static getFeatureSupport() {
    return {
      localStorage: this.testLocalStorage(),
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.testWebGL(),
      canvas: this.testCanvas(),
      fetch: 'fetch' in window,
      intersectionObserver: 'IntersectionObserver' in window
    };
  }

  private static testLocalStorage(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static testWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private static testCanvas(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('2d');
    } catch {
      return false;
    }
  }

  private static async sendToRemote(log: RemoteLog) {
    // For now, we'll just log to console
    // In production, you could send to a webhook or logging service
    try {
      // Example: Send to a webhook
      // await fetch('YOUR_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(log)
      // });
    } catch (e) {
      // Silently fail - don't log this to avoid recursion
    }
  }

  // Helper method to display logs in a user-friendly way
  static displayDebugInfo(): void {
    const logs = this.getLogs();
    const errors = logs.filter(log => log.level === 'error');
    const warnings = logs.filter(log => log.level === 'warn');
    
    console.group('🔍 Safe Leaf Kitchen Debug Summary');
    console.log('Session ID:', this.sessionId);
    console.log('Total Logs:', logs.length);
    console.log('Errors:', errors.length);
    console.log('Warnings:', warnings.length);
    
    if (errors.length > 0) {
      console.group('Recent Errors');
      errors.slice(-5).forEach(error => {
        console.error(`[${error.timestamp}] ${error.message}`, error.extra);
      });
      console.groupEnd();
    }
    
    if (warnings.length > 0) {
      console.group('Recent Warnings');
      warnings.slice(-3).forEach(warning => {
        console.warn(`[${warning.timestamp}] ${warning.message}`, warning.extra);
      });
      console.groupEnd();
    }
    
    console.log('Browser Info:', this.getBrowserInfo());
    console.log('Feature Support:', this.getFeatureSupport());
    console.groupEnd();
  }
}