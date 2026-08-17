import { useState, useMemo, useCallback } from 'react';

/**
 * Custom Hook for Layer & Element Selection State Management
 */
export function useSelection(sceneGraph) {
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedElements = useMemo(() => {
    const idSet = new Set(selectedIds);
    return sceneGraph.filter(el => idSet.has(el.id));
  }, [sceneGraph, selectedIds]);

  const selectLayer = useCallback((id, isShift = false) => {
    if (isShift) {
      setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    selectedElements,
    selectLayer,
    clearSelection,
  };
}
