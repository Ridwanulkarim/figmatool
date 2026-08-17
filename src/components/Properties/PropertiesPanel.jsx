import React from 'react';
import AlignDistributeControls from './AlignDistributeControls.jsx';
import {
  SlidersHorizontal,
  RotateCw,
  Palette,
  Eye,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

const PRESET_COLORS = [
  '#6366f1', '#0d99ff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#ffffff', '#94a3b8', '#1e293b', '#000000',
];

export default function PropertiesPanel({
  selectedElements,
  onUpdateProperties,
  onAlign,
  onDistribute,
}) {
  const isMulti = selectedElements.length > 1;
  const isSingle = selectedElements.length === 1;
  const primaryElement = selectedElements[0];

  if (selectedElements.length === 0) {
    return (
      <aside className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col h-full select-none z-10">
        <div className="h-10 border-b border-gray-800 px-3 flex items-center text-xs font-semibold text-gray-400 space-x-1.5">
          <SlidersHorizontal size={14} className="text-indigo-400" />
          <span>Properties</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 text-xs">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-2 text-gray-600">
            <SlidersHorizontal size={18} />
          </div>
          <p className="font-medium text-gray-400 mb-1">No Selection</p>
          <p className="text-[11px] text-gray-600">Select an element on canvas to inspect and edit its properties.</p>
        </div>
      </aside>
    );
  }

  // Values (if single or shared across multi)
  const valX = isSingle ? Math.round(primaryElement.x || 0) : 'Mixed';
  const valY = isSingle ? Math.round(primaryElement.y || 0) : 'Mixed';
  const valW = isSingle ? Math.round(primaryElement.width || 0) : 'Mixed';
  const valH = isSingle ? Math.round(primaryElement.height || 0) : 'Mixed';
  const valRot = isSingle ? Math.round(primaryElement.rotation || 0) : 0;
  const valFill = primaryElement.fill || '#6366f1';
  const valStroke = primaryElement.stroke || '#000000';
  const valStrokeWidth = primaryElement.strokeWidth || 0;
  const valOpacity = Math.round((primaryElement.opacity !== undefined ? primaryElement.opacity : 1) * 100);

  const isTextSelected = isSingle && primaryElement.type === 'text';

  const handleChangeNumber = (key, val) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onUpdateProperties({ [key]: num });
    }
  };

  return (
    <aside className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col h-full select-none z-10 overflow-y-auto text-xs text-gray-300">
      {/* Header */}
      <div className="h-10 border-b border-gray-800 px-3 flex items-center justify-between font-semibold text-gray-400">
        <div className="flex items-center space-x-1.5">
          <SlidersHorizontal size={14} className="text-indigo-400" />
          <span>Properties</span>
        </div>
        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-1.5 py-0.5 rounded">
          {isSingle ? primaryElement.name || primaryElement.type : `${selectedElements.length} Selected`}
        </span>
      </div>

      {/* Align & Distribute Controls */}
      <AlignDistributeControls
        onAlign={onAlign}
        onDistribute={onDistribute}
        disabled={!isMulti}
      />

      {/* Geometry / Transform Inputs */}
      <div className="border-b border-gray-800 p-3 space-y-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Layout & Transform
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* X Position */}
          <div className="flex items-center bg-gray-950 px-2 py-1.5 rounded border border-gray-800 focus-within:border-indigo-500">
            <span className="text-gray-500 w-4 font-mono">X</span>
            <input
              type="text"
              value={valX}
              onChange={(e) => handleChangeNumber('x', e.target.value)}
              disabled={isMulti}
              className="w-full bg-transparent text-right outline-none text-gray-200 font-mono disabled:opacity-50"
            />
          </div>

          {/* Y Position */}
          <div className="flex items-center bg-gray-950 px-2 py-1.5 rounded border border-gray-800 focus-within:border-indigo-500">
            <span className="text-gray-500 w-4 font-mono">Y</span>
            <input
              type="text"
              value={valY}
              onChange={(e) => handleChangeNumber('y', e.target.value)}
              disabled={isMulti}
              className="w-full bg-transparent text-right outline-none text-gray-200 font-mono disabled:opacity-50"
            />
          </div>

          {/* Width */}
          <div className="flex items-center bg-gray-950 px-2 py-1.5 rounded border border-gray-800 focus-within:border-indigo-500">
            <span className="text-gray-500 w-4 font-mono">W</span>
            <input
              type="text"
              value={valW}
              onChange={(e) => handleChangeNumber('width', e.target.value)}
              disabled={isMulti}
              className="w-full bg-transparent text-right outline-none text-gray-200 font-mono disabled:opacity-50"
            />
          </div>

          {/* Height */}
          <div className="flex items-center bg-gray-950 px-2 py-1.5 rounded border border-gray-800 focus-within:border-indigo-500">
            <span className="text-gray-500 w-4 font-mono">H</span>
            <input
              type="text"
              value={valH}
              onChange={(e) => handleChangeNumber('height', e.target.value)}
              disabled={isMulti}
              className="w-full bg-transparent text-right outline-none text-gray-200 font-mono disabled:opacity-50"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="flex items-center justify-between bg-gray-950 px-2 py-1.5 rounded border border-gray-800 focus-within:border-indigo-500">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <RotateCw size={13} />
            <span>Rotation</span>
          </div>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={valRot}
              onChange={(e) => handleChangeNumber('rotation', e.target.value)}
              className="w-12 bg-transparent text-right outline-none text-gray-200 font-mono"
            />
            <span className="text-gray-500">°</span>
          </div>
        </div>
      </div>

      {/* Text Properties Section (if text element selected) */}
      {isTextSelected && (
        <div className="border-b border-gray-800 p-3 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Text Typography</span>
            <Type size={13} className="text-emerald-400" />
          </div>

          {/* Text String */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Content</label>
            <input
              type="text"
              value={primaryElement.text || ''}
              onChange={(e) => onUpdateProperties({ text: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 outline-none text-gray-200 focus:border-indigo-500"
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Font Family</label>
            <select
              value={primaryElement.fontFamily || 'Inter'}
              onChange={(e) => onUpdateProperties({ fontFamily: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 outline-none text-gray-200 focus:border-indigo-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Size (px)</label>
              <input
                type="number"
                value={primaryElement.fontSize || 16}
                onChange={(e) => handleChangeNumber('fontSize', e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 outline-none text-gray-200 font-mono focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Weight</label>
              <select
                value={primaryElement.fontWeight || 'normal'}
                onChange={(e) => onUpdateProperties({ fontWeight: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded px-1.5 py-1.5 outline-none text-gray-200 focus:border-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="600">SemiBold</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Text Align</label>
            <div className="grid grid-cols-3 gap-1 bg-gray-950 p-1 rounded border border-gray-800">
              <button
                onClick={() => onUpdateProperties({ textAlign: 'left' })}
                className={`py-1 flex items-center justify-center rounded ${
                  (primaryElement.textAlign || 'left') === 'left' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => onUpdateProperties({ textAlign: 'center' })}
                className={`py-1 flex items-center justify-center rounded ${
                  primaryElement.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => onUpdateProperties({ textAlign: 'right' })}
                className={`py-1 flex items-center justify-center rounded ${
                  primaryElement.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <AlignRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fill & Color System */}
      <div className="border-b border-gray-800 p-3 space-y-3">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Fill Color</span>
          <Palette size={13} className="text-indigo-400" />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={valFill.startsWith('#') ? valFill : '#6366f1'}
            onChange={(e) => onUpdateProperties({ fill: e.target.value })}
            className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={valFill}
            onChange={(e) => onUpdateProperties({ fill: e.target.value })}
            className="flex-1 bg-gray-950 border border-gray-800 rounded px-2 py-1.5 outline-none font-mono text-gray-200 focus:border-indigo-500 uppercase"
          />
        </div>

        {/* Preset Color Palette Swatches */}
        <div>
          <label className="text-[10px] text-gray-500 block mb-1.5">Preset Palette</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdateProperties({ fill: c })}
                className="w-5 h-5 rounded-full border border-gray-700 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stroke & Border */}
      <div className="border-b border-gray-800 p-3 space-y-3">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Stroke & Border
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={valStroke.startsWith('#') ? valStroke : '#000000'}
            onChange={(e) => onUpdateProperties({ stroke: e.target.value })}
            className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={valStroke}
            onChange={(e) => onUpdateProperties({ stroke: e.target.value })}
            className="flex-1 bg-gray-950 border border-gray-800 rounded px-2 py-1.5 outline-none font-mono text-gray-200 focus:border-indigo-500 uppercase"
          />
        </div>

        <div className="flex items-center justify-between bg-gray-950 px-2 py-1.5 rounded border border-gray-800">
          <span className="text-gray-400">Stroke Width</span>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              min="0"
              max="50"
              value={valStrokeWidth}
              onChange={(e) => handleChangeNumber('strokeWidth', e.target.value)}
              className="w-12 bg-transparent text-right outline-none text-gray-200 font-mono"
            />
            <span className="text-gray-500">px</span>
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-gray-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Opacity</span>
          <span className="font-mono text-gray-200">{valOpacity}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={valOpacity}
          onChange={(e) => onUpdateProperties({ opacity: parseFloat(e.target.value) / 100 })}
          className="w-full accent-indigo-500 cursor-pointer bg-gray-950 h-1.5 rounded-lg"
        />
      </div>
    </aside>
  );
}
