import { useState, useRef, useCallback } from 'react';
import { screenToCanvas } from '../utils/coordinates.js';
import { hitTestPoint, hitTestRectangle } from '../utils/hitTesting.js';
import {
  calculateResize,
  calculatePointerAngle,
  calculateRotationDelta,
  getTopLevelSelectableElement,
  getMultiSelectionBoundingBox,
  rotatePoint,
} from '../utils/geometry.js';
import { calculateSnapping } from '../utils/snapping.js';
import { TransformElementsCommand, AddElementsCommand } from '../utils/commands.js';

/**
 * Helper to gather top-level selected element IDs and descendant child IDs for hierarchy operations
 */
export function collectAllSelectedAndDescendantIds(selectedIds, sceneGraph) {
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));
  const targetIds = new Set();

  const collect = (id) => {
    if (targetIds.has(id)) return;
    targetIds.add(id);
    const el = sceneGraphMap.get(id);
    if (el && el.type === 'group' && el.children) {
      el.children.forEach(childId => collect(childId));
    }
  };

  selectedIds.forEach(id => collect(id));
  return targetIds;
}

/**
 * Custom Hook managing canvas interaction modes ('drag', 'resize', 'rotate', 'marquee', 'pan')
 * Implements Model A Local Coordinate Architecture
 */
export function useInteraction({
  sceneGraph,
  setSceneGraph,
  selectedIds,
  setSelectedIds,
  activeTool,
  setActiveTool,
  viewport,
  setViewport,
  gridEnabled,
  historyManagerRef,
  triggerHistoryUpdate,
  setContextMenuPos,
}) {
  const [interactionMode, setInteractionMode] = useState(null);
  const [dragStartPoint, setDragStartPoint] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const [marqueeBox, setMarqueeBox] = useState(null);
  const [alignmentGuides, setAlignmentGuides] = useState([]);
  const [cursorCanvasPos, setCursorCanvasPos] = useState({ x: 0, y: 0 });

  const initialDragStateRef = useRef([]);
  const initialRotationStateRef = useRef({ initialPointerAngle: 0, initialElementRotation: 0, center: { x: 0, y: 0 } });
  const activeDragIdsRef = useRef(new Set());
  const initialBBoxRef = useRef(null);

  const spawnShape = useCallback((type, canvasPos) => {
    const shapeCount = sceneGraph.filter(el => el.type === type).length + 1;
    const defaultW = type === 'text' ? 140 : 120;
    const defaultH = type === 'text' ? 30 : 100;

    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${shapeCount}`,
      parentId: null,
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
  }, [sceneGraph, setSceneGraph, setSelectedIds, setActiveTool, historyManagerRef, triggerHistoryUpdate]);

  const handlePointerDown = useCallback((e) => {
    if (e.button === 2) {
      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      return;
    }
    setContextMenuPos(null);

    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);

    if (e.button === 1 || activeTool === 'hand' || e.spaceKey) {
      setInteractionMode('pan');
      setDragStartPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (['rectangle', 'circle', 'text'].includes(activeTool)) {
      spawnShape(activeTool, canvasPt);
      return;
    }

    const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));
    const hitElement = hitTestPoint(canvasPt, sceneGraph);

    if (hitElement) {
      const isDeepSelect = e.metaKey || e.ctrlKey;
      const targetElement = getTopLevelSelectableElement(hitElement, sceneGraphMap, isDeepSelect);

      const isAlreadySelected = selectedIds.includes(targetElement.id);
      let newSelectedIds = selectedIds;

      if (e.shiftKey) {
        if (isAlreadySelected) {
          newSelectedIds = selectedIds.filter(id => id !== targetElement.id);
        } else {
          newSelectedIds = [...selectedIds, targetElement.id];
        }
      } else {
        if (!isAlreadySelected) {
          newSelectedIds = [targetElement.id];
        }
      }

      setSelectedIds(newSelectedIds);
      setInteractionMode('drag');
      setDragStartPoint(canvasPt);

      // Model A: Drag top-level selected elements only; children move via SVG parent transform
      activeDragIdsRef.current = new Set(newSelectedIds);

      const targets = sceneGraph.filter(el => newSelectedIds.includes(el.id));
      initialDragStateRef.current = targets.map(el => ({ ...el }));
    } else {
      if (!e.shiftKey) {
        setSelectedIds([]);
      }
      setInteractionMode('marquee');
      setDragStartPoint(canvasPt);
      setMarqueeBox({ x: canvasPt.x, y: canvasPt.y, width: 0, height: 0 });
    }
  }, [activeTool, viewport, sceneGraph, selectedIds, setSelectedIds, setContextMenuPos, spawnShape]);

  const handlePointerMove = useCallback((e) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    setCursorCanvasPos(canvasPt);

    if (!interactionMode) return;

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

    if (interactionMode === 'drag') {
      const dx = canvasPt.x - dragStartPoint.x;
      const dy = canvasPt.y - dragStartPoint.y;

      const initialTargets = initialDragStateRef.current;
      if (initialTargets.length === 0) return;

      const primaryTarget = initialTargets[0];
      const candidateBox = {
        x: primaryTarget.x + dx,
        y: primaryTarget.y + dy,
        width: primaryTarget.width,
        height: primaryTarget.height,
      };

      const otherElements = sceneGraph.filter(el => !activeDragIdsRef.current.has(el.id));
      const snapResult = calculateSnapping(candidateBox, otherElements, gridEnabled);
      setAlignmentGuides(snapResult.guides);

      const finalDx = snapResult.x - primaryTarget.x;
      const finalDy = snapResult.y - primaryTarget.y;

      // Model A: Move top-level selected elements
      setSceneGraph(prev =>
        prev.map(el => {
          if (activeDragIdsRef.current.has(el.id)) {
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

    if (interactionMode === 'resize' && activeHandle) {
      const dx = canvasPt.x - dragStartPoint.x;
      const dy = canvasPt.y - dragStartPoint.y;
      const initialBBox = initialBBoxRef.current;
      if (!initialBBox) return;

      const resizedBBox = calculateResize({
        element: initialBBox,
        handle: activeHandle,
        dx,
        dy,
        keepAspectRatio: e.shiftKey,
      });

      const scaleX = resizedBBox.width / (initialBBox.width || 1);
      const scaleY = resizedBBox.height / (initialBBox.height || 1);

      setSceneGraph(prev =>
        prev.map(el => {
          if (activeDragIdsRef.current.has(el.id)) {
            const initial = initialDragStateRef.current.find(it => it.id === el.id);
            if (initial) {
              const relX = initial.x - initialBBox.x;
              const relY = initial.y - initialBBox.y;
              return {
                ...el,
                x: resizedBBox.x + relX * scaleX,
                y: resizedBBox.y + relY * scaleY,
                width: Math.max(5, initial.width * scaleX),
                height: Math.max(5, initial.height * scaleY),
              };
            }
          }
          return el;
        })
      );
      return;
    }

    if (interactionMode === 'rotate') {
      const center = initialRotationStateRef.current.center;
      const rotationDelta = calculateRotationDelta({
        elementCenter: center,
        currentPointerPos: canvasPt,
        initialPointerAngle: initialRotationStateRef.current.initialPointerAngle,
        initialElementRotation: 0,
        snapShift: e.shiftKey,
      });

      setSceneGraph(prev =>
        prev.map(el => {
          if (activeDragIdsRef.current.has(el.id)) {
            const initial = initialDragStateRef.current.find(it => it.id === el.id);
            if (initial) {
              const elementCenter = {
                x: initial.x + initial.width / 2,
                y: initial.y + initial.height / 2,
              };
              const rotatedCenter = rotatePoint(elementCenter.x, elementCenter.y, center.x, center.y, rotationDelta);
              return {
                ...el,
                x: rotatedCenter.x - initial.width / 2,
                y: rotatedCenter.y - initial.height / 2,
                rotation: ((initial.rotation || 0) + rotationDelta) % 360,
              };
            }
          }
          return el;
        })
      );
    }
  }, [interactionMode, dragStartPoint, viewport, setViewport, sceneGraph, setSceneGraph, selectedIds, setSelectedIds, activeHandle, gridEnabled]);

  const handlePointerUp = useCallback(() => {
    if (interactionMode === 'drag' || interactionMode === 'resize' || interactionMode === 'rotate') {
      const oldStates = initialDragStateRef.current;
      const targetIds = activeDragIdsRef.current.size > 0 ? activeDragIdsRef.current : new Set(selectedIds);
      const newStates = sceneGraph.filter(el => targetIds.has(el.id));

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
    activeDragIdsRef.current = new Set();
    initialBBoxRef.current = null;
    initialRotationStateRef.current = { initialPointerAngle: 0, initialElementRotation: 0, center: { x: 0, y: 0 } };
  }, [interactionMode, sceneGraph, selectedIds, historyManagerRef, triggerHistoryUpdate]);

  const handleHandlePointerDown = useCallback((e, handleId, selectedElements) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

    const allTargetIds = new Set(selectedElements.map(e => e.id));
    activeDragIdsRef.current = allTargetIds;

    const targets = sceneGraph.filter(el => allTargetIds.has(el.id));
    initialDragStateRef.current = targets.map(el => ({ ...el }));
    initialBBoxRef.current = getMultiSelectionBoundingBox(selectedElements, sceneGraphMap);

    setInteractionMode('resize');
    setActiveHandle(handleId);
    setDragStartPoint(canvasPt);
  }, [viewport, sceneGraph]);

  const handleRotatePointerDown = useCallback((e, selectedElements) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

    const allTargetIds = new Set(selectedElements.map(e => e.id));
    activeDragIdsRef.current = allTargetIds;

    const targets = sceneGraph.filter(el => allTargetIds.has(el.id));
    initialDragStateRef.current = targets.map(el => ({ ...el }));

    const bbox = getMultiSelectionBoundingBox(selectedElements, sceneGraphMap);
    const center = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };

    const initialAngle = calculatePointerAngle(center, canvasPt);
    initialRotationStateRef.current = {
      initialPointerAngle: initialAngle,
      initialElementRotation: 0,
      center,
    };

    setInteractionMode('rotate');
    setDragStartPoint(canvasPt);
  }, [viewport, sceneGraph]);

  return {
    interactionMode,
    marqueeBox,
    alignmentGuides,
    cursorCanvasPos,
    spawnShape,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleHandlePointerDown,
    handleRotatePointerDown,
  };
}
