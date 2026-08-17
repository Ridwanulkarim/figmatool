import React, { useState, useEffect, useRef } from 'react';

export default function InPlaceTextEditor({ element, viewport, onCommit, onCancel }) {
  const [text, setText] = useState(element?.text || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  if (!element) return null;

  const { x, y, width, height, fontSize = 16, fontFamily = 'Inter', fontWeight = 'normal', fill = '#ffffff' } = element;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onCommit(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={Math.max(width + 40, 150)}
      height={Math.max(height + 20, fontSize * 2)}
      style={{ overflow: 'visible' }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onCommit(text)}
        onKeyDown={handleKeyDown}
        className="w-full bg-gray-900/90 text-gray-100 border border-indigo-500 rounded px-1.5 py-0.5 outline-none shadow-lg"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          fontWeight,
          color: fill,
          lineHeight: '1.2',
        }}
      />
    </foreignObject>
  );
}
