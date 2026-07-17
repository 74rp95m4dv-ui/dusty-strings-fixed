import { useEffect, useRef, useState } from "react";

export interface TourCinematicDetails {
  artistName: string;
  cityName: string;
  venueName: string;
  showNumber: number;
  totalShows: number;
  week: number;
}

interface CinematicProps {
  onStart: () => void;
  onEnd: () => void;
  tour: TourCinematicDetails;
}

const STAGE_DURATIONS = [750, 1100, 1300, 1150, 1550, 2400];

export function CinematicFramework({ onStart, onEnd, tour }: CinematicProps) {
  const [stage, setStage] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const ended = useRef(false);

  const finish = () => {
    if (ended.current) return;
    ended.current = true;
    setIsLeaving(true);
    window.setTimeout(onEnd, 700);
  };

  useEffect(() => {
    onStart();
  }, [onStart]);

  useEffect(() => {
    if (isLeaving) return;
    const duration = STAGE_DURATIONS[stage];
    const timer = window.setTimeout(() => {
      if (stage === STAGE_DURATIONS.length - 1) finish();
      else setStage((current) => current + 1);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [stage, isLeaving]);

  const city = tour.cityName.split(",")[0].toUpperCase();

  return (
    <section
      className={`tour-intro ${isLeaving ? "tour-intro--leaving" : ""} ${stage >= 1 ? "tour-intro--sky" : ""} ${stage >= 2 ? "tour-intro--venue-in" : ""} ${stage >= 3 ? "tour-intro--marquee-in" : ""} ${stage >= 4 ? "tour-intro--lights-on" : ""} ${stage >= 5 ? "tour-intro--crowd-in" : ""}`}
      aria-label={`Tour arrival: ${tour.cityName}, ${tour.venueName}`}
    >
      <div className="tour-intro__grain" />
      <div className="tour-intro__moon" />
      <div className="tour-intro__horizon tour-intro__horizon--far" />
      <div className="tour-intro__horizon tour-intro__horizon--near" />
      <div className="tour-intro__road" />
      <div className="tour-intro__fog" />

      <header className="tour-intro__topline">
        <span>Dusty Strings presents</span>
        <span>Week {tour.week}</span>
      </header>

      <button className="tour-intro__skip" onClick={finish} type="button">
        Skip intro <span aria-hidden="true">&rarr;</span>
      </button>

      <div className="tour-intro__location" aria-live="polite">
        <span className="tour-intro__eyebrow">First stop</span>
        <strong>{tour.cityName}</strong>
        <span>{tour.venueName}</span>
      </div>

      <div className="tour-intro__venue">
        <div className="tour-intro__blade">
          <span>{tour.venueName}</span>
          <b>LIVE</b>
        </div>
        <div className="tour-intro__facade">
          <div className="tour-intro__windows" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
          </div>
          <div className="tour-intro__awning" />
          <div className="tour-intro__doors" aria-hidden="true"><i /><i /><i /></div>
        </div>

        <div className="tour-intro__marquee">
          <div className="tour-intro__marquee-frame">
            <div className="tour-intro__bulbs" aria-hidden="true">
              {Array.from({ length: 42 }, (_, index) => <i key={index} />)}
            </div>
            <div className="tour-intro__sign-copy">
              <span className="tour-intro__sign-kicker">One night only</span>
              <strong>{tour.artistName}</strong>
              <span className="tour-intro__sign-detail">LIVE IN {city}</span>
              <span className="tour-intro__sign-detail">SHOW {tour.showNumber} OF {tour.totalShows}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tour-intro__crowd" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
      </div>
      <div className="tour-intro__bus" aria-hidden="true"><i /><i /><i /></div>

      <footer className="tour-intro__footer">
        <span>Doors are open</span>
        <span className="tour-intro__pulse" />
        <span>Let&apos;s play</span>
      </footer>
    </section>
  );
}
