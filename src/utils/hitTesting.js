/**
 * Hit Testing Utilities
 * Determines element selection from point clicks or marquee dragging using SAT (Separating Axis Theorem).
 */

import { rotatePoint, getBoundingBox, getTransformedCorners } from './geometry.js';

/**
 * Test if point (x, y) is inside a rotated rectangle
 */
export function isPointInRotatedRect(point, element) {
  const { x, y, width, height, rotation = 0 } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

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
    return element.children.some(childId => {
      const child = sceneGraphMap.get(childId);
      return child && isElementHit(point, child, sceneGraphMap);
    });
  }

  return isPointInRotatedRect(point, element);
}

/**
 * Find highest z-index element at point (x, y)
 */
export function hitTestPoint(point, sceneGraph) {
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

  for (let i = sceneGraph.length - 1; i >= 0; i--) {
    const el = sceneGraph[i];
    if (isElementHit(point, el, sceneGraphMap)) {
      return el;
    }
  }

  return null;
}

/**
 * Separating Axis Theorem (SAT) Polygon Intersection
 * Tests if convex polygon quad1 intersects quad2
 */
function isPolygonIntersecting(poly1, poly2) {
  const polygons = [poly1, poly2];
  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

      let minA = Infinity, maxA = -Infinity;
      for (const p of poly1) {
        const projected = normal.x * p.x + normal.y * p.y;
        minA = Math.min(minA, projected);
        maxA = Math.max(maxA, projected);
      }

      let minB = Infinity, maxB = -Infinity;
      for (const p of poly2) {
        const projected = normal.x * p.x + normal.y * p.y;
        minB = Math.min(minB, projected);
        maxB = Math.max(maxB, projected);
      }

      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
}

/**
 * Test if axis-aligned marquee rectangle intersects an element
 */
export function hitTestRectangle(marqueeBox, sceneGraph) {
  if (marqueeBox.width <= 2 && marqueeBox.height <= 2) return [];

  const matchedIds = [];
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));

  const marqueePoly = [
    { x: marqueeBox.x, y: marqueeBox.y },
    { x: marqueeBox.x + marqueeBox.width, y: marqueeBox.y },
    { x: marqueeBox.x + marqueeBox.width, y: marqueeBox.y + marqueeBox.height },
    { x: marqueeBox.x, y: marqueeBox.y + marqueeBox.height },
  ];

  for (const el of sceneGraph) {
    if (el.hidden || el.locked) continue;

    const corners = getTransformedCorners(el);
    if (isPolygonIntersecting(marqueePoly, corners)) {
      matchedIds.push(el.id);
    }
  }

  return matchedIds;
}
