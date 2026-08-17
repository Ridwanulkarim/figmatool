import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Square,
  Circle,
  Type,
  Group,
  Ungroup,
  Download,
  Grid,
  Undo2,
  Redo2,
  FolderOpen,
  X,
  Sparkles,
  Command,
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTool,
  onGroup,
  onUngroup,
  onExportSVG,
  onExportPNG,
  onExportJSON,
  onToggleGrid,
  onUndo,
  onRedo,
  onOpenProjects,
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'tool-rect', name: 'Create Rectangle', category: 'Tools', shortcut: 'R', icon: Square, run: () => onSelectTool('rectangle') },
    { id: 'tool-circle', name: 'Create Circle', category: 'Tools', shortcut: 'O', icon: Circle, run: () => onSelectTool('circle') },
    { id: 'tool-text', name: 'Create Text', category: 'Tools', shortcut: 'T', icon: Type, run: () => onSelectTool('text') },
    { id: 'tool-select', name: 'Select Tool', category: 'Tools', shortcut: 'V', icon: Command, run: () => onSelectTool('select') },
    { id: 'action-group', name: 'Group Selected Elements', category: 'Arrange', shortcut: 'Cmd+G', icon: Group, run: onGroup },
    { id: 'action-ungroup', name: 'Ungroup Selected', category: 'Arrange', shortcut: 'Shift+G', icon: Ungroup, run: onUngroup },
    { id: 'action-undo', name: 'Undo Last Command', category: 'Edit', shortcut: 'Cmd+Z', icon: Undo2, run: onUndo },
    { id: 'action-redo', name: 'Redo Command', category: 'Edit', shortcut: 'Cmd+Shift+Z', icon: Redo2, run: onRedo },
    { id: 'export-svg', name: 'Export Design as SVG', category: 'Export', shortcut: 'SVG', icon: Download, run: onExportSVG },
    { id: 'export-png', name: 'Export Design as PNG', category: 'Export', shortcut: 'PNG', icon: Download, run: onExportPNG },
    { id: 'export-json', name: 'Export JSON Schema', category: 'Export', shortcut: 'JSON', icon: Download, run: onExportJSON },
    { id: 'toggle-grid', name: 'Toggle Alignment Grid', category: 'View', shortcut: 'Grid', icon: Grid, run: onToggleGrid },
    { id: 'open-projects', name: 'Open Projects Manager', category: 'Projects', shortcut: 'Cmd+O', icon: FolderOpen, run: onOpenProjects },
  ];

  const filtered = actions.filter((act) =>
    act.name.toLowerCase().includes(query.toLowerCase()) ||
    act.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center pt-24 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="p-3 border-b border-gray-800 flex items-center space-x-3 bg-gray-950">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or tool... (e.g. Create Rectangle, Group, Export)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm outline-none font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered.length > 0) {
                filtered[0].run();
                onClose();
              }
            }}
          />
          <span className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Action Results List */}
        <div className="p-2 overflow-y-auto flex-1 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">No matching commands found</div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.run();
                    onClose();
                  }}
                  className="w-full px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white flex items-center justify-between text-xs text-gray-300 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={16} className="text-indigo-400 group-hover:text-white transition-colors" />
                    <span className="font-medium">{action.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gray-500 group-hover:text-indigo-200">
                      {action.category}
                    </span>
                    <span className="text-[10px] font-mono bg-gray-800 group-hover:bg-indigo-700 text-gray-300 group-hover:text-white px-1.5 py-0.5 rounded">
                      {action.shortcut}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
