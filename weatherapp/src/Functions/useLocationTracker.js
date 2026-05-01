import { useEffect, useRef } from "react";
import getYourLocation from "../Functions/getYourLocation";

const useLocationTracker = (onChange) => {
  const prev = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const loc = await getYourLocation();

        if (!prev.current) {
          prev.current = loc;
          onChange(loc);
          return;
        }

        const dist =
          Math.sqrt(
            Math.pow(loc.lat - prev.current.lat, 2) +
            Math.pow(loc.lon - prev.current.lon, 2)
          ) * 111;

        // only update if moved > ~1 km
        if (dist > 1) {
          prev.current = loc;
          onChange(loc);
        }
      } catch (e) {
        console.log("Tracker error:", e);
      }
    };

    check();
    const id = setInterval(check, 240000); // 4 min

    return () => clearInterval(id);
  }, [onChange]);
};

export default useLocationTracker;