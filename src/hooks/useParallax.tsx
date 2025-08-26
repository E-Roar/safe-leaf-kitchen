import { useEffect, useState, useCallback, useRef } from 'react';

interface ParallaxConfig {
  speed: number; // Multiplier for scroll distance (0-1, where 0 is no movement, 1 is normal scroll)
  direction?: 'up' | 'down'; // Direction of parallax movement
}

// Throttle function for performance optimization
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  return (...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export const useParallax = (config: ParallaxConfig) => {
  const [offset, setOffset] = useState(0);
  const rafId = useRef<number | null>(null);

  const updateOffset = useCallback(() => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * config.speed;
    
    if (config.direction === 'up') {
      setOffset(-rate);
    } else {
      setOffset(rate);
    }
  }, [config.speed, config.direction]);

  const handleScroll = useCallback(
    throttle(() => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      
      rafId.current = requestAnimationFrame(updateOffset);
    }, 16), // ~60fps
    [updateOffset]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

  return offset;
};

// Hook for multiple parallax layers with different configs
export const useMultiParallax = (configs: ParallaxConfig[]) => {
  const [offsets, setOffsets] = useState<number[]>(new Array(configs.length).fill(0));
  const rafId = useRef<number | null>(null);

  const updateOffsets = useCallback(() => {
    const scrolled = window.pageYOffset;
    const newOffsets = configs.map((config) => {
      const rate = scrolled * config.speed;
      return config.direction === 'up' ? -rate : rate;
    });
    setOffsets(newOffsets);
  }, [configs]);

  const handleScroll = useCallback(
    throttle(() => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      
      rafId.current = requestAnimationFrame(updateOffsets);
    }, 16), // ~60fps
    [updateOffsets]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

  return offsets;
};