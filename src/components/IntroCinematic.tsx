import { CinematicFramework, TourCinematicDetails } from "./CinematicFramework";

interface IntroCinematicProps {
  onStart: () => void;
  onEnd: () => void;
  tour: TourCinematicDetails;
}

export function IntroCinematic({ onStart, onEnd, tour }: IntroCinematicProps) {
  return <CinematicFramework onStart={onStart} onEnd={onEnd} tour={tour} />;
}
