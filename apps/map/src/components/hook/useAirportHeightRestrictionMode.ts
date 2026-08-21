// src/components/hook/useAirportHeightRestrictionMode.ts
import { useCallback, useEffect, useRef, useState } from "react";

export function useAirportHeightRestrictionMode() {
  const [airportHeightRestrictionMode, setAirportHeightRestrictionMode] = useState(true);
  const airportHeightRestrictionModeRef = useRef(true);

  useEffect(() => {
    airportHeightRestrictionModeRef.current = airportHeightRestrictionMode;
  }, [airportHeightRestrictionMode]);

  const cancelAirportHeightRestrictionMode = useCallback(() => {
    airportHeightRestrictionModeRef.current = false;
    setAirportHeightRestrictionMode(false);

    window.dispatchEvent(
      new CustomEvent("map:airport-height-restriction-mode-changed", {
        detail: { active: false },
      })
    );
  }, []);

  useEffect(() => {
    const onStart = () => {
      setAirportHeightRestrictionMode(true);
      airportHeightRestrictionModeRef.current = true;
      // 他モードとの排他
      window.dispatchEvent(new CustomEvent("map:cancel-measurement"));
      window.dispatchEvent(new CustomEvent("map:cancel-add-area"));
      window.dispatchEvent(
        new CustomEvent("map:airport-height-restriction-mode-changed", {
          detail: { active: true },
        })
      );
    };

    const onCancel = () => {
      cancelAirportHeightRestrictionMode();
    };

    window.addEventListener("map:start-airport-height-restriction", onStart);
    window.addEventListener("map:cancel-airport-height-restriction", onCancel);
    return () => {
      window.removeEventListener("map:start-airport-height-restriction", onStart);
      window.removeEventListener("map:cancel-airport-height-restriction", onCancel);
    };
  }, [cancelAirportHeightRestrictionMode]);

  return {
    airportHeightRestrictionMode,
    airportHeightRestrictionModeRef,
    cancelAirportHeightRestrictionMode,
  };
}
