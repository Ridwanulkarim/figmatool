import React from 'react';
import { ChevronRight, Layers, Folder, Square, Circle, Type } from 'lucide-react';

export default function BreadcrumbNav({ selectedElements, sceneGraph, onSelectLayer }) {
  if (!selectedElements || selectedElements.length === 0) {
    return (
      <div className="px-3 py-1.5 bg-gray-950/60 border-b border-gray-800/80 text-[11px] text-gray-500 flex items-center space-x-1 select-none">
        <Layers size={12} className="text-gray-600" />
        <span>Canvas</span>
      </div>
    );
  }

  const primary = selectedElements[0];

  // Find parent group if element belongs to a group
  const parentGroup = sceneGraph.find(
    el => el.type === 'group' && el.children?.includes(primary.id)
  );

  const getIcon = (type) => {
    switch (type) {
      case 'rectangle': return <Square size={11} className="text-sky-400" />;
      case 'circle': return <Circle size={11} className="text-indigo-400" />;
      case 'text': return <Type size={11} className="text-emerald-400" />;
      case 'group': return <Folder size={11} className="text-amber-400" />;
      default: return <Square size={11} className="text-gray-400" />;
    }
  };

  return (
    <div className="px-3 py-1.5 bg-gray-950/60 border-b border-gray-800/80 text-[11px] text-gray-400 flex items-center space-x-1 select-none overflow-x-auto truncate">
      <span className="text-gray-500 hover:text-gray-300 cursor-pointer">Canvas</span>

      {parentGroup && (
        <>
          <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
          <button
            onClick={() => onSelectLayer(parentGroup.id)}
            className="hover:text-indigo-300 flex items-center space-x-1 truncate max-w-[80px]"
          >
            {getIcon('group')}
            <span className="truncate">{parentGroup.name}</span>
          </button>
        </>
      )}

      <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
      <div className="text-indigo-300 font-medium flex items-center space-x-1 truncate max-w-[100px]">
        {getIcon(primary.type)}
        <span className="truncate">
          {selectedElements.length > 1 ? `${selectedElements.length} Selected` : primary.name || primary.type}
        </span>
      </div>
    </div>
  );
}
