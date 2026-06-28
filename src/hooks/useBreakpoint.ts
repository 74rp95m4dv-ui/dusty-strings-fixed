import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Initial check
    checkBreakpoint();

    // Add event listener
    window.addEventListener('resize', checkBreakpoint);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, []);

  return breakpoint;
}