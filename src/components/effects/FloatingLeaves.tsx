import React, { useEffect, useState, useMemo } from 'react';
import { Leaf } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  depth: number; // 1-3 (1 = background, 2 = mid, 3 = foreground)
  opacity: number;
  blur: number;
}

interface FloatingLeavesProps {
  enabled?: boolean;
  particleCount?: number;
  className?: string;
}

const FloatingLeaves: React.FC<FloatingLeavesProps> = ({ 
  enabled = true, 
  particleCount = 15,
  className = "" 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scrollY, setScrollY] = useState(0);

  // Generate initial particles
  const initialParticles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const depth = Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3;
      
      // Size based on depth (background smaller, foreground larger)
      const sizeMap = { 1: [12, 20], 2: [20, 32], 3: [32, 48] };
      const [minSize, maxSize] = sizeMap[depth as keyof typeof sizeMap];
      
      // Speed based on depth (background slower, foreground faster)
      const speedMap = { 1: [0.2, 0.5], 2: [0.5, 1], 3: [1, 1.8] };
      const [minSpeed, maxSpeed] = speedMap[depth as keyof typeof speedMap];
      
      // Blur based on depth (background and foreground more blurred)
      const blurMap = { 1: 3, 2: 0, 3: 2 };
      
      // Opacity based on depth
      const opacityMap = { 1: 0.3, 2: 0.6, 3: 0.4 };

      return {
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight + 200) - 100,
        size: minSize + Math.random() * (maxSize - minSize),
        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        depth,
        opacity: opacityMap[depth as keyof typeof opacityMap],
        blur: blurMap[depth as keyof typeof blurMap]
      };
    });
  }, [particleCount]);

  useEffect(() => {
    if (!enabled) return;
    
    setParticles(initialParticles);
  }, [enabled, initialParticles]);

  // Handle scroll for parallax effect
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled]);

  // Animate particles
  useEffect(() => {
    if (!enabled || particles.length === 0) return;

    let animationId: number;
    
    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newY = particle.y + particle.speed;
          let newRotation = particle.rotation + particle.rotationSpeed;
          
          // Reset particle when it goes off screen
          if (newY > window.innerHeight + 100) {
            newY = -100;
            particle.x = Math.random() * window.innerWidth;
          }
          
          return {
            ...particle,
            y: newY,
            rotation: newRotation
          };
        })
      );
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled, particles.length]);

  if (!enabled) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-[1] ${className}`}>
      {particles.map(particle => {
        // Apply parallax based on depth and scroll position
        const parallaxOffset = scrollY * (particle.depth === 1 ? 0.1 : particle.depth === 2 ? 0.3 : 0.6);
        
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y - parallaxOffset}px`,
              transform: `rotate(${particle.rotation}deg)`,
              filter: particle.blur > 0 ? `blur(${particle.blur}px)` : undefined,
              opacity: particle.opacity,
              zIndex: particle.depth === 1 ? 1 : particle.depth === 2 ? 10 : 5
            }}
          >
            <Leaf 
              size={particle.size}
              className={`
                text-primary transition-all duration-1000
                ${particle.depth === 1 ? 'text-primary/30' : ''}
                ${particle.depth === 2 ? 'text-primary/60' : ''}
                ${particle.depth === 3 ? 'text-primary/40' : ''}
              `}
            />
          </div>
        );
      })}
    </div>
  );
};

export default FloatingLeaves;