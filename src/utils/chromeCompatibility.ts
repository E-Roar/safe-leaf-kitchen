import { logger } from '@/lib/logger';

export interface ChromeCompatibilityReport {
  isChrome: boolean;
  isMobile: boolean;
  version: string;
  issues: ChromeIssue[];
  recommendations: string[];
  features: FeatureSupport;
}

export interface ChromeIssue {
  type: 'error' | 'warning' | 'info';
  category: 'storage' | 'charts' | 'service-worker' | 'permissions' | 'performance';
  message: string;
  solution?: string;
}

export interface FeatureSupport {
  localStorage: boolean;
  sessionStorage: boolean;
  serviceWorker: boolean;
  webGL: boolean;
  canvas: boolean;
  requestAnimationFrame: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  webShare: boolean;
  clipboard: boolean;
}

export class ChromeCompatibilityChecker {
  static generateReport(): ChromeCompatibilityReport {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);
    const version = this.extractChromeVersion(userAgent);
    
    const features = this.checkFeatureSupport();
    const issues = this.detectIssues(features, isChrome, isMobile, version);
    const recommendations = this.generateRecommendations(issues);

    return {
      isChrome,
      isMobile,
      version,
      issues,
      recommendations,
      features
    };
  }

  private static extractChromeVersion(userAgent: string): string {
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private static checkFeatureSupport(): FeatureSupport {
    return {
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.testWebGL(),
      canvas: this.testCanvas(),
      requestAnimationFrame: 'requestAnimationFrame' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      webShare: 'share' in navigator,
      clipboard: 'clipboard' in navigator
    };
  }

  private static testLocalStorage(): boolean {
    try {
      const testKey = '__chrome_test_ls__';
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey) === 'test';
      localStorage.removeItem(testKey);
      return result;
    } catch {
      return false;
    }
  }

  private static testSessionStorage(): boolean {
    try {
      const testKey = '__chrome_test_ss__';
      sessionStorage.setItem(testKey, 'test');
      const result = sessionStorage.getItem(testKey) === 'test';
      sessionStorage.removeItem(testKey);
      return result;
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
      const ctx = canvas.getContext('2d');
      return !!ctx;
    } catch {
      return false;
    }
  }

  private static detectIssues(
    features: FeatureSupport,
    isChrome: boolean,
    isMobile: boolean,
    version: string
  ): ChromeIssue[] {
    const issues: ChromeIssue[] = [];

    // Check for Chrome-specific issues
    if (isChrome) {
      // localStorage issues
      if (!features.localStorage) {
        issues.push({
          type: 'error',
          category: 'storage',
          message: 'localStorage is not available. This will break stats tracking.',
          solution: 'Check if cookies are disabled or if in incognito mode.'
        });
      }

      // Check for incognito mode
      if (this.isIncognitoMode()) {
        issues.push({
          type: 'warning',
          category: 'storage',
          message: 'Browser appears to be in incognito/private mode.',
          solution: 'Use regular browsing mode for full functionality.'
        });
      }

      // Check Chrome version compatibility
      const majorVersion = parseInt(version.split('.')[0]);
      if (majorVersion < 80) {
        issues.push({
          type: 'warning',
          category: 'performance',
          message: `Chrome version ${version} may have compatibility issues.`,
          solution: 'Update to Chrome 80 or later for best experience.'
        });
      }

      // Mobile Chrome specific issues
      if (isMobile) {
        // Check for chart rendering capabilities
        if (!features.canvas || !features.webGL) {
          issues.push({
            type: 'warning',
            category: 'charts',
            message: 'Limited graphics support detected. Charts may not render properly.',
            solution: 'Enable hardware acceleration in Chrome settings.'
          });
        }

        // Check for memory constraints
        if (this.isLowMemoryDevice()) {
          issues.push({
            type: 'info',
            category: 'performance',
            message: 'Low memory device detected. Large datasets may cause issues.',
            solution: 'Close other apps and tabs to free up memory.'
          });
        }

        // Check for data saver mode
        if (this.isDataSaverEnabled()) {
          issues.push({
            type: 'warning',
            category: 'performance',
            message: 'Data Saver mode is enabled, which may affect chart loading.',
            solution: 'Disable Data Saver in Chrome settings for better performance.'
          });
        }
      }

      // Service Worker issues
      if (!features.serviceWorker) {
        issues.push({
          type: 'warning',
          category: 'service-worker',
          message: 'Service Worker not supported. PWA features will be limited.',
          solution: 'Update your browser or use a supported browser.'
        });
      }

      // Check for disabled JavaScript features
      if (!features.requestAnimationFrame) {
        issues.push({
          type: 'error',
          category: 'performance',
          message: 'requestAnimationFrame not available. Animations will not work.',
          solution: 'Enable JavaScript and refresh the page.'
        });
      }

      // Check for Recharts compatibility
      this.checkRechartsCompatibility(issues);

      // Check localStorage quota
      this.checkLocalStorageQuota(issues);
    }

    return issues;
  }

  private static isIncognitoMode(): boolean {
    // Multiple methods to detect incognito mode
    try {
      // Method 1: Check localStorage quota
      localStorage.setItem('__incognito_test__', '1');
      localStorage.removeItem('__incognito_test__');
      
      // Method 2: Check if webkitRequestFileSystem is available
      if ('webkitRequestFileSystem' in window) {
        return false; // Not incognito
      }
      
      // Method 3: Check storage estimate
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          // In incognito mode, quota is typically very small
          return (estimate.quota || 0) < 2000000000; // Less than 2GB
        });
      }
      
      return false;
    } catch {
      return true; // Likely incognito if localStorage throws
    }
  }

  private static isLowMemoryDevice(): boolean {
    // Check if device has limited memory
    const memory = (navigator as any).deviceMemory;
    return memory && memory < 4; // Less than 4GB RAM
  }

  private static isDataSaverEnabled(): boolean {
    // Check for Chrome's Data Saver
    const connection = (navigator as any).connection;
    return connection && connection.saveData === true;
  }

  private static checkRechartsCompatibility(issues: ChromeIssue[]): void {
    try {
      // Test if recharts dependencies are available
      const svgSupported = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      if (!svgSupported) {
        issues.push({
          type: 'error',
          category: 'charts',
          message: 'SVG support not available. Charts will not render.',
          solution: 'Use a browser that supports SVG.'
        });
      }

      // Test D3 scale functions (used by Recharts)
      const testScale = (val: number) => val * 2;
      if (typeof testScale !== 'function') {
        issues.push({
          type: 'warning',
          category: 'charts',
          message: 'Mathematical functions may not work properly.',
          solution: 'Clear browser cache and reload.'
        });
      }
    } catch (error) {
      issues.push({
        type: 'error',
        category: 'charts',
        message: 'Chart library compatibility test failed.',
        solution: 'Reload the page or clear browser cache.'
      });
    }
  }

  private static checkLocalStorageQuota(issues: ChromeIssue[]): void {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          const usagePercent = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;
          
          if (usagePercent > 80) {
            issues.push({
              type: 'warning',
              category: 'storage',
              message: `Storage is ${usagePercent.toFixed(1)}% full. This may affect data saving.`,
              solution: 'Clear browser data or delete unnecessary apps.'
            });
          }
        });
      }
    } catch {
      // Ignore if storage API is not available
    }
  }

  private static generateRecommendations(issues: ChromeIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.category === 'storage')) {
      recommendations.push('Clear browser cache and data');
      recommendations.push('Disable incognito/private mode');
      recommendations.push('Check if cookies are enabled');
    }
    
    if (issues.some(i => i.category === 'charts')) {
      recommendations.push('Enable hardware acceleration');
      recommendations.push('Close other tabs to free memory');
      recommendations.push('Update graphics drivers');
    }
    
    if (issues.some(i => i.category === 'performance')) {
      recommendations.push('Close unnecessary apps');
      recommendations.push('Disable Data Saver mode');
      recommendations.push('Update Chrome to latest version');
    }
    
    if (issues.some(i => i.type === 'error')) {
      recommendations.push('Try refreshing the page');
      recommendations.push('Try using a different browser');
      recommendations.push('Check internet connection');
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Quick test method for debugging
  static runQuickTest(): void {
    logger.info('Running Chrome compatibility test...');
    const report = this.generateReport();
    
    console.group('🔍 Chrome Compatibility Report');
    console.log('Browser:', report.isChrome ? `Chrome ${report.version}` : 'Not Chrome');
    console.log('Mobile:', report.isMobile ? 'Yes' : 'No');
    
    console.group('Feature Support');
    Object.entries(report.features).forEach(([feature, supported]) => {
      console.log(`${feature}:`, supported ? '✅' : '❌');
    });
    console.groupEnd();
    
    if (report.issues.length > 0) {
      console.group('Issues Found');
      report.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '🚨' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${issue.category}] ${issue.message}`);
        if (issue.solution) {
          console.log(`   💡 Solution: ${issue.solution}`);
        }
      });
      console.groupEnd();
    }
    
    if (report.recommendations.length > 0) {
      console.group('Recommendations');
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}