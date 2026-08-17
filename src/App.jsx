import React from 'react';
import { EditorProvider, useEditor } from './context/EditorContext.jsx';
import TopToolbar from './components/Toolbar/TopToolbar.jsx';
import LeftToolPanel from './components/Toolbar/LeftToolPanel.jsx';
import SVGCanvas from './components/Canvas/SVGCanvas.jsx';
import SelectionOverlay from './components/Canvas/SelectionOverlay.jsx';
import InPlaceTextEditor from './components/Canvas/InPlaceTextEditor.jsx';
import LayersPanel from './components/Layers/LayersPanel.jsx';
import PropertiesPanel from './components/Properties/PropertiesPanel.jsx';
import ContextMenu from './components/ContextMenu/ContextMenu.jsx';
import ProjectModal from './components/Projects/ProjectModal.jsx';
import CommandPalette from './components/CommandPalette/CommandPalette.jsx';
import StatusBar from './components/StatusBar/StatusBar.jsx';

import { hitTestPoint } from './utils/hitTesting.js';
import { screenToCanvas } from './utils/coordinates.js';

function EditorLayout() {
  const {
    sceneGraph,
    setSceneGraph,
    selectedIds,
    selectedElements,
    selectLayer,
    activeTool,
    setActiveTool,
    gridEnabled,
    setGridEnabled,
    darkMode,
    setDarkMode,
    editingTextElement,
    setEditingTextElement,
    contextMenuPos,
    setContextMenuPos,
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    fitCanvas,
    setZoomLevel,
    handleWheelZoom,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleGroupSelected,
    handleUngroupSelected,
    handleCopy,
    handlePaste,
    handleDuplicate,
    hasClipboard,
    handleAlign,
    handleDistribute,
    handleUpdateProperties,
    handleReorderLayer,
    onExportSVG,
    onExportPNG,
    onExportJSON,
    onImportJSON,
    currentProjectMeta,
    projectsList,
    isProjectsModalOpen,
    setIsProjectsModalOpen,
    handleSelectProject,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    interactionControls,
  } = useEditor();

  const handleDoubleClickCanvas = (e) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    const hitElement = hitTestPoint(canvasPt, sceneGraph);

    if (hitElement && hitElement.type === 'text') {
      setEditingTextElement(hitElement);
    } else if (!hitElement) {
      interactionControls.spawnShape('rectangle', canvasPt);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Top Navigation & Tool Header */}
      <TopToolbar
        currentProject={currentProjectMeta}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onSave={() => {}}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedCount={selectedIds.length}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
        onDeleteSelected={handleDeleteSelected}
        onExportSVG={onExportSVG}
        onExportPNG={onExportPNG}
        onExportJSON={onExportJSON}
        onImportJSON={onImportJSON}
        gridEnabled={gridEnabled}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Vertical Tool Palette */}
        <LeftToolPanel activeTool={activeTool} onSelectTool={(tool) => setActiveTool(tool)} />

        {/* Layers Tree Panel */}
        <LayersPanel
          sceneGraph={sceneGraph}
          selectedIds={selectedIds}
          onSelectLayer={selectLayer}
          onToggleVisibility={(id) => handleUpdateProperties({ hidden: !sceneGraph.find(e => e.id === id)?.hidden })}
          onToggleLock={(id) => handleUpdateProperties({ locked: !sceneGraph.find(e => e.id === id)?.locked })}
          onRenameLayer={(id, name) => setSceneGraph(prev => prev.map(e => e.id === id ? { ...e, name } : e))}
          onReorderLayer={handleReorderLayer}
        />

        {/* SVG Vector Canvas Area */}
        <div
          className="flex-1 flex flex-col relative overflow-hidden"
          onWheel={(e) => handleWheelZoom(e, e.currentTarget.getBoundingClientRect())}
        >
          <SVGCanvas
            sceneGraph={sceneGraph}
            viewport={viewport}
            activeTool={activeTool}
            gridEnabled={gridEnabled}
            guides={interactionControls.alignmentGuides}
            onPointerDown={interactionControls.handlePointerDown}
            onPointerMove={interactionControls.handlePointerMove}
            onPointerUp={interactionControls.handlePointerUp}
            onDoubleClickCanvas={handleDoubleClickCanvas}
            cursorStyle={
              activeTool === 'hand'
                ? interactionControls.interactionMode === 'pan' ? 'grabbing' : 'grab'
                : ['rectangle', 'circle', 'text'].includes(activeTool)
                ? 'crosshair'
                : 'default'
            }
          >
            {/* Interactive Overlays */}
            <SelectionOverlay
              selectedElements={selectedElements}
              sceneGraph={sceneGraph}
              viewport={viewport}
              marqueeBox={interactionControls.marqueeBox}
              onHandlePointerDown={(e, hId) => interactionControls.handleHandlePointerDown(e, hId, selectedElements)}
              onRotatePointerDown={(e) => interactionControls.handleRotatePointerDown(e, selectedElements)}
            />

            {/* In-Place Text Editor */}
            {editingTextElement && (
              <InPlaceTextEditor
                element={editingTextElement}
                viewport={viewport}
                onCommit={(newText) => {
                  handleUpdateProperties({ text: newText });
                  setEditingTextElement(null);
                }}
                onCancel={() => setEditingTextElement(null)}
              />
            )}
          </SVGCanvas>
        </div>

        {/* Properties Inspector Panel */}
        <PropertiesPanel
          selectedElements={selectedElements}
          sceneGraph={sceneGraph}
          onSelectLayer={selectLayer}
          onUpdateProperties={handleUpdateProperties}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
        />
      </div>

      {/* Floating Right-Click Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        selectedCount={selectedIds.length}
        onDelete={handleDeleteSelected}
        onDuplicate={handleDuplicate}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
        onReorderZIndex={handleReorderLayer}
        onToggleLock={() => handleUpdateProperties({ locked: !selectedElements[0]?.locked })}
        onToggleHide={() => handleUpdateProperties({ hidden: !selectedElements[0]?.hidden })}
        hasClipboard={hasClipboard}
      />

      {/* Spotlight Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTool={(tool) => setActiveTool(tool)}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
        onExportSVG={onExportSVG}
        onExportPNG={onExportPNG}
        onExportJSON={onExportJSON}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
      />

      {/* Projects Manager Modal */}
      <ProjectModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projectsList={projectsList}
        currentProjectId={currentProjectMeta?.id}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Status Bar with FPS Metrics */}
      <StatusBar
        cursorCanvasPos={interactionControls.cursorCanvasPos}
        selectedCount={selectedIds.length}
        sceneObjectCount={sceneGraph.length}
        zoom={viewport.zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitCanvas={fitCanvas}
        onSetZoom={setZoomLevel}
      />
    </div>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
