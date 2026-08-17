import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useViewport } from '../hooks/useViewport.js';
import { useSelection } from '../hooks/useSelection.js';
import { useClipboard } from '../hooks/useClipboard.js';
import { useHistory } from '../hooks/useHistory.js';
import { useInteraction } from '../hooks/useInteraction.js';

import {
  getProjectsList,
  loadProject,
  saveProject,
  createProject,
  deleteProject,
  initializePersistence,
} from '../utils/persistence.js';
import { setupKeyboardShortcuts } from '../utils/shortcuts.js';
import {
  DeleteElementsCommand,
  TransformElementsCommand,
  UpdatePropertiesCommand,
  GroupElementsCommand,
  UngroupElementsCommand,
  ReorderZIndexCommand,
} from '../utils/commands.js';
import { getMultiSelectionBoundingBox } from '../utils/geometry.js';
import { exportToSVG, exportToPNG, exportToJSON, importFromJSON } from '../utils/export.js';

const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  // Persistence & Project State
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectMeta, setCurrentProjectMeta] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Editor State
  const [sceneGraph, setSceneGraph] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [gridEnabled, setGridEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [editingTextElement, setEditingTextElement] = useState(null);

  // Hooks
  const viewportControls = useViewport();
  const selectionControls = useSelection(sceneGraph);
  const historyControls = useHistory(sceneGraph, setSceneGraph);
  const clipboardControls = useClipboard(
    sceneGraph,
    selectionControls.selectedIds,
    selectionControls.setSelectedIds,
    historyControls.historyManagerRef,
    setSceneGraph,
    historyControls.triggerHistoryUpdate
  );

  const interactionControls = useInteraction({
    sceneGraph,
    setSceneGraph,
    selectedIds: selectionControls.selectedIds,
    setSelectedIds: selectionControls.setSelectedIds,
    activeTool,
    setActiveTool,
    viewport: viewportControls.viewport,
    setViewport: viewportControls.setViewport,
    gridEnabled,
    historyManagerRef: historyControls.historyManagerRef,
    triggerHistoryUpdate: historyControls.triggerHistoryUpdate,
    setContextMenuPos,
  });

  // Load Initial Project
  useEffect(() => {
    const initialId = initializePersistence();
    const loaded = loadProject(initialId);
    if (loaded) {
      setCurrentProjectId(loaded.project.id);
      setCurrentProjectMeta(loaded.project);
      setSceneGraph(loaded.elements || []);
      if (loaded.viewport) viewportControls.setViewport(loaded.viewport);
    }
    setProjectsList(getProjectsList());
  }, []);

  // Autosave
  useEffect(() => {
    if (currentProjectId && currentProjectMeta) {
      saveProject(currentProjectId, currentProjectMeta, sceneGraph, viewportControls.viewport);
    }
  }, [sceneGraph, viewportControls.viewport, currentProjectId, currentProjectMeta]);

  // Action Helpers
  const handleDeleteSelected = useCallback(() => {
    if (selectionControls.selectedIds.length === 0) return;
    const toDelete = sceneGraph.filter(el => selectionControls.selectedIds.includes(el.id));
    const command = new DeleteElementsCommand(toDelete);
    const nextGraph = command.execute(sceneGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    selectionControls.clearSelection();
    historyControls.triggerHistoryUpdate();
  }, [selectionControls, sceneGraph, historyControls]);

  const handleNudge = useCallback((dx, dy) => {
    if (selectionControls.selectedIds.length === 0) return;
    const oldStates = sceneGraph.filter(el => selectionControls.selectedIds.includes(el.id));
    const newStates = oldStates.map(el => ({
      ...el,
      x: el.x + dx,
      y: el.y + dy,
    }));

    const command = new TransformElementsCommand(oldStates, newStates);
    const nextGraph = command.execute(sceneGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    historyControls.triggerHistoryUpdate();
  }, [selectionControls.selectedIds, sceneGraph, historyControls]);

  const handleGroupSelected = useCallback(() => {
    if (selectionControls.selectedIds.length < 2) return;
    const childrenToGroup = sceneGraph.filter(el => selectionControls.selectedIds.includes(el.id));
    const boundingBox = getMultiSelectionBoundingBox(childrenToGroup);

    const groupId = `group-${Date.now()}`;
    const groupElement = {
      id: groupId,
      type: 'group',
      name: `Group ${sceneGraph.filter(e => e.type === 'group').length + 1}`,
      x: boundingBox.x,
      y: boundingBox.y,
      width: boundingBox.width,
      height: boundingBox.height,
      rotation: 0,
      opacity: 1,
      children: childrenToGroup.map(c => c.id),
      hidden: false,
      locked: false,
    };

    const command = new GroupElementsCommand(groupElement, childrenToGroup);
    const nextGraph = command.execute(sceneGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    selectionControls.setSelectedIds([groupId]);
    historyControls.triggerHistoryUpdate();
  }, [selectionControls, sceneGraph, historyControls]);

  const handleUngroupSelected = useCallback(() => {
    if (selectionControls.selectedIds.length === 0) return;
    const selectedGroup = sceneGraph.find(el => selectionControls.selectedIds.includes(el.id) && el.type === 'group');
    if (!selectedGroup) return;

    const childElements = sceneGraph.filter(el => selectedGroup.children?.includes(el.id));
    const command = new UngroupElementsCommand(selectedGroup, childElements);
    const nextGraph = command.execute(sceneGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    selectionControls.setSelectedIds(childElements.map(c => c.id));
    historyControls.triggerHistoryUpdate();
  }, [selectionControls, sceneGraph, historyControls]);

  const handleSaveProject = useCallback(() => {
    if (currentProjectId && currentProjectMeta) {
      saveProject(currentProjectId, currentProjectMeta, sceneGraph, viewportControls.viewport);
    }
  }, [currentProjectId, currentProjectMeta, sceneGraph, viewportControls.viewport]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleCommandPaletteHotkey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleCommandPaletteHotkey);

    const cleanup = setupKeyboardShortcuts({
      onUndo: historyControls.handleUndo,
      onRedo: historyControls.handleRedo,
      onDelete: handleDeleteSelected,
      onNudge: handleNudge,
      onGroup: handleGroupSelected,
      onUngroup: handleUngroupSelected,
      onCopy: clipboardControls.handleCopy,
      onPaste: clipboardControls.handlePaste,
      onDuplicate: clipboardControls.handleDuplicate,
      onSave: handleSaveProject,
      onSelectTool: (tool) => setActiveTool(tool),
    });

    return () => {
      window.removeEventListener('keydown', handleCommandPaletteHotkey);
      cleanup();
    };
  }, [
    historyControls,
    handleDeleteSelected,
    handleNudge,
    handleGroupSelected,
    handleUngroupSelected,
    clipboardControls,
    handleSaveProject,
  ]);

  // Align / Distribute / Property Helpers
  const handleAlign = useCallback((type) => {
    if (selectionControls.selectedElements.length < 2) return;
    const bbox = getMultiSelectionBoundingBox(selectionControls.selectedElements);
    const oldStates = selectionControls.selectedElements.map(el => ({ ...el }));

    const newStates = oldStates.map(el => {
      let x = el.x;
      let y = el.y;
      if (type === 'left') x = bbox.x;
      if (type === 'center') x = bbox.x + (bbox.width - el.width) / 2;
      if (type === 'right') x = bbox.x + bbox.width - el.width;
      if (type === 'top') y = bbox.y;
      if (type === 'middle') y = bbox.y + (bbox.height - el.height) / 2;
      if (type === 'bottom') y = bbox.y + bbox.height - el.height;
      return { ...el, x, y };
    });

    const command = new TransformElementsCommand(oldStates, newStates);
    const nextGraph = command.execute(sceneGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    historyControls.triggerHistoryUpdate();
  }, [selectionControls.selectedElements, sceneGraph, historyControls]);

  const handleDistribute = useCallback((axis) => {
    if (selectionControls.selectedElements.length < 3) return;
    const sorted = [...selectionControls.selectedElements].sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));
    const oldStates = sorted.map(el => ({ ...el }));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (axis === 'horizontal') {
      const totalSpan = (last.x + last.width) - first.x;
      const combinedWidths = sorted.reduce((sum, el) => sum + el.width, 0);
      const gap = (totalSpan - combinedWidths) / (sorted.length - 1);
      let currentX = first.x;
      const newStates = sorted.map((el) => {
        const updated = { ...el, x: currentX };
        currentX += el.width + gap;
        return updated;
      });
      const command = new TransformElementsCommand(oldStates, newStates);
      const nextGraph = command.execute(sceneGraph);
      historyControls.historyManagerRef.current.push(command);
      setSceneGraph(nextGraph);
    } else {
      const totalSpan = (last.y + last.height) - first.y;
      const combinedHeights = sorted.reduce((sum, el) => sum + el.height, 0);
      const gap = (totalSpan - combinedHeights) / (sorted.length - 1);
      let currentY = first.y;
      const newStates = sorted.map((el) => {
        const updated = { ...el, y: currentY };
        currentY += el.height + gap;
        return updated;
      });
      const command = new TransformElementsCommand(oldStates, newStates);
      const nextGraph = command.execute(sceneGraph);
      historyControls.historyManagerRef.current.push(command);
      setSceneGraph(nextGraph);
    }
    historyControls.triggerHistoryUpdate();
  }, [selectionControls.selectedElements, sceneGraph, historyControls]);

  const handleUpdateProperties = useCallback((changes) => {
    if (selectionControls.selectedIds.length === 0) return;
    const previousMap = {};
    selectionControls.selectedElements.forEach(el => {
      previousMap[el.id] = { ...el };
    });

    const command = new UpdatePropertiesCommand(selectionControls.selectedIds, changes, previousMap);
    const nextGraph = command.execute(sceneGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    historyControls.triggerHistoryUpdate();
  }, [selectionControls, sceneGraph, historyControls]);

  const handleReorderLayer = useCallback((direction) => {
    if (selectionControls.selectedIds.length === 0) return;
    const prevGraph = [...sceneGraph];
    const nextGraph = [...sceneGraph];
    const targetId = selectionControls.selectedIds[0];
    const currentIndex = nextGraph.findIndex(e => e.id === targetId);
    if (currentIndex === -1) return;

    const [removed] = nextGraph.splice(currentIndex, 1);
    if (direction === 'front') nextGraph.push(removed);
    else if (direction === 'back') nextGraph.unshift(removed);
    else if (direction === 'forward') nextGraph.splice(Math.min(nextGraph.length, currentIndex + 1), 0, removed);
    else if (direction === 'backward') nextGraph.splice(Math.max(0, currentIndex - 1), 0, removed);

    const command = new ReorderZIndexCommand(prevGraph, nextGraph);
    historyControls.historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    historyControls.triggerHistoryUpdate();
  }, [selectionControls.selectedIds, sceneGraph, historyControls]);

  // Project Switch / Import Actions
  const handleSelectProject = useCallback((id) => {
    const loaded = loadProject(id);
    if (loaded) {
      setCurrentProjectId(loaded.project.id);
      setCurrentProjectMeta(loaded.project);
      setSceneGraph(loaded.elements || []);
      if (loaded.viewport) viewportControls.setViewport(loaded.viewport);
      selectionControls.clearSelection();
      historyControls.clearHistory();
      setIsProjectsModalOpen(false);
    }
  }, [viewportControls, selectionControls, historyControls]);

  const handleCreateProject = useCallback((name) => {
    const newMeta = createProject(name);
    setProjectsList(getProjectsList());
    handleSelectProject(newMeta.id);
  }, [handleSelectProject]);

  const handleRenameProject = useCallback((id, newName) => {
    const project = loadProject(id);
    if (project) {
      project.project.name = newName;
      saveProject(id, project.project, project.elements, project.viewport);
      setProjectsList(getProjectsList());
      if (id === currentProjectId) setCurrentProjectMeta(project.project);
    }
  }, [currentProjectId]);

  const handleDeleteProject = useCallback((id) => {
    deleteProject(id);
    const updatedList = getProjectsList();
    setProjectsList(updatedList);
    if (updatedList.length > 0 && id === currentProjectId) {
      handleSelectProject(updatedList[0].id);
    }
  }, [currentProjectId, handleSelectProject]);

  const handleImportJSON = useCallback((jsonString) => {
    const result = importFromJSON(jsonString);
    if (result.success) {
      const newMeta = createProject(result.project.name || 'Imported Design');
      saveProject(newMeta.id, newMeta, result.elements);
      setProjectsList(getProjectsList());
      handleSelectProject(newMeta.id);
    } else {
      alert(`Import Failed: ${result.error}`);
    }
  }, [handleSelectProject]);

  const value = {
    // Scene Graph & Selection
    sceneGraph,
    setSceneGraph,
    selectedIds: selectionControls.selectedIds,
    setSelectedIds: selectionControls.setSelectedIds,
    selectedElements: selectionControls.selectedElements,
    selectLayer: selectionControls.selectLayer,
    clearSelection: selectionControls.clearSelection,

    // Tools & Theme
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

    // Viewport
    viewport: viewportControls.viewport,
    setViewport: viewportControls.setViewport,
    zoomIn: viewportControls.zoomIn,
    zoomOut: viewportControls.zoomOut,
    resetZoom: viewportControls.resetZoom,
    fitCanvas: viewportControls.fitCanvas,
    setZoomLevel: viewportControls.setZoomLevel,
    handleWheelZoom: viewportControls.handleWheelZoom,

    // Commands & History
    canUndo: historyControls.canUndo,
    canRedo: historyControls.canRedo,
    handleUndo: historyControls.handleUndo,
    handleRedo: historyControls.handleRedo,

    // Actions
    handleDeleteSelected,
    handleGroupSelected,
    handleUngroupSelected,
    handleCopy: clipboardControls.handleCopy,
    handlePaste: clipboardControls.handlePaste,
    handleDuplicate: clipboardControls.handleDuplicate,
    hasClipboard: clipboardControls.hasClipboard,
    handleAlign,
    handleDistribute,
    handleUpdateProperties,
    handleReorderLayer,

    // Export
    onExportSVG: () => exportToSVG(sceneGraph, `${currentProjectMeta?.name || 'design'}.svg`),
    onExportPNG: () => exportToPNG(sceneGraph, `${currentProjectMeta?.name || 'design'}.png`),
    onExportJSON: () => exportToJSON(sceneGraph, currentProjectMeta, `${currentProjectMeta?.name || 'design'}.json`),
    onImportJSON: handleImportJSON,

    // Projects
    currentProjectMeta,
    projectsList,
    isProjectsModalOpen,
    setIsProjectsModalOpen,
    handleSelectProject,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,

    // Command Palette
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,

    // Interaction Controls
    interactionControls,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
