import { useState, useRef, useCallback } from 'react';
import { screenToCanvas } from '../utils/coordinates.js';
import { hitTestPoint, hitTestRectangle } from '../utils/hitTesting.js';
import { calculateResize, calculatePointerAngle, calculateRotationDelta } from '../utils/geometry.js';
import { calculateSnapping } from '../utils/snapping.js';
import { TransformElementsCommand, AddElementsCommand } from '../utils/commands.js';

/**
 * Helper to recursively gather all selected IDs and all descendant child IDs
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
  const initialRotationStateRef = useRef({ initialPointerAngle: 0, initialElementRotation: 0 });
  const activeDragIdsRef = useRef(new Set());

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

      // Collect all selected IDs AND all descendant child IDs recursively!
      const allTargetIds = collectAllSelectedAndDescendantIds(newSelectedIds, sceneGraph);
      activeDragIdsRef.current = allTargetIds;

      const targets = sceneGraph.filter(el => allTargetIds.has(el.id));
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

      // Update positions of both group objects AND all descendant children
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

    if (interactionMode === 'rotate') {
      const target = initialDragStateRef.current[0];
      if (!target) return;

      const center = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
      };

      const rotation = calculateRotationDelta({
        elementCenter: center,
        currentPointerPos: canvasPt,
        initialPointerAngle: initialRotationStateRef.current.initialPointerAngle,
        initialElementRotation: initialRotationStateRef.current.initialElementRotation,
        snapShift: e.shiftKey,
      });

      setSceneGraph(prev =>
        prev.map(el => (el.id === target.id ? { ...el, rotation } : el))
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
    initialRotationStateRef.current = { initialPointerAngle: 0, initialElementRotation: 0 };
  }, [interactionMode, sceneGraph, selectedIds, historyManagerRef, triggerHistoryUpdate]);

  const handleHandlePointerDown = useCallback((e, handleId, selectedElements) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    setInteractionMode('resize');
    setActiveHandle(handleId);
    setDragStartPoint(canvasPt);
    initialDragStateRef.current = selectedElements.map(el => ({ ...el }));
  }, [viewport]);

  const handleRotatePointerDown = useCallback((e, selectedElements) => {
    const canvasBounds = e.currentTarget.getBoundingClientRect();
    const canvasPt = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, canvasBounds);
    setInteractionMode('rotate');
    setDragStartPoint(canvasPt);

    const target = selectedElements[0];
    if (target) {
      const center = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
      };
      const initialAngle = calculatePointerAngle(center, canvasPt);
      initialRotationStateRef.current = {
        initialPointerAngle: initialAngle,
        initialElementRotation: target.rotation || 0,
      };
    }
    initialDragStateRef.current = selectedElements.map(el => ({ ...el }));
  }, [viewport]);

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
