import { useRef, useState, useCallback } from 'react';
import { HistoryManager } from '../utils/commands.js';

/**
 * Custom Hook integrating Command-Based Undo / Redo Manager
 */
export function useHistory(sceneGraph, setSceneGraph) {
  const historyManagerRef = useRef(new HistoryManager(50));
  const [, forceUpdate] = useState({});

  const triggerHistoryUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const handleUndo = useCallback(() => {
    const nextGraph = historyManagerRef.current.undo(sceneGraph);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  }, [sceneGraph, setSceneGraph, triggerHistoryUpdate]);

  const handleRedo = useCallback(() => {
    const nextGraph = historyManagerRef.current.redo(sceneGraph);
    setSceneGraph(nextGraph);
    triggerHistoryUpdate();
  }, [sceneGraph, setSceneGraph, triggerHistoryUpdate]);

  const clearHistory = useCallback(() => {
    historyManagerRef.current.clear();
    triggerHistoryUpdate();
  }, [triggerHistoryUpdate]);

  return {
    historyManagerRef,
    canUndo: historyManagerRef.current.canUndo(),
    canRedo: historyManagerRef.current.canRedo(),
    handleUndo,
    handleRedo,
    clearHistory,
    triggerHistoryUpdate,
  };
}
