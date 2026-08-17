import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

export default function StatusBar({
  cursorCanvasPos,
  selectedCount,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitCanvas,
  onSetZoom,
}) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <footer className="h-7 bg-gray-900 border-t border-gray-800 px-3 flex items-center justify-between text-gray-400 text-xs z-30 select-none font-mono">
      {/* Left: Canvas Coordinates */}
      <div className="flex items-center space-x-3 text-[11px]">
        <span className="text-gray-500">Cursor:</span>
        <span className="text-gray-300">
          X: <strong className="font-semibold text-gray-200">{Math.round(cursorCanvasPos.x)}</strong>
        </span>
        <span className="text-gray-300">
          Y: <strong className="font-semibold text-gray-200">{Math.round(cursorCanvasPos.y)}</strong>
        </span>
      </div>

      {/* Center: Selection Count */}
      <div className="text-[11px] text-gray-400 font-sans">
        {selectedCount === 0 ? (
          <span className="text-gray-500">No elements selected</span>
        ) : (
          <span className="text-indigo-400 font-medium">
            {selectedCount} {selectedCount === 1 ? 'element' : 'elements'} selected
          </span>
        )}
      </div>

      {/* Right: Zoom Level Controls */}
      <div className="flex items-center space-x-1.5 text-[11px]">
        <button
          onClick={onZoomOut}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200"
          title="Zoom Out (-)"
        >
          <ZoomOut size={13} />
        </button>

        {/* Zoom Selector Dropdown */}
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
