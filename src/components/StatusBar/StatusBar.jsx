import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Activity, Layers } from 'lucide-react';

export default function StatusBar({
  cursorCanvasPos,
  selectedCount,
  sceneObjectCount = 0,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitCanvas,
  onSetZoom,
}) {
  const [fps, setFps] = useState(60);

  // Simple FPS Performance Counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <footer className="h-7 bg-gray-900 border-t border-gray-800 px-3 flex items-center justify-between text-gray-400 text-xs z-30 select-none font-mono">
      {/* Left: Canvas Coordinates & Metrics */}
      <div className="flex items-center space-x-4 text-[11px]">
        <div className="flex items-center space-x-1 text-gray-300">
          <span className="text-gray-500">Cursor:</span>
          <span>X: <strong className="font-semibold text-gray-200">{Math.round(cursorCanvasPos.x)}</strong></span>
          <span>Y: <strong className="font-semibold text-gray-200">{Math.round(cursorCanvasPos.y)}</strong></span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-gray-400 border-l border-gray-800 pl-3">
          <Layers size={12} className="text-indigo-400" />
          <span>Objects: <strong className="text-gray-200">{sceneObjectCount}</strong></span>
        </div>

        <div className="hidden md:flex items-center space-x-1 text-emerald-400 border-l border-gray-800 pl-3">
          <Activity size={12} />
          <span>FPS: <strong className="text-emerald-300">{fps}</strong></span>
        </div>
      </div>

      {/* Center: Selection Count */}
      <div className="text-[11px] text-gray-400 font-sans">
        {selectedCount === 0 ? (
          <span className="text-gray-500">No selection</span>
        ) : (
          <span className="text-indigo-400 font-medium">
            {selectedCount} {selectedCount === 1 ? 'element' : 'elements'} selected
          </span>
        )}
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center space-x-1.5 text-[11px]">
        <button
          onClick={onZoomOut}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200"
          title="Zoom Out (-)"
        >
          <ZoomOut size={13} />
        </button>

        <select
          value={zoomPercent}
          onChange={(e) => onSetZoom(parseFloat(e.target.value) / 100)}
          className="bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-gray-200 text-[10px] outline-none cursor-pointer"
        >
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
          <option value="300">300%</option>
        </select>

        <button
          onClick={onZoomIn}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200"
          title="Zoom In (+)"
        >
          <ZoomIn size={13} />
        </button>

        <button
          onClick={onResetZoom}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200"
          title="Reset Zoom (100%)"
        >
          <RefreshCw size={12} />
        </button>

        <button
          onClick={onFitCanvas}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200"
          title="Fit Canvas to Screen"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </footer>
  );
}
