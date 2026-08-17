import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TopToolbar from './components/Toolbar/TopToolbar.jsx';
import LeftToolPanel from './components/Toolbar/LeftToolPanel.jsx';
import SVGCanvas from './components/Canvas/SVGCanvas.jsx';
import SelectionOverlay from './components/Canvas/SelectionOverlay.jsx';
import InPlaceTextEditor from './components/Canvas/InPlaceTextEditor.jsx';
import LayersPanel from './components/Layers/LayersPanel.jsx';
import PropertiesPanel from './components/Properties/PropertiesPanel.jsx';
import ContextMenu from './components/ContextMenu/ContextMenu.jsx';
import ProjectModal from './components/Projects/ProjectModal.jsx';
import StatusBar from './components/StatusBar/StatusBar.jsx';

import { getBoundingBox, getMultiSelectionBoundingBox, calculateResize, calculateRotation } from './utils/geometry.js';
import { hitTestPoint, hitTestRectangle } from './utils/hitTesting.js';
import { screenToCanvas, canvasToScreen } from './utils/coordinates.js';
import { calculateSnapping } from './utils/snapping.js';
import {
  HistoryManager,
  AddElementsCommand,
  DeleteElementsCommand,
  TransformElementsCommand,
  UpdatePropertiesCommand,
  GroupElementsCommand,
  UngroupElementsCommand,
  ReorderZIndexCommand,
} from './utils/commands.js';
import { exportToSVG, exportToPNG, exportToJSON, importFromJSON } from './utils/export.js';
import {
  getProjectsList,
  loadProject,
  saveProject,
  createProject,
  deleteProject,
  initializePersistence,
} from './utils/persistence.js';
import { setupKeyboardShortcuts } from './utils/shortcuts.js';

