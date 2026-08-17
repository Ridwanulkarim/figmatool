import React, { useState } from 'react';
import {
  Layers,
  Square,
  Circle,
  Type,
  Folder,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';

export default function LayersPanel({
  sceneGraph,
  selectedIds,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
  onReorderLayer,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Render top-level layers in reverse z-index order
  const topLevelLayers = [...sceneGraph.filter(el => !el.parentId)].reverse();

  const toggleGroupExpand = (groupId, e) => {
    e.stopPropagation();
    const next = new Set(expandedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setExpandedGroups(next);
  };

  const handleStartRename = (el, e) => {
    e.stopPropagation();
    setEditingId(el.id);
    setEditingName(el.name || el.type);
  };

  const handleCommitRename = (id) => {
    if (editingName.trim()) {
      onRenameLayer(id, editingName.trim());
    }
    setEditingId(null);
  };

  const getElementIcon = (type) => {
    switch (type) {
      case 'rectangle':
        return <Square size={14} className="text-sky-400" />;
      case 'circle':
        return <Circle size={14} className="text-indigo-400" />;
      case 'text':
        return <Type size={14} className="text-emerald-400" />;
      case 'group':
        return <Folder size={14} className="text-amber-400" />;
      default:
        return <Square size={14} className="text-gray-400" />;
    }
  };

  const renderLayerItem = (el, depth = 0) => {
    const isSelected = selectedIds.includes(el.id);
    const isGroup = el.type === 'group';
    const isExpanded = expandedGroups.has(el.id);

    return (
      <div key={el.id} className="flex flex-col">
        <div
          onClick={(e) => onSelectLayer(el.id, e.shiftKey)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group h-8 pr-2 flex items-center justify-between text-xs cursor-pointer transition-colors border-l-2 ${
            isSelected
              ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
              : 'border-transparent text-gray-300 hover:bg-gray-800/60'
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {isGroup ? (
              <button
                onClick={(e) => toggleGroupExpand(el.id, e)}
                className="text-gray-500 hover:text-gray-200"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-3" />
            )}

            {getElementIcon(el.type)}

            {editingId === el.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleCommitRename(el.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitRename(el.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="bg-gray-950 text-white px-1 py-0.5 rounded border border-indigo-500 outline-none text-xs w-28"
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={(e) => handleStartRename(el, e)}
                className="truncate max-w-[110px]"
                title="Double click to rename"
              >
                {el.name || `${el.type} ${el.id.slice(-3)}`}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(el.id);
              }}
              className={`p-1 rounded ${
                el.hidden ? 'text-amber-400 opacity-100' : 'text-gray-500 hover:text-gray-200'
              }`}
              title={el.hidden ? 'Show Layer' : 'Hide Layer'}
            >
              {el.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(el.id);
              }}
              className={`p-1 rounded ${
                el.locked ? 'text-amber-400 opacity-100' : 'text-gray-500 hover:text-gray-200'
              }`}
              title={el.locked ? 'Unlock Layer' : 'Lock Layer'}
            >
              {el.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </div>
        </div>

        {/* Group Children sub-tree */}
        {isGroup && isExpanded && el.children && (
          <div className="flex flex-col">
            {el.children.map(childId => {
              const child = sceneGraph.find(c => c.id === childId);
              return child ? renderLayerItem(child, depth + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full select-none z-10">
      {/* Header */}
      <div className="h-10 border-b border-gray-800 px-3 flex items-center justify-between text-xs font-semibold text-gray-400">
        <div className="flex items-center space-x-1.5">
          <Layers size={14} className="text-indigo-400" />
          <span>Layers</span>
        </div>
        <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
          {topLevelLayers.length}
        </span>
      </div>

      {/* Layer Reorder Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-gray-900/90 border-b border-gray-800 px-2 py-1 flex items-center justify-around text-gray-400">
          <button
            onClick={() => onReorderLayer('front')}
            className="p-1 hover:bg-gray-800 hover:text-white rounded"
            title="Bring to Front"
          >
            <ChevronsUp size={14} />
          </button>
          <button
            onClick={() => onReorderLayer('forward')}
            className="p-1 hover:bg-gray-800 hover:text-white rounded"
            title="Bring Forward"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => onReorderLayer('backward')}
            className="p-1 hover:bg-gray-800 hover:text-white rounded"
            title="Send Backward"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => onReorderLayer('back')}
            className="p-1 hover:bg-gray-800 hover:text-white rounded"
            title="Send to Back"
          >
            <ChevronsDown size={14} />
          </button>
        </div>
      )}

      {/* Layers Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {topLevelLayers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-600">No layers in scene</div>
        ) : (
          topLevelLayers.map(el => renderLayerItem(el, 0))
        )}
      </div>
    </div>
  );
}
