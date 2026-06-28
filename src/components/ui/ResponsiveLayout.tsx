import { ReactNode } from 'react';
import { useBreakpoint, Breakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  const breakpoint = useBreakpoint();
  
  return (
    <div className={`${className} responsive-layout-${breakpoint}`}>
      {children}
    </div>
  );
}

export function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile';
}

export function useIsTablet() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'tablet';
}

export function useIsDesktop() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'desktop';
}