import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Group,
  Ungroup,
  Trash2,
  Download,
  FolderOpen,
  Save,
  FileCode,
  Image,
  ChevronDown,
  Layers,
  Sparkles,
  Grid,
  Check,
} from 'lucide-react';

export default function TopToolbar({
  currentProject,
  onOpenProjects,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedCount,
  onGroup,
  onUngroup,
  onDeleteSelected,
  onExportSVG,
  onExportPNG,
  onExportJSON,
  onImportJSON,
  gridEnabled,
  onToggleGrid,
  darkMode,
  onToggleDarkMode,
}) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onImportJSON(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
    setFileMenuOpen(false);
  };

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 text-gray-200 flex items-center justify-between px-3 z-30 select-none">
      {/* Left: Branding & Project Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold tracking-wider text-sm cursor-pointer hover:text-indigo-300 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles size={16} />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-white via-gray-200 to-indigo-300 bg-clip-text text-transparent font-extrabold text-base">
            VectorCraft
          </span>
        </div>

        <div className="h-4 w-px bg-gray-700 hidden sm:block" />

        {/* Project Name Button */}
        <button
          onClick={onOpenProjects}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors border border-transparent hover:border-gray-700"
          title="Switch or Manage Projects"
        >
          <FolderOpen size={14} className="text-amber-400" />
          <span className="max-w-[140px] truncate">{currentProject?.name || 'Untitled Project'}</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        {/* File Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          >
            File
          </button>

          {fileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFileMenuOpen(false)} />
              <div className="absolute left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 z-50 text-xs text-gray-200">
                <button
                  onClick={() => {
                    onSave();
                    setFileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
                >
                  <Save size={14} />
                  <span>Save Project (Cmd+S)</span>
                </button>
                <button
                  onClick={onOpenProjects}
                  className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
                >
                  <FolderOpen size={14} />
                  <span>Projects Manager...</span>
                </button>
                <div className="my-1 border-t border-gray-700" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
                >
                  <FileCode size={14} />
                  <span>Import JSON Design...</span>
                </button>
              </div>
            </>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
      </div>

      {/* Center: Quick Action Buttons */}
      <div className="flex items-center space-x-1">
        {/* Undo / Redo */}
        <div className="flex items-center bg-gray-800/80 rounded-lg p-0.5 border border-gray-700/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-all ${
              canUndo
                ? 'text-gray-200 hover:bg-gray-700 active:scale-95'
                : 'text-gray-600 cursor-not-allowed opacity-50'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-all ${
              canRedo
                ? 'text-gray-200 hover:bg-gray-700 active:scale-95'
                : 'text-gray-600 cursor-not-allowed opacity-50'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-800 mx-1" />

        {/* Group / Ungroup */}
        <button
          onClick={onGroup}
          disabled={selectedCount < 2}
          className={`p-1.5 rounded-lg border transition-all flex items-center space-x-1 text-xs ${
            selectedCount >= 2
              ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 active:scale-95'
              : 'bg-gray-900 border-transparent text-gray-600 cursor-not-allowed'
          }`}
          title="Group Selected (Ctrl+G)"
        >
          <Group size={15} />
          <span className="hidden md:inline">Group</span>
        </button>

        <button
          onClick={onUngroup}
          disabled={selectedCount < 1}
          className={`p-1.5 rounded-lg border transition-all flex items-center space-x-1 text-xs ${
            selectedCount >= 1
              ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 active:scale-95'
              : 'bg-gray-900 border-transparent text-gray-600 cursor-not-allowed'
          }`}
          title="Ungroup Selected (Shift+G)"
        >
          <Ungroup size={15} />
          <span className="hidden md:inline">Ungroup</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className={`p-1.5 rounded-lg transition-all ${
            selectedCount > 0
              ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300 active:scale-95'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Delete Selected (Del)"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Right: Export & Preferences */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
            gridEnabled
              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
          title="Toggle Grid Snapping"
        >
          <Grid size={14} />
          <span className="hidden lg:inline">Grid</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-xs shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Download size={14} />
            <span>Export</span>
            <ChevronDown size={12} />
          </button>

          {exportMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 z-50 text-xs text-gray-200">
                <button
                  onClick={() => {
                    onExportSVG();
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
                >
                  <FileCode size={14} className="text-sky-400" />
                  <span>Export as SVG</span>
                </button>
                <button
                  onClick={() => {
                    onExportPNG();
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
                >
                  <Image size={14} className="text-emerald-400" />
                  <span>Export as PNG</span>
                </button>
                <button
                  onClick={() => {
                    onExportJSON();
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center space-x-2"
                >
                  <FileCode size={14} className="text-amber-400" />
                  <span>Export JSON Schema</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
