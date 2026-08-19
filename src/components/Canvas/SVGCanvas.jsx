import React, { useRef } from 'react';

/**
 * Pure SVG Scene Graph Renderer
 * Supports Model A Local Coordinate Architecture & Nested Group Transforms
 */
function RenderElement({ element, sceneGraphMap }) {
  if (!element || element.hidden) return null;

  const {
    id,
    type,
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    rotation = 0,
    fill = '#6366f1',
    stroke = '#000000',
    strokeWidth = 0,
    opacity = 1,
    text = 'Text',
    fontSize = 16,
    fontFamily = 'Inter',
    fontWeight = 'normal',
    textAlign = 'left',
  } = element;

  const cx = x + width / 2;
  const cy = y + height / 2;
  const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;

  switch (type) {
    case 'rectangle':
      return (
        <rect
          id={id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke={strokeWidth > 0 ? stroke : undefined}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );

    case 'circle':
      return (
        <ellipse
          id={id}
          cx={cx}
          cy={cy}
          rx={width / 2}
          ry={height / 2}
          fill={fill}
          stroke={strokeWidth > 0 ? stroke : undefined}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );

    case 'text':
      let textAnchor = 'start';
      let textX = x;
      if (textAlign === 'center') {
        textAnchor = 'middle';
        textX = x + width / 2;
      } else if (textAlign === 'right') {
        textAnchor = 'end';
        textX = x + width;
      }

      return (
        <text
          id={id}
          x={textX}
          y={y + fontSize * 0.85}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          textAnchor={textAnchor}
          fill={fill}
          opacity={opacity}
          transform={transform}
          style={{ userSelect: 'none' }}
        >
          {text}
        </text>
      );

    case 'group':
      if (!element.children || element.children.length === 0) return null;
      // Model A: Group defines local coordinate frame via translate(x, y) and rotate(deg)
      const groupTransform = `translate(${x}, ${y}) ${rotation ? `rotate(${rotation} ${width / 2} ${height / 2})` : ''}`;

      return (
        <g id={id} opacity={opacity} transform={groupTransform.trim()}>
          {element.children.map(childId => {
            const child = sceneGraphMap.get(childId);
            return child ? (
              <RenderElement key={child.id} element={child} sceneGraphMap={sceneGraphMap} />
            ) : null;
          })}
        </g>
      );

    default:
      return null;
  }
}

export default function SVGCanvas({
  sceneGraph,
  viewport,
  activeTool,
  gridEnabled,
  guides,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClickCanvas,
  children,
  cursorStyle = 'default',
}) {
  const svgRef = useRef(null);
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

  const { panX = 0, panY = 0, zoom = 1 } = viewport;
  const isCanvasEmpty = sceneGraph.length === 0;

  // Render top-level elements (elements with no parentId)
  const topLevelElements = sceneGraph.filter(el => !el.parentId);

  return (
    <div
      className="relative flex-1 bg-gray-950 overflow-hidden select-none"
      style={{ cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClickCanvas}
    >
      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0 block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="canvas-grid-pattern"
            width={20 * zoom}
            height={20 * zoom}
            patternUnits="userSpaceOnUse"
            x={panX % (20 * zoom)}
            y={panY % (20 * zoom)}
          >
            <path
              d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Background Grid */}
        {gridEnabled && (
          <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />
        )}

        {/* Transformed Scene Viewport */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Top Level Scene Elements */}
          {topLevelElements.map((el) => (
            <RenderElement key={el.id} element={el} sceneGraphMap={sceneGraphMap} />
          ))}

          {/* Interactive Overlays */}
          {children}

          {/* Smart Alignment Guides Overlay */}
          {guides && guides.map((guide) => (
            <line
              key={guide.id}
              x1={guide.type === 'vertical' ? guide.x : guide.startX}
              y1={guide.type === 'vertical' ? guide.startY : guide.y}
              x2={guide.type === 'vertical' ? guide.x : guide.endX}
              y2={guide.type === 'vertical' ? guide.endY : guide.y}
              stroke="#0d99ff"
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom}, ${4 / zoom}`}
            />
          ))}
        </g>
      </svg>

      {/* Empty State Onboarding Overlay */}
      {isCanvasEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 mb-4 shadow-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-1">Your canvas is empty</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Choose a tool from the left toolbar or double-click anywhere to create a shape.
          </p>
        </div>
      )}
    </div>
  );
}
