import { useEffect, useRef, useState } from 'react';

interface MouseTiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

export const useMouseTilt = <T extends HTMLElement = HTMLElement>(options: MouseTiltOptions = {}) => {
  const {
    maxTilt = 15,
    perspective = 1000,
    scale = 1.05,
    speed = 0.1
  } = options;

  const elementRef = useRef<T>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let animationId: number;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      
      targetX = deltaX * maxTilt;
      targetY = deltaY * maxTilt;
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      element.addEventListener('mousemove', handleMouseMove);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      element.removeEventListener('mousemove', handleMouseMove);
      targetX = 0;
      targetY = 0;
    };

    const animate = () => {
      currentX += (targetX - currentX) * speed;
      currentY += (targetY - currentY) * speed;

      const rotateX = -currentY;
      const rotateY = currentX;
      const scaleValue = isHovered ? scale : 1;

      setTiltStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleValue})`,
        transition: isHovered ? 'none' : 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      });

      animationId = requestAnimationFrame(animate);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [maxTilt, perspective, scale, speed, isHovered]);

  return { elementRef, tiltStyle, isHovered };
};