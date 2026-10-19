import { useEffect, useState } from 'react';

/** Matches when the primary input is a finger / touch panel (phones, tablets). */
const TOUCH_QUERY = '(pointer: coarse), (hover: none)';
/** Matches portrait device orientation. */
const PORTRAIT_QUERY = '(orientation: portrait)';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * True when the device is touch-driven. Used instead of viewport width so the
 * virtual gamepad stays visible on large phones / tablets in landscape —
 * `md:hidden` used to hide it on any viewport ≥768px, which is exactly the
 * landscape width of modern phones.
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery(TOUCH_QUERY);
}

/** True while the device is held in portrait — used for the rotate hint. */
export function usePortraitOrientation(): boolean {
  return useMediaQuery(PORTRAIT_QUERY);
}
