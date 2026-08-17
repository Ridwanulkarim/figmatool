/**
 * Grid & Object Snapping Utilities
 * Calculates position snapping and generates dynamic alignment guides for UI feedback.
 */

export const DEFAULT_GRID_SIZE = 10;
export const SNAP_THRESHOLD = 5;

/**
 * Snap single coordinate value to grid interval
 */
export function snapToGrid(value, gridSize = DEFAULT_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Perform Object Edge & Center Snapping against other canvas elements
 * @param {Object} draggedBox - { x, y, width, height }
 * @param {Array} otherElements - List of scene graph elements not in current selection
 * @param {Boolean} enableGrid - Whether grid snapping is active
 * @param {Number} gridSize - Grid interval
 * @returns {Object} { x, y, guides }
 */
export function calculateSnapping(draggedBox, otherElements = [], enableGrid = false, gridSize = DEFAULT_GRID_SIZE) {
  let snappedX = draggedBox.x;
  let snappedY = draggedBox.y;
  const guides = [];

  // 1. Grid Snapping if enabled
  if (enableGrid) {
    snappedX = snapToGrid(draggedBox.x, gridSize);
    snappedY = snapToGrid(draggedBox.y, gridSize);
  }

  if (!otherElements || otherElements.length === 0) {
    return { x: snappedX, y: snappedY, guides };
  }

  // Edges for dragged box
  const dLeft = snappedX;
  const dCenterX = snappedX + draggedBox.width / 2;
  const dRight = snappedX + draggedBox.width;

  const dTop = snappedY;
  const dCenterY = snappedY + draggedBox.height / 2;
  const dBottom = snappedY + draggedBox.height;

  let deltaX = Infinity;
  let deltaY = Infinity;

  // Find closest vertical line match (X axis)
  for (const el of otherElements) {
    if (el.hidden || el.locked) continue;

    const eLeft = el.x;
    const eCenterX = el.x + el.width / 2;
    const eRight = el.x + el.width;

    const targetsX = [
      { val: eLeft, align: 'left' },
      { val: eCenterX, align: 'center' },
      { val: eRight, align: 'right' },
    ];

    const sourcesX = [
      { val: dLeft, offset: 0 },
      { val: dCenterX, offset: draggedBox.width / 2 },
      { val: dRight, offset: draggedBox.width },
    ];

    for (const src of sourcesX) {
      for (const tgt of targetsX) {
        const diff = tgt.val - src.val;
        if (Math.abs(diff) < Math.abs(deltaX) && Math.abs(diff) <= SNAP_THRESHOLD) {
          deltaX = diff;
          guides.push({
            id: `v-${el.id}-${tgt.align}`,
            type: 'vertical',
            x: tgt.val,
            startY: Math.min(dTop, el.y) - 10,
            endY: Math.max(dBottom, el.y + el.height) + 10,
          });
        }
      }
    }
  }

  // Find closest horizontal line match (Y axis)
  for (const el of otherElements) {
    if (el.hidden || el.locked) continue;

    const eTop = el.y;
    const eCenterY = el.y + el.height / 2;
    const eBottom = el.y + el.height;

    const targetsY = [
      { val: eTop, align: 'top' },
      { val: eCenterY, align: 'middle' },
      { val: eBottom, align: 'bottom' },
    ];

    const sourcesY = [
      { val: dTop, offset: 0 },
      { val: dCenterY, offset: draggedBox.height / 2 },
      { val: dBottom, offset: draggedBox.height },
    ];

    for (const src of sourcesY) {
      for (const tgt of targetsY) {
        const diff = tgt.val - src.val;
        if (Math.abs(diff) < Math.abs(deltaY) && Math.abs(diff) <= SNAP_THRESHOLD) {
          deltaY = diff;
          guides.push({
            id: `h-${el.id}-${tgt.align}`,
            type: 'horizontal',
            y: tgt.val,
            startX: Math.min(dLeft, el.x) - 10,
            endX: Math.max(dRight, el.x + el.width) + 10,
          });
        }
      }
    }
  }

  if (Math.abs(deltaX) <= SNAP_THRESHOLD) {
    snappedX += deltaX;
  }
  if (Math.abs(deltaY) <= SNAP_THRESHOLD) {
    snappedY += deltaY;
  }

  // Filter relevant guides matching snapped position
  const activeGuides = guides.filter(g => {
    if (g.type === 'vertical') return Math.abs(g.x - (snappedX + (g.x - dLeft))) <= SNAP_THRESHOLD || Math.abs(g.x - snappedX) <= SNAP_THRESHOLD || Math.abs(g.x - (snappedX + draggedBox.width)) <= SNAP_THRESHOLD || Math.abs(g.x - (snappedX + draggedBox.width / 2)) <= SNAP_THRESHOLD;
    if (g.type === 'horizontal') return Math.abs(g.y - (snappedY + (g.y - dTop))) <= SNAP_THRESHOLD || Math.abs(g.y - snappedY) <= SNAP_THRESHOLD || Math.abs(g.y - (snappedY + draggedBox.height)) <= SNAP_THRESHOLD || Math.abs(g.y - (snappedY + draggedBox.height / 2)) <= SNAP_THRESHOLD;
    return false;
  });

  return {
    x: snappedX,
    y: snappedY,
    guides: activeGuides.slice(0, 4), // Limit active guide lines overlay for clean UI
  };
}
