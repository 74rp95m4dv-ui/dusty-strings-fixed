import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ActionCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Turns information cards that navigate or commit an action into real buttons. */
export default function ActionCard({ children, className = "", type = "button", ...props }: ActionCardProps) {
  return <button type={type} className={`pick-card pick-card-button ${className}`} {...props}>{children}</button>;
}
