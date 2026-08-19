import { useState, useCallback } from 'react';
import { AddElementsCommand } from '../utils/commands.js';

/**
 * Recursive Deep Clone Helper for Group Copy & Paste (Model A Local Coordinates)
 * Generates unique IDs, remaps children arrays and parentId links, and offsets top-level elements.
 */
export function deepCloneElements(elementsToClone, sceneGraph, offset = 20) {
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));
  const idMap = new Map(); // Old ID -> New ID

  // 1. Collect all elements to clone (including descendant children of groups)
  const allElements = [];
  const collectDescendants = (el) => {
    if (!allElements.some(e => e.id === el.id)) {
      allElements.push(el);
    }
    if (el.type === 'group' && el.children) {
      el.children.forEach(childId => {
        const child = sceneGraphMap.get(childId);
        if (child) collectDescendants(child);
      });
    }
  };

  elementsToClone.forEach(el => collectDescendants(el));

  // 2. Pre-generate new IDs for all elements
  allElements.forEach(el => {
    idMap.set(el.id, `${el.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  });

  const clonedIdSet = new Set(allElements.map(e => e.id));

  // 3. Construct cloned elements with remapped IDs, parentId links, and position offsets
  const clonedElements = allElements.map(el => {
    const newId = idMap.get(el.id);
    const hasClonedParent = el.parentId && clonedIdSet.has(el.parentId);
    const newParentId = hasClonedParent ? idMap.get(el.parentId) : el.parentId;
    const newName = `${el.name || el.type} (Copy)`;

    // Model A: Only offset top-level cloned elements. Children retain local (x, y) relative to parent!
    const isTopLevelInClone = !hasClonedParent;
    const posX = isTopLevelInClone ? el.x + offset : el.x;
    const posY = isTopLevelInClone ? el.y + offset : el.y;

    const cloned = {
      ...el,
      id: newId,
      name: newName,
      parentId: newParentId,
      x: posX,
      y: posY,
    };

    if (el.type === 'group' && el.children) {
      cloned.children = el.children
        .map(childId => idMap.get(childId))
        .filter(Boolean);
    }

    return cloned;
  });

  return {
    clonedElements,
    // Top-level IDs of the pasted selection
    topLevelPastedIds: elementsToClone.map(el => idMap.get(el.id)).filter(Boolean),
  };
}

/**
 * Custom Hook for Copy, Paste, and Duplicate Operations
 */
export function useClipboard(sceneGraph, selectedIds, setSelectedIds, historyManagerRef, setSceneGraph, triggerUpdate) {
  const [clipboard, setClipboard] = useState([]);

  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;
    const copied = sceneGraph.filter(el => selectedIds.includes(el.id));
    setClipboard(copied);
  }, [selectedIds, sceneGraph]);

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return;
    const { clonedElements, topLevelPastedIds } = deepCloneElements(clipboard, sceneGraph, 20);

    const command = new AddElementsCommand(clonedElements);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds(topLevelPastedIds);
    triggerUpdate();
  }, [clipboard, sceneGraph, setSelectedIds, setSceneGraph, historyManagerRef, triggerUpdate]);

  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    const targets = sceneGraph.filter(el => selectedIds.includes(el.id));
    const { clonedElements, topLevelPastedIds } = deepCloneElements(targets, sceneGraph, 20);

    const command = new AddElementsCommand(clonedElements);
    const nextGraph = command.execute(sceneGraph);
    historyManagerRef.current.push(command);
    setSceneGraph(nextGraph);
    setSelectedIds(topLevelPastedIds);
    triggerUpdate();
  }, [selectedIds, sceneGraph, setSelectedIds, setSceneGraph, historyManagerRef, triggerUpdate]);

  return {
    clipboard,
    handleCopy,
    handlePaste,
    handleDuplicate,
    hasClipboard: clipboard.length > 0,
  };
}
