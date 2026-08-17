/**
 * Hit Testing Utilities
 * Determines element selection from point clicks or marquee dragging.
 */

import { rotatePoint, getBoundingBox, getTransformedCorners } from './geometry.js';

/**
 * Test if point (x, y) is inside a rotated rectangle
 */
export function isPointInRotatedRect(point, element) {
  const { x, y, width, height, rotation = 0 } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Rotate point backwards by -rotation around element center
  const unrotated = rotatePoint(point.x, point.y, cx, cy, -rotation);

  return (
    unrotated.x >= x &&
    unrotated.x <= x + width &&
    unrotated.y >= y &&
    unrotated.y <= y + height
  );
}

/**
 * Test if point (x, y) is inside an ellipse/circle
 */
export function isPointInEllipse(point, element) {
  const { x, y, width, height, rotation = 0 } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const unrotated = rotatePoint(point.x, point.y, cx, cy, -rotation);
  const rx = width / 2;
  const ry = height / 2;

  if (rx === 0 || ry === 0) return false;

  const dx = unrotated.x - cx;
  const dy = unrotated.y - cy;

  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

/**
 * Check if a single element is hit by point (x, y)
 */
export function isElementHit(point, element, sceneGraphMap = new Map()) {
  if (!element || element.hidden || element.locked) return false;

  if (element.type === 'rectangle' || element.type === 'text') {
    return isPointInRotatedRect(point, element);
  }

  if (element.type === 'circle') {
    return isPointInEllipse(point, element);
  }

  if (element.type === 'group') {
    if (!element.children || element.children.length === 0) {
      return isPointInRotatedRect(point, getBoundingBox(element, sceneGraphMap));
    }
    // Check if any child in group is hit
    return element.children.some(childId => {
      const child = sceneGraphMap.get(childId);
      return child && isElementHit(point, child, sceneGraphMap);
    });
  }

  return isPointInRotatedRect(point, element);
}

/**
 * Find highest z-index element at point (x, y)
 * Iterates sceneGraph from top (last item) to bottom (first item)
 */
export function hitTestPoint(point, sceneGraph) {
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

  // Traverse top-to-bottom (reverse of render order)
  for (let i = sceneGraph.length - 1; i >= 0; i--) {
    const el = sceneGraph[i];
    if (isElementHit(point, el, sceneGraphMap)) {
      return el;
    }
  }

  return null;
}

/**
 * Test if two axis-aligned rectangles overlap
 */
export function rectsOverlap(r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Perform marquee selection box hit test against scene graph
 * Returns array of matching element IDs
 */
export function hitTestRectangle(marqueeBox, sceneGraph) {
  if (marqueeBox.width <= 2 && marqueeBox.height <= 2) return [];

  const matchedIds = [];
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

  for (const el of sceneGraph) {
    if (el.hidden || el.locked) continue;

    if (el.rotation) {
      // Check if any rotated corner is inside marquee OR element bounding box overlaps marquee
      const corners = getTransformedCorners(el);
      const isAnyCornerInside = corners.some(
        c =>
          c.x >= marqueeBox.x &&
          c.x <= marqueeBox.x + marqueeBox.width &&
          c.y >= marqueeBox.y &&
          c.y <= marqueeBox.y + marqueeBox.height
      );

      if (isAnyCornerInside) {
        matchedIds.push(el.id);
        continue;
      }
    }

    const box = getBoundingBox(el, sceneGraphMap);
    if (rectsOverlap(marqueeBox, box)) {
      matchedIds.push(el.id);
    }
  }

  return matchedIds;
}
