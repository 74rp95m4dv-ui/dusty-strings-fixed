import React from "react";

interface SignComponentProps {
  onSign?: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  isSigning?: boolean;
  contractTerms?: { label: string; value: string }[];
}

export default function SignComponent({ 
  onSign, 
  onCancel, 
  title = "Contract Agreement", 
  description = "Please review and sign the agreement below.",
  isSigning = false,
  contractTerms = []
}: SignComponentProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box signing-panel" onClick={(e) => e.stopPropagation()}>
        <div className="signing-header">
          <div className="signing-stamp">EXECUTED</div>
          <div className="signing-label">{title}</div>
          <div className="signing-sub">Contract Agreement</div>
        </div>
        
        <div className="signing-moment">
          <div className="signing-emoji">✍️</div>
          <div className="signing-title">Review & Sign</div>
          <div className="signing-desc">
            {description}
          </div>
        </div>

        {contractTerms.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Contract Terms</div>
            <div className="signing-terms">
              {contractTerms.map((term, index) => (
                <div className="signing-term" key={index}>
                  <span className="signing-term-label">{term.label}</span>
                  <span className="signing-term-value">{term.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button 
            className="btn btn-lg btn-lime" 
            onClick={onSign}
            disabled={isSigning}
          >
            {isSigning ? "Signing..." : "Sign Agreement"}
          </button>
          <button 
            className="btn btn-lg btn-ghost" 
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Export the component for use in the cinematic system
export { SignComponent };
