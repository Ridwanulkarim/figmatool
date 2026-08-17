import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';

export default function AlignDistributeControls({ onAlign, onDistribute, disabled }) {
  return (
    <div className="border-b border-gray-800 p-3 space-y-2 select-none">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Alignment & Distribution
      </div>

      <div className="grid grid-cols-6 gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800/80">
        {/* Align Left */}
        <button
          onClick={() => onAlign('left')}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          title="Align Left"
        >
          <AlignLeft size={15} />
        </button>

        {/* Align Center X */}
        <button
          onClick={() => onAlign('center')}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          title="Align Horizontal Center"
        >
          <AlignCenter size={15} />
        </button>

        {/* Align Right */}
        <button
          onClick={() => onAlign('right')}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          title="Align Right"
        >
          <AlignRight size={15} />
        </button>

        {/* Align Top */}
        <button
          onClick={() => onAlign('top')}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          title="Align Top"
        >
          <div className="rotate-90">
            <AlignRight size={15} />
          </div>
        </button>

        {/* Align Middle Y */}
        <button
          onClick={() => onAlign('middle')}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          title="Align Vertical Middle"
        >
          <div className="rotate-90">
            <AlignCenter size={15} />
          </div>
        </button>

        {/* Align Bottom */}
        <button
          onClick={() => onAlign('bottom')}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          title="Align Bottom"
        >
          <div className="rotate-90">
            <AlignLeft size={15} />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onDistribute('horizontal')}
          disabled={disabled}
          className="px-2 py-1.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-300 flex items-center justify-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Distribute Horizontally"
        >
          <AlignHorizontalSpaceAround size={14} />
          <span>Distribute H</span>
        </button>
        <button
          onClick={() => onDistribute('vertical')}
          disabled={disabled}
          className="px-2 py-1.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-300 flex items-center justify-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Distribute Vertically"
        >
          <AlignVerticalSpaceAround size={14} />
          <span>Distribute V</span>
        </button>
      </div>
    </div>
  );
}
