import React from 'react';
import { getBoundingBox, getMultiSelectionBoundingBox, rotatePoint } from '../../utils/geometry.js';

export default function SelectionOverlay({
  selectedElements,
  sceneGraph,
  viewport,
  marqueeBox,
  onHandlePointerDown,
  onRotatePointerDown,
}) {
  const zoom = viewport?.zoom || 1;
  const handleSize = 8 / zoom;
  const halfHandle = handleSize / 2;
  const strokeWidth = 1.5 / zoom;
  const rotationOffset = 24 / zoom;

  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

  // Marquee Selection Box Overlay
  if (marqueeBox && marqueeBox.width > 2 && marqueeBox.height > 2) {
    return (
      <rect
        x={marqueeBox.x}
        y={marqueeBox.y}
        width={marqueeBox.width}
        height={marqueeBox.height}
        fill="rgba(13, 153, 255, 0.1)"
        stroke="#0d99ff"
        strokeWidth={strokeWidth}
        strokeDasharray={`${4 / zoom}, ${4 / zoom}`}
        pointerEvents="none"
      />
    );
  }

  if (!selectedElements || selectedElements.length === 0) return null;

  // Single Selection vs Multi Selection Bounding Box
  let box = null;
  let rotation = 0;

  if (selectedElements.length === 1) {
    const single = selectedElements[0];
    box = getBoundingBox(single, sceneGraphMap);
    rotation = single.rotation || 0;
  } else {
    box = getMultiSelectionBoundingBox(selectedElements);
    rotation = 0; // Multi-select union box is axis-aligned
  }

  if (!box) return null;

  const { x, y, width, height } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Transform rotation around bounding box center
  const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;

  // 8 Handle Local Coordinates
  const handlePositions = [
    { id: 'nw', x, y, cursor: 'nwse-resize' },
    { id: 'n', x: cx, y, cursor: 'ns-resize' },
    { id: 'ne', x: x + width, y, cursor: 'nesw-resize' },
    { id: 'e', x: x + width, y: cy, cursor: 'ew-resize' },
    { id: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
    { id: 's', x: cx, y: y + height, cursor: 'ns-resize' },
    { id: 'sw', x, y: y + height, cursor: 'nesw-resize' },
    { id: 'w', x, y: cy, cursor: 'ew-resize' },
  ];

  // Rotation Handle Position (Above Top-Center Handle)
  const rotStemStartY = y;
  const rotHandleY = y - rotationOffset;

  return (
    <g transform={transform} className="selection-overlay">
      {/* Bounding Box Outline */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#0d99ff"
        strokeWidth={strokeWidth}
        pointerEvents="none"
      />

      {/* Rotation Handle Stem & Handle */}
      <line
        x1={cx}
        y1={rotStemStartY}
        x2={cx}
        y2={rotHandleY}
        stroke="#0d99ff"
        strokeWidth={strokeWidth}
        pointerEvents="none"
      />
      <circle
        cx={cx}
        cy={rotHandleY}
        r={5 / zoom}
        fill="#ffffff"
        stroke="#0d99ff"
        strokeWidth={strokeWidth * 1.2}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onRotatePointerDown?.(e);
        }}
      />

      {/* 8 Resize Handles */}
      {handlePositions.map((h) => (
        <rect
          key={h.id}
          x={h.x - halfHandle}
          y={h.y - halfHandle}
          width={handleSize}
          height={handleSize}
          fill="#ffffff"
          stroke="#0d99ff"
          strokeWidth={strokeWidth}
          style={{ cursor: h.cursor }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onHandlePointerDown?.(e, h.id);
          }}
        />
      ))}
    </g>
  );
}
