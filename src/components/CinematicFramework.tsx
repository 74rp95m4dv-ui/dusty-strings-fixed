import React, { useState, useEffect } from "react";

interface CinematicProps {
  onStart: () => void;
  onEnd: () => void;
  isTourIntro?: boolean;
}

export function CinematicFramework({ onStart, onEnd, isTourIntro = false }: CinematicProps) {
  const [cinematicState, setCinematicState] = useState<'setup' | 'fadeout' | 'display' | 'fadein'>('setup');
  const [showInfo, setShowInfo] = useState(false);
  const [showMarquee, setShowMarquee] = useState(false);
  const [marqueeLights, setMarqueeLights] = useState<number[]>([]);
  const [showCrowd, setShowCrowd] = useState(false);
  const [showBus, setShowBus] = useState(false);

  // Setup cinematic sequence
  useEffect(() => {
    if (cinematicState === 'setup') {
      const timer = setTimeout(() => {
        setCinematicState('fadeout');
        onStart();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [cinematicState, onStart]);

  // Handle fade out
  useEffect(() => {
    if (cinematicState === 'fadeout') {
      const timer = setTimeout(() => {
        setCinematicState('display');
        setShowInfo(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [cinematicState]);

  // Handle display info
  useEffect(() => {
    if (cinematicState === 'display' && showInfo) {
      const timer = setTimeout(() => {
        setShowMarquee(true);
        setMarqueeLights([]);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [cinematicState, showInfo]);

  // Handle marquee animation
  useEffect(() => {
    if (showMarquee && marqueeLights.length === 0) {
      const timer = setTimeout(() => {
        setMarqueeLights([1]);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showMarquee, marqueeLights]);

  // Animate marquee lights
  useEffect(() => {
    if (showMarquee && marqueeLights.length < 8) {
      const timer = setTimeout(() => {
        setMarqueeLights(prev => [...prev, prev.length + 1]);
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (showMarquee && marqueeLights.length === 8) {
      // After lights are done, show text
      const timer = setTimeout(() => {
        setShowCrowd(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [marqueeLights]);

  // Handle crowd animation
  useEffect(() => {
    if (showCrowd) {
      const timer = setTimeout(() => {
        setShowBus(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showCrowd]);

  // Handle bus arrival
  useEffect(() => {
    if (showBus) {
      const timer = setTimeout(() => {
        setCinematicState('fadein');
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [showBus]);

  // Handle fade in
  useEffect(() => {
    if (cinematicState === 'fadein') {
      const timer = setTimeout(() => {
        onEnd();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [cinematicState, onEnd]);

  return (
    <div className="cinematic-container">
      {/* Fade overlay */}
      {cinematicState === 'fadeout' && (
        <div className="cinematic-fade fade-out" />
      )}
      
      {cinematicState === 'fadein' && (
        <div className="cinematic-fade fade-in" />
      )}

      {/* Main cinematic content */}
      {cinematicState === 'display' && (
        <div className="cinematic-content">
          <div className="cinematic-background" />
          
          {/* Info display */}
          {showInfo && (
            <div className="cinematic-info">
              <div className="week-number">WEEK {isTourIntro ? "1" : "0"}</div>
              <div className="tour-name">Midnight Highway Tour</div>
              <div className="city-name">Nashville, TN</div>
              <div className="venue-name">Ryman Auditorium</div>
            </div>
          )}

          {/* Marquee display */}
          {showMarquee && (
            <div className="cinematic-marquee">
              <div className="marquee-border">
                {/* Marquee lights - animate from outside in */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((light) => (
                  <div 
                    key={light} 
                    className={`marquee-light ${marqueeLights.includes(light) ? 'lit' : ''}`}
                  />
                ))}
              </div>
              
              {/* Marquee text */}
              {marqueeLights.length === 8 && (
                <div className="marquee-text">
                  <div className="artist-name">Dusty Strings</div>
                  <div className="tour-title">Midnight Highway Tour</div>
                  <div className="live-today">LIVE TONIGHT</div>
                  <div className="city">NASHVILLE</div>
                  <div className="date">AUGUST 12</div>
                </div>
              )}
            </div>
          )}

          {/* Crowd animation */}
          {showCrowd && (
            <div className="cinematic-crowd">
              <div className="crowd-activity">Fans gathering...</div>
              <div className="crowd-sound">🔊 Crowd noise building</div>
            </div>
          )}

          {/* Tour bus */}
          {showBus && (
            <div className="cinematic-bus">
              <div className="bus-arrival">Tour bus arriving...</div>
              <div className="bus-excitement">🎉 Increased excitement</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
