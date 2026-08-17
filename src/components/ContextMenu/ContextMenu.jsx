import React, { useEffect } from 'react';
import {
  Trash2,
  Copy,
  Clipboard,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Lock,
  EyeOff,
  CopyPlus,
} from 'lucide-react';

export default function ContextMenu({
  position,
  onClose,
  selectedCount,
  onDelete,
  onDuplicate,
  onCopy,
  onPaste,
  onGroup,
  onUngroup,
  onReorderZIndex,
  onToggleLock,
  onToggleHide,
  hasClipboard,
}) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside);
    };
  }, [onClose]);

  if (!position) return null;

  const isTargeted = selectedCount > 0;

  return (
    <div
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-gray-200 min-w-[170px] select-none backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {isTargeted ? (
        <>
          <button
            onClick={() => { onDuplicate(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <CopyPlus size={14} className="text-sky-400" />
            <span>Duplicate (Cmd+D)</span>
          </button>

          <button
            onClick={() => { onCopy(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <Copy size={14} />
            <span>Copy (Cmd+C)</span>
          </button>

          <button
            onClick={() => { onPaste(); onClose(); }}
            disabled={!hasClipboard}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Clipboard size={14} />
            <span>Paste (Cmd+V)</span>
          </button>

          <div className="my-1 border-t border-gray-700" />

          {selectedCount >= 2 && (
            <button
              onClick={() => { onGroup(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
            >
              <Group size={14} className="text-indigo-400" />
              <span>Group (Cmd+G)</span>
            </button>
          )}

          <button
            onClick={() => { onUngroup(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <Ungroup size={14} />
            <span>Ungroup (Shift+G)</span>
          </button>

          <div className="my-1 border-t border-gray-700" />

          <button
            onClick={() => { onReorderZIndex('front'); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <ChevronsUp size={14} />
            <span>Bring to Front</span>
          </button>
          <button
            onClick={() => { onReorderZIndex('forward'); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <ArrowUp size={14} />
            <span>Bring Forward</span>
          </button>
          <button
            onClick={() => { onReorderZIndex('backward'); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <ArrowDown size={14} />
            <span>Send Backward</span>
          </button>
          <button
            onClick={() => { onReorderZIndex('back'); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <ChevronsDown size={14} />
            <span>Send to Back</span>
          </button>

          <div className="my-1 border-t border-gray-700" />

          <button
            onClick={() => { onToggleLock(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <Lock size={14} className="text-amber-400" />
            <span>Lock / Unlock</span>
          </button>

          <button
            onClick={() => { onToggleHide(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
          >
            <EyeOff size={14} />
            <span>Hide / Show</span>
          </button>

          <div className="my-1 border-t border-gray-700" />

          <button
            onClick={() => { onDelete(); onClose(); }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white text-red-400 flex items-center space-x-2"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </>
      ) : (
        <>
          {/* Empty Canvas Context Actions */}
          <button
            onClick={() => { onPaste(); onClose(); }}
            disabled={!hasClipboard}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2 disabled:opacity-40"
          >
            <Clipboard size={14} />
            <span>Paste Here</span>
          </button>
        </>
      )}
    </div>
  );
}
