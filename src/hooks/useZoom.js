import { useCallback, useEffect, useState } from "react";
import {
  applyDocumentZoom,
  DEFAULT_ZOOM,
  getInitialZoom,
  nextZoom,
  persistZoom,
  ZOOM_LEVELS,
} from "../utils/zoom";

export function useZoom() {
  const [zoom, setZoomState] = useState(getInitialZoom);

  useEffect(() => {
    applyDocumentZoom(zoom);
  }, [zoom]);

  const setZoom = useCallback((value) => {
    const resolved = ZOOM_LEVELS.includes(value) ? value : DEFAULT_ZOOM;
    setZoomState(resolved);
    persistZoom(resolved);
  }, []);

  const cycleZoom = useCallback(() => {
    setZoomState((current) => {
      const next = nextZoom(current);
      persistZoom(next);
      return next;
    });
  }, []);

  return { zoom, setZoom, cycleZoom };
}
