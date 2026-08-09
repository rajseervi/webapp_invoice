// Performance-optimized motion configuration
export const fastTransition = {
  duration: 0.1,
  ease: "easeOut"
};

export const normalTransition = {
  duration: 0.2, 
  ease: "easeOut"
};

export const slowTransition = {
  duration: 0.3,
  ease: "easeOut"
};

// Reduced-motion variants for better performance
export const fadeInVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: fastTransition
};

export const slideInVariant = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: normalTransition
};

export const scaleVariant = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: fastTransition
};

// Disable animations on mobile/low-performance devices
export const getOptimizedVariant = (variant: any, isMobile: boolean) => {
  if (isMobile || typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return {
      ...variant,
      transition: { duration: 0.01 }
    };
  }
  return variant;
};

// Motion configuration for better performance
export const motionConfig = {
  // Reduce layout calculations
  layout: false,
  // Optimize for performance
  whileHover: undefined,
  whileTap: undefined,
  // Use CSS transforms instead of layout shifts
  style: { willChange: 'transform, opacity' }
};