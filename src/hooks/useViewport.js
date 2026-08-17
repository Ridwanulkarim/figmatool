import { useState, useCallback } from 'react';

/**
 * Custom Hook for Viewport State & Zoom/Pan Operations
 */
export function useViewport(initialViewport = { panX: 0, panY: 0, zoom: 1 }) {
  const [viewport, setViewport] = useState(initialViewport);

  const zoomIn = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  }, []);

  const resetZoom = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: 1 }));
  }, []);

  const fitCanvas = useCallback(() => {
    setViewport({ panX: 0, panY: 0, zoom: 1 });
  }, []);

  const setZoomLevel = useCallback((zoomFactor) => {
    setViewport(prev => ({ ...prev, zoom: zoomFactor }));
  }, []);

  const handleWheelZoom = useCallback((e, canvasBounds) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setViewport(prev => {
        const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.1), 5);
        const mouseX = e.clientX - (canvasBounds ? canvasBounds.left : 0);
        const mouseY = e.clientY - (canvasBounds ? canvasBounds.top : 0);

        const panX = mouseX - (mouseX - prev.panX) * (newZoom / prev.zoom);
        const panY = mouseY - (mouseY - prev.panY) * (newZoom / prev.zoom);

        return { panX, panY, zoom: newZoom };
      });
    } else {
      setViewport(prev => ({
        ...prev,
        panX: prev.panX - e.deltaX,
        panY: prev.panY - e.deltaY,
      }));
    }
  }, []);

  return {
    viewport,
    setViewport,
    zoomIn,
    zoomOut,
    resetZoom,
    fitCanvas,
    setZoomLevel,
    handleWheelZoom,
  };
}
