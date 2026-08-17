import React from 'react';
import { MousePointer, Square, Circle, Type, Hand, ZoomIn } from 'lucide-react';

export default function LeftToolPanel({ activeTool, onSelectTool }) {
  const tools = [
    { id: 'select', name: 'Select', hotkey: 'V', icon: MousePointer },
    { id: 'rectangle', name: 'Rectangle', hotkey: 'R', icon: Square },
    { id: 'circle', name: 'Circle', hotkey: 'O', icon: Circle },
    { id: 'text', name: 'Text', hotkey: 'T', icon: Type },
    { id: 'hand', name: 'Hand (Pan)', hotkey: 'H', icon: Hand },
  ];

  return (
    <aside className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 space-y-2 z-20 select-none">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Icon size={18} />
            {/* Tooltip */}
            <div className="absolute left-14 bg-gray-800 text-gray-200 text-xs px-2.5 py-1 rounded shadow-xl border border-gray-700 whitespace-nowrap hidden group-hover:flex items-center space-x-1.5 z-50 pointer-events-none">
              <span className="font-medium">{tool.name}</span>
              <span className="text-gray-400 font-mono text-[10px] bg-gray-700 px-1 rounded">
                {tool.hotkey}
              </span>
            </div>
          </button>
        );
      })}
    </aside>
  );
}
