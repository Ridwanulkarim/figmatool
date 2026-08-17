import { useState, useCallback } from 'react';
import { AddElementsCommand } from '../utils/commands.js';

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
    triggerUpdate();
  }, [clipboard, sceneGraph, setSelectedIds, setSceneGraph, historyManagerRef, triggerUpdate]);

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