export default function App() {
  // Persistence & Projects State
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectMeta, setCurrentProjectMeta] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Core Editor State
  const [sceneGraph, setSceneGraph] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [viewport, setViewport] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [gridEnabled, setGridEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Interaction State
  const [interactionMode, setInteractionMode] = useState(null); // null, 'drag', 'resize', 'rotate', 'marquee', 'pan'
  const [dragStartPoint, setDragStartPoint] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const [marqueeBox, setMarqueeBox] = useState(null);
  const [alignmentGuides, setAlignmentGuides] = useState([]);
  const [cursorCanvasPos, setCursorCanvasPos] = useState({ x: 0, y: 0 });
  const [editingTextElement, setEditingTextElement] = useState(null);

  // Context Menu & Clipboard
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [clipboard, setClipboard] = useState([]);

  // Command History Manager Ref (Persistent instance)
  const historyManagerRef = useRef(new HistoryManager(50));
  const [, forceUpdate] = useState({});
  const triggerHistoryUpdate = () => forceUpdate({});

  // Initial Drag State snapshot for single history record on pointerup
  const initialDragStateRef = useRef([]);

  // Active Selected Objects Memo
  const selectedElements = useMemo(() => {
    const idSet = new Set(selectedIds);
    return sceneGraph.filter(el => idSet.has(el.id));
  }, [sceneGraph, selectedIds]);

  // Load Initial Project on Mount
  useEffect(() => {
    const initialId = initializePersistence();
    const loaded = loadProject(initialId);
    if (loaded) {
      setCurrentProjectId(loaded.project.id);
      setCurrentProjectMeta(loaded.project);
      setSceneGraph(loaded.elements || []);
      if (loaded.viewport) setViewport(loaded.viewport);
    }
    setProjectsList(getProjectsList());
  }, []);

  // Autosave Project on Scene Graph / Viewport changes
  useEffect(() => {
    if (currentProjectId && currentProjectMeta) {
      saveProject(currentProjectId, currentProjectMeta, sceneGraph, viewport);
    }
  }, [sceneGraph, viewport, currentProjectId, currentProjectMeta]);

  // Undo / Redo Trigger Helpers
  const handleUndo = useCallback(() => {
    const nextGraph = historyManagerRef.current.undo(sceneGraph);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  }, [sceneGraph]);

  const handleRedo = useCallback(() => {
    const nextGraph = historyManagerRef.current.redo(sceneGraph);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  }, [sceneGraph]);

  // Delete Selected Elements
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toDelete = sceneGraph.filter(el => selectedIds.includes(el.id));
    const command = new DeleteElementsCommand(toDelete);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds([]);
    triggerHistoryUpdate();
  }, [selectedIds, sceneGraph]);

  // Nudge Selected Elements with Arrow Keys
  const handleNudge = useCallback((dx, dy) => {
    if (selectedIds.length === 0) return;
    const oldStates = sceneGraph.filter(el => selectedIds.includes(el.id));
    const newStates = oldStates.map(el => ({
      ...el,
      x: el.x + dx,
      y: el.y + dy,
    }));

    const command = new TransformElementsCommand(oldStates, newStates);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  }, [selectedIds, sceneGraph]);

  // Group Selected
  const handleGroupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const childrenToGroup = sceneGraph.filter(el => selectedIds.includes(el.id));
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
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds([groupId]);
    triggerHistoryUpdate();
  }, [selectedIds, sceneGraph]);

  // Ungroup Selected
  const handleUngroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selectedGroup = sceneGraph.find(el => selectedIds.includes(el.id) && el.type === 'group');
    if (!selectedGroup) return;

    const childElements = sceneGraph.filter(el => selectedGroup.children?.includes(el.id));
    const command = new UngroupElementsCommand(selectedGroup, childElements);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds(childElements.map(c => c.id));
    triggerHistoryUpdate();
  }, [selectedIds, sceneGraph]);

  // Copy / Paste / Duplicate
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;
    const copied = sceneGraph.filter(el => selectedIds.includes(el.id));
    setClipboard(copied);
  }, [selectedIds, sceneGraph]);

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return;
    const pasted = clipboard.map((el, idx) => ({
      ...el,
      id: `${el.type}-${Date.now()}-${idx}`,
      name: `${el.name || el.type} (Copy)`,
      x: el.x + 20,
      y: el.y + 20,
    }));

    const command = new AddElementsCommand(pasted);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds(pasted.map(p => p.id));
    triggerHistoryUpdate();
  }, [clipboard, sceneGraph]);

  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    const targets = sceneGraph.filter(el => selectedIds.includes(el.id));
    const duplicated = targets.map((el, idx) => ({
      ...el,
      id: `${el.type}-${Date.now()}-${idx}`,
      name: `${el.name || el.type} (Copy)`,
      x: el.x + 20,
      y: el.y + 20,
    }));

    const command = new AddElementsCommand(duplicated);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds(duplicated.map(d => d.id));
    triggerHistoryUpdate();
  }, [selectedIds, sceneGraph]);

  // Save Project Action
  const handleSaveProject = useCallback(() => {
    if (currentProjectId && currentProjectMeta) {
      saveProject(currentProjectId, currentProjectMeta, sceneGraph, viewport);
    }
  }, [currentProjectId, currentProjectMeta, sceneGraph, viewport]);

  // Setup Keyboard Shortcuts
  useEffect(() => {
    const cleanup = setupKeyboardShortcuts({
      onUndo: handleUndo,
      onRedo: handleRedo,
      onDelete: handleDeleteSelected,
      onNudge: handleNudge,
      onGroup: handleGroupSelected,
      onUngroup: handleUngroupSelected,
      onCopy: handleCopy,
      onPaste: handlePaste,
      onDuplicate: handleDuplicate,
      onSave: handleSaveProject,
      onSelectTool: (tool) => setActiveTool(tool),
    });
    return cleanup;
  }, [
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleNudge,
    handleGroupSelected,
    handleUngroupSelected,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleSaveProject,
  ]);

  // Create Shape Helper
  const spawnShape = (type, canvasPos) => {
    const shapeCount = sceneGraph.filter(el => el.type === type).length + 1;
    const defaultW = type === 'text' ? 140 : 120;
    const defaultH = type === 'text' ? 30 : 100;

    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${shapeCount}`,
      x: Math.round(canvasPos.x - defaultW / 2),
      y: Math.round(canvasPos.y - defaultH / 2),
      width: defaultW,
      height: defaultH,
      rotation: 0,
      fill: type === 'text' ? '#ffffff' : type === 'rectangle' ? '#6366f1' : '#0d99ff',
      stroke: '#000000',
      strokeWidth: 0,
      opacity: 1,
      hidden: false,
      locked: false,
      ...(type === 'text'
        ? {
            text: 'Editable Text',
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            textAlign: 'left',
          }
        : {}),
    };

    const command = new AddElementsCommand(newElement);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds([newElement.id]);
    setActiveTool('select');
    triggerHistoryUpdate();
  };

  // Pointer Down Handler
  const handlePointerDown = (e) => {
    if (e.button === 2) {
      // Right click context menu
      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      return;
    }
    setContextMenuPos(null);

    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);

    // Pan with Middle Mouse Button or Hand Tool
    if (e.button === 1 || activeTool === 'hand' || e.spaceKey) {
      setInteractionMode('pan');
      setDragStartPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Shape Creation Tools (Rectangle, Circle, Text)
    if (['rectangle', 'circle', 'text'].includes(activeTool)) {
      spawnShape(activeTool, canvasPt);
      return;
    }

    // Select Tool Hit Testing
    const hitElement = hitTestPoint(canvasPt, sceneGraph);

    if (hitElement) {
      const isAlreadySelected = selectedIds.includes(hitElement.id);
      let newSelectedIds = selectedIds;

      if (e.shiftKey) {
        if (isAlreadySelected) {
          newSelectedIds = selectedIds.filter(id => id !== hitElement.id);
        } else {
          newSelectedIds = [...selectedIds, hitElement.id];
        }
      } else {
        if (!isAlreadySelected) {
          newSelectedIds = [hitElement.id];
        }
      }

      setSelectedIds(newSelectedIds);
      setInteractionMode('drag');
      setDragStartPoint(canvasPt);

      // Record initial drag state for command history on pointerup
      const targets = sceneGraph.filter(el => newSelectedIds.includes(el.id));
      initialDragStateRef.current = targets.map(el => ({ ...el }));
    } else {
      // Clicked empty canvas
      if (!e.shiftKey) {
        setSelectedIds([]);
      }
      setInteractionMode('marquee');
      setDragStartPoint(canvasPt);
      setMarqueeBox({ x: canvasPt.x, y: canvasPt.y, width: 0, height: 0 });
    }
  };

  // Pointer Move Handler
  const handlePointerMove = (e) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    setCursorCanvasPos(canvasPt);

    if (!interactionMode) return;

    // Viewport Panning Mode
    if (interactionMode === 'pan') {
      const dx = e.clientX - dragStartPoint.x;
      const dy = e.clientY - dragStartPoint.y;
      setViewport(prev => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy,
      }));
      setDragStartPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Marquee Selection Drag
    if (interactionMode === 'marquee') {
      const width = canvasPt.x - dragStartPoint.x;
      const height = canvasPt.y - dragStartPoint.y;
      const box = {
        x: width < 0 ? canvasPt.x : dragStartPoint.x,
        y: height < 0 ? canvasPt.y : dragStartPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      };
      setMarqueeBox(box);

      const matchedIds = hitTestRectangle(box, sceneGraph);
      setSelectedIds(matchedIds);
      return;
    }

    // Move / Drag Selected Elements
    if (interactionMode === 'drag') {
      const dx = canvasPt.x - dragStartPoint.x;
      const dy = canvasPt.y - dragStartPoint.y;

      const initialTargets = initialDragStateRef.current;
      if (initialTargets.length === 0) return;

      // Calculate candidate bounding box for snapping
      const primaryTarget = initialTargets[0];
      const candidateBox = {
        x: primaryTarget.x + dx,
        y: primaryTarget.y + dy,
        width: primaryTarget.width,
        height: primaryTarget.height,
      };

      const otherElements = sceneGraph.filter(el => !selectedIds.includes(el.id));
      const snapResult = calculateSnapping(candidateBox, otherElements, gridEnabled);
      setAlignmentGuides(snapResult.guides);

      const finalDx = snapResult.x - primaryTarget.x;
      const finalDy = snapResult.y - primaryTarget.y;

      // Live update scene graph state cleanly
      setSceneGraph(prev =>
        prev.map(el => {
          if (selectedIds.includes(el.id)) {
            const initial = initialTargets.find(it => it.id === el.id);
            if (initial) {
              return {
                ...el,
                x: initial.x + finalDx,
                y: initial.y + finalDy,
              };
            }
          }
          return el;
        })
      );
      return;
    }

    // Resize Element Mode
    if (interactionMode === 'resize' && activeHandle && selectedElements.length > 0) {
      const dx = canvasPt.x - dragStartPoint.x;
      const dy = canvasPt.y - dragStartPoint.y;
      const target = initialDragStateRef.current[0];
      if (!target) return;

      const resized = calculateResize({
        element: target,
        handle: activeHandle,
        dx,
        dy,
        keepAspectRatio: e.shiftKey,
      });

      setSceneGraph(prev =>
        prev.map(el => (el.id === target.id ? { ...el, ...resized } : el))
      );
      return;
    }

    // Rotate Element Mode
    if (interactionMode === 'rotate' && selectedElements.length > 0) {
      const target = initialDragStateRef.current[0];
      if (!target) return;

      const rotation = calculateRotation(target, canvasPt, e.shiftKey);
      setSceneGraph(prev =>
        prev.map(el => (el.id === target.id ? { ...el, rotation } : el))
      );
    }
  };

  // Pointer Up Handler (Commits single command transaction to history)
  const handlePointerUp = () => {
    if (interactionMode === 'drag' || interactionMode === 'resize' || interactionMode === 'rotate') {
      const oldStates = initialDragStateRef.current;
      const newStates = sceneGraph.filter(el => selectedIds.includes(el.id));

      // Only push to history if positions/dimensions actually changed
      const hasChanged = newStates.some((ns) => {
        const os = oldStates.find(o => o.id === ns.id);
        return os && (os.x !== ns.x || os.y !== ns.y || os.width !== ns.width || os.height !== ns.height || os.rotation !== ns.rotation);
      });

      if (hasChanged) {
        const command = new TransformElementsCommand(oldStates, newStates);
        historyManagerRef.current.push(command);
        triggerHistoryUpdate();
      }
    }

    setInteractionMode(null);
    setDragStartPoint(null);
    setActiveHandle(null);
    setMarqueeBox(null);
    setAlignmentGuides([]);
    initialDragStateRef.current = [];
  };

  // Double Click Canvas / In-Place Text Editing Handler
  const handleDoubleClickCanvas = (e) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    const hitElement = hitTestPoint(canvasPt, sceneGraph);

    if (hitElement && hitElement.type === 'text') {
      setEditingTextElement(hitElement);
    } else if (!hitElement) {
      // Requirement #32: Double-click empty canvas spawns shape near clicked location
      spawnShape('rectangle', canvasPt);
    }
  };

  // Handle Resize Pointer Down
  const handleHandlePointerDown = (e, handleId) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    setInteractionMode('resize');
    setActiveHandle(handleId);
    setDragStartPoint(canvasPt);
    initialDragStateRef.current = selectedElements.map(el => ({ ...el }));
  };

  // Handle Rotate Pointer Down
  const handleRotatePointerDown = (e) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    setInteractionMode('rotate');
    setDragStartPoint(canvasPt);
    initialDragStateRef.current = selectedElements.map(el => ({ ...el }));
  };

  // Mouse Wheel Zooming & Pan
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom centered at mouse position
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.1), 5);

      const canvasBounds = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - canvasBounds.left;
      const mouseY = e.clientY - canvasBounds.top;

      const panX = mouseX - (mouseX - viewport.panX) * (newZoom / viewport.zoom);
      const panY = mouseY - (mouseY - viewport.panY) * (newZoom / viewport.zoom);

      setViewport({ panX, panY, zoom: newZoom });
    } else {
      // Pan
      setViewport(prev => ({
        ...prev,
        panX: prev.panX - e.deltaX,
        panY: prev.panY - e.deltaY,
      }));
    }
  };

  // Alignment Helpers
  const handleAlign = (type) => {
    if (selectedElements.length < 2) return;
    const bbox = getMultiSelectionBoundingBox(selectedElements);
    const oldStates = selectedElements.map(el => ({ ...el }));

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
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  };

  // Distribution Helpers
  const handleDistribute = (axis) => {
    if (selectedElements.length < 3) return;
    const sorted = [...selectedElements].sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));
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
      historyManagerRef.current.push(command);
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
      historyManagerRef.current.push(command);
      setSceneGraph(nextGraph);
    }
    triggerHistoryUpdate();
  };

  // Property Update Helper
  const handleUpdateProperties = (changes) => {
    if (selectedIds.length === 0) return;
    const previousMap = {};
    selectedElements.forEach(el => {
      previousMap[el.id] = { ...el };
    });

    const command = new UpdatePropertiesCommand(selectedIds, changes, previousMap);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  };

  // Layer Reordering Helpers
  const handleReorderLayer = (direction) => {
    if (selectedIds.length === 0) return;
    const prevGraph = [...sceneGraph];
    const nextGraph = [...sceneGraph];

    const targetId = selectedIds[0];
    const currentIndex = nextGraph.findIndex(e => e.id === targetId);
    if (currentIndex === -1) return;

    const [removed] = nextGraph.splice(currentIndex, 1);

    if (direction === 'front') {
      nextGraph.push(removed);
    } else if (direction === 'back') {
      nextGraph.unshift(removed);
    } else if (direction === 'forward') {
      const newIdx = Math.min(nextGraph.length, currentIndex + 1);
      nextGraph.splice(newIdx, 0, removed);
    } else if (direction === 'backward') {
      const newIdx = Math.max(0, currentIndex - 1);
      nextGraph.splice(newIdx, 0, removed);
    }

    const command = new ReorderZIndexCommand(prevGraph, nextGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  };

  // Project Management Actions
  const handleSelectProject = (id) => {
    const loaded = loadProject(id);
    if (loaded) {
      setCurrentProjectId(loaded.project.id);
      setCurrentProjectMeta(loaded.project);
      setSceneGraph(loaded.elements || []);
      if (loaded.viewport) setViewport(loaded.viewport);
      setSelectedIds([]);
      historyManagerRef.current.clear();
      setIsProjectsModalOpen(false);
      triggerHistoryUpdate();
    }
  };

  const handleCreateProject = (name) => {
    const newMeta = createProject(name);
    setProjectsList(getProjectsList());
    handleSelectProject(newMeta.id);
  };

  const handleRenameProject = (id, newName) => {
    const project = loadProject(id);
    if (project) {
      project.project.name = newName;
      saveProject(id, project.project, project.elements, project.viewport);
      setProjectsList(getProjectsList());
      if (id === currentProjectId) {
        setCurrentProjectMeta(project.project);
      }
    }
  };

  const handleDeleteProject = (id) => {
    deleteProject(id);
    const updatedList = getProjectsList();
    setProjectsList(updatedList);
    if (updatedList.length > 0 && id === currentProjectId) {
      handleSelectProject(updatedList[0].id);
    }
  };

  // JSON Import Handler
  const handleImportJSON = (jsonString) => {
    const result = importFromJSON(jsonString);
    if (result.success) {
      const newMeta = createProject(result.project.name || 'Imported Design');
      saveProject(newMeta.id, newMeta, result.elements);
      setProjectsList(getProjectsList());
      handleSelectProject(newMeta.id);
    } else {
      alert(`Import Failed: ${result.error}`);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Top Toolbar */}
      <TopToolbar
        currentProject={currentProjectMeta}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onSave={handleSaveProject}
        canUndo={historyManagerRef.current.canUndo()}
        canRedo={historyManagerRef.current.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedCount={selectedIds.length}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
        onDeleteSelected={handleDeleteSelected}
        onExportSVG={() => exportToSVG(sceneGraph, `${currentProjectMeta?.name || 'design'}.svg`)}
        onExportPNG={() => exportToPNG(sceneGraph, `${currentProjectMeta?.name || 'design'}.png`)}
        onExportJSON={() => exportToJSON(sceneGraph, currentProjectMeta, `${currentProjectMeta?.name || 'design'}.json`)}
        onImportJSON={handleImportJSON}
        gridEnabled={gridEnabled}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Tool Panel */}
        <LeftToolPanel activeTool={activeTool} onSelectTool={(tool) => setActiveTool(tool)} />

        {/* Left Layers Panel */}
        <LayersPanel
          sceneGraph={sceneGraph}
          selectedIds={selectedIds}
          onSelectLayer={(id, isShift) => {
            if (isShift) {
              setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
            } else {
              setSelectedIds([id]);
            }
          }}
          onToggleVisibility={(id) => handleUpdateProperties({ hidden: !sceneGraph.find(e => e.id === id)?.hidden })}
          onToggleLock={(id) => handleUpdateProperties({ locked: !sceneGraph.find(e => e.id === id)?.locked })}
          onRenameLayer={(id, name) => setSceneGraph(prev => prev.map(e => e.id === id ? { ...e, name } : e))}
          onReorderLayer={handleReorderLayer}
        />

        {/* Center SVG Vector Canvas Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden" onWheel={handleWheel}>
          <SVGCanvas
            sceneGraph={sceneGraph}
            viewport={viewport}
            activeTool={activeTool}
            gridEnabled={gridEnabled}
            guides={alignmentGuides}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClickCanvas={handleDoubleClickCanvas}
            cursorStyle={
              activeTool === 'hand'
                ? interactionMode === 'pan' ? 'grabbing' : 'grab'
                : activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'text'
                ? 'crosshair'
                : 'default'
            }
          >
            {/* Selection Bounding Box & 8 Handles */}
            <SelectionOverlay
              selectedElements={selectedElements}
              sceneGraph={sceneGraph}
              viewport={viewport}
              marqueeBox={marqueeBox}
              onHandlePointerDown={handleHandlePointerDown}
              onRotatePointerDown={handleRotatePointerDown}
            />

            {/* In-Place Text Editing Overlay */}
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

        {/* Right Inspector Properties Panel */}
        <PropertiesPanel
          selectedElements={selectedElements}
          onUpdateProperties={handleUpdateProperties}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
        />
      </div>

      {/* Context Right-Click Floating Menu */}
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
        hasClipboard={clipboard.length > 0}
      />

      {/* Projects Manager Modal */}
      <ProjectModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projectsList={projectsList}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Bottom Status & Zoom Bar */}
      <StatusBar
        cursorCanvasPos={cursorCanvasPos}
        selectedCount={selectedIds.length}
        zoom={viewport.zoom}
        onZoomIn={() => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }))}
        onZoomOut={() => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }))}
        onResetZoom={() => setViewport(prev => ({ ...prev, zoom: 1 }))}
        onFitCanvas={() => setViewport({ panX: 0, panY: 0, zoom: 1 })}
        onSetZoom={(z) => setViewport(prev => ({ ...prev, zoom: z }))}
      />
    </div>
  );
}
