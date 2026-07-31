import { type ReactNode, useEffect, useRef } from "react";

type DialogProps = {
  titleId: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
};

/** A small, dependency-free dialog surface for the player-facing decision points. */
export default function Dialog({ titleId, children, onClose, className = "" }: DialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstTarget = dialogRef.current?.querySelector<HTMLElement>("[data-dialog-initial], button:not(:disabled), input:not(:disabled), select:not(:disabled)");
    firstTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  return <section ref={dialogRef} className={`modal-box ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
    {children}
  </section>;
}
