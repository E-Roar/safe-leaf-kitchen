import { useEffect, useRef } from 'react';

interface VanillaTiltOptions {
  max?: number;
  speed?: number;
  glare?: boolean;
  'max-glare'?: number;
  scale?: number;
  perspective?: number;
  transition?: boolean;
  axis?: 'x' | 'y' | null;
  reset?: boolean;
  easing?: string;
  gyroscope?: boolean;
  gyroscopeMinAngleX?: number;
  gyroscopeMaxAngleX?: number;
  gyroscopeMinAngleY?: number;
  gyroscopeMaxAngleY?: number;
  gyroscopeSamples?: number;
}

declare global {
  interface Window {
    VanillaTilt: {
      init: (element: HTMLElement, options?: VanillaTiltOptions) => void;
      destroy: (element: HTMLElement) => void;
    };
  }
}

export const useVanillaTilt = <T extends HTMLElement = HTMLDivElement>(options: VanillaTiltOptions = {}) => {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Load vanilla-tilt script if not already loaded
    const loadVanillaTilt = async () => {
      if (!window.VanillaTilt) {
        try {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/dist/vanilla-tilt.min.js';
          script.async = true;
          
          const loadPromise = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          document.head.appendChild(script);
          await loadPromise;
        } catch (error) {
          console.warn('Failed to load vanilla-tilt:', error);
          return;
        }
      }

      // Initialize vanilla-tilt with default options
      const defaultOptions: VanillaTiltOptions = {
        max: 15,
        speed: 400,
        glare: true,
        'max-glare': 0.2,
        scale: 1.05,
        perspective: 1000,
        transition: true,
        axis: null,
        reset: true,
        easing: 'cubic-bezier(.03,.98,.52,.99)',
        ...options
      };

      if (window.VanillaTilt) {
        window.VanillaTilt.init(element, defaultOptions);
      }
    };

    loadVanillaTilt();

    // Cleanup function
    return () => {
      if (element && window.VanillaTilt) {
        try {
          window.VanillaTilt.destroy(element);
        } catch (error) {
          // Silently handle cleanup errors
        }
      }
    };
  }, [options]);

  return elementRef;
};

// Hook for creating parallax letter effects
export const useParallaxLetters = (text: string) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Split text into letters and create spans
    const letters = text.split('').map((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter === ' ' ? '\u00A0' : letter; // Non-breaking space
      span.className = 'parallax-letter';
      span.style.cssText = `
        display: inline-block;
        position: relative;
        z-index: 1001;
        transform-style: preserve-3d;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        will-change: transform;
        color: white !important;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      `;
      return span;
    });

    // Add letters to container
    letters.forEach(letter => container.appendChild(letter));

    // Add mouse move listener for parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      letters.forEach((letter, index) => {
        const depth = (index + 1) * 0.15; // Enhanced depth for better parallax
        const translateX = deltaX * depth * 8;
        const translateY = deltaY * depth * 8;
        const translateZ = depth * 4;
        const rotateX = deltaY * depth * 2;
        const rotateY = deltaX * depth * 2;
        
        letter.style.transform = `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    };

    const handleMouseLeave = () => {
      letters.forEach(letter => {
        letter.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
      });
    };

    // Add event listeners with passive for better performance
    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [text]);

  return containerRef;
};