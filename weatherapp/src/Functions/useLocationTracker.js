import { useEffect, useRef } from "react";
import getYourLocation from "../Functions/getYourLocation";

const useLocationTracker = (onChange) => {
  const prevRef = useRef(null);

  useEffect(() => {

    const track = async () => {

      try {

        const current =
          await getYourLocation();

        const prev =
          prevRef.current;

        prevRef.current =
          current;

        if (prev) {

          const dist =
            getDistanceKm(prev, current);

          // only trigger if meaningful movement
          if (dist > 2) {
            onChange(current, dist);
          }

        } else {
          onChange(current, 0);
        }

      } catch (err) {
        console.log("Tracking error:", err);
      }
    };

    track();

    const interval =
      setInterval(track, 4 * 60 * 1000);

    return () => clearInterval(interval);

  }, [onChange]);
};

// helper
const getDistanceKm = (a, b) => {

  const R = 6371;

  const dLat =
    (b.lat - a.lat) * Math.PI / 180;

  const dLon =
    (b.lon - a.lon) * Math.PI / 180;

  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
};

export default useLocationTracker;