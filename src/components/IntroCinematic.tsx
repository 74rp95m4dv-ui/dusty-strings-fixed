import React, { useState, useEffect } from "react";
import { CinematicFramework } from "./CinematicFramework";

interface IntroCinematicProps {
  onStart: () => void;
  onEnd: () => void;
  isTourIntro?: boolean;
}

export function IntroCinematic({ onStart, onEnd, isTourIntro = false }: IntroCinematicProps) {
  const [showCinematic, setShowCinematic] = useState(false);

  useEffect(() => {
    // Start the cinematic when component mounts
    setShowCinematic(true);
  }, []);

  const handleCinematicStart = () => {
    onStart();
  };

  const handleCinematicEnd = () => {
    onEnd();
    setShowCinematic(false);
  };

  if (!showCinematic) {
    return null;
  }

  return (
    <div className="intro-cinematic">
      <CinematicFramework 
        onStart={handleCinematicStart} 
        onEnd={handleCinematicEnd} 
        isTourIntro={isTourIntro}
      />
    </div>
  );
}