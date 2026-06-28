import { ReactNode } from 'react';
import { useBreakpoint, Breakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveAppShellProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveAppShell({ children, className = '' }: ResponsiveAppShellProps) {
  const breakpoint = useBreakpoint();
  
  // Add breakpoint-specific classes
  const classNames = `${className} responsive-app-shell responsive-breakpoint-${breakpoint}`;
  
  return (
    <div className={classNames}>
      {children}
    </div>
  );
}