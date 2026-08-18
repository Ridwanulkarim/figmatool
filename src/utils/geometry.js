/**
 * Geometry and Math Utility Functions for Vector Engine
 * Pure JS, decoupled from React rendering.
 * Implements World Space Transformation Matrices and Figma Selection Policy.
 */

export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Rotate point (x, y) around center point (cx, cy) by angle in degrees
 */
export function rotatePoint(x, y, cx, cy, angleDeg) {
  if (!angleDeg) return { x, y };
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const nx = cos * (x - cx) - sin * (y - cy) + cx;
  const ny = sin * (x - cx) + cos * (y - cy) + cy;
  return { x: nx, y: ny };
}

/**
 * Traverses parentId links to return array of ancestor groups from root down to immediate parent
 */
export function getAncestorGroups(element, sceneGraphMap = new Map()) {
  const ancestors = [];
  let current = element;

  while (current && current.parentId) {
    const parent = sceneGraphMap.get(current.parentId);
    if (parent && !ancestors.some(a => a.id === parent.id)) {
      ancestors.unshift(parent); // Prepend so root group comes first
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Traverses up parentId links to find the top-most root parent group
 * If deepSelect is true (Cmd/Ctrl + Click), returns the immediate element directly.
 */
export function getTopLevelSelectableElement(element, sceneGraphMap = new Map(), deepSelect = false) {
  if (!element || deepSelect) return element;

  let current = element;
  while (current && current.parentId) {
    const parent = sceneGraphMap.get(current.parentId);
    if (parent) {
      current = parent;
    } else {
      break;
    }
  }

  return current;
}

/**
 * Transform a world canvas point into an element's local coordinate space by un-rotating through ancestor group matrices
 */
export function transformPointToLocalSpace(point, element, sceneGraphMap = new Map()) {
  const ancestors = getAncestorGroups(element, sceneGraphMap);
  let localPt = { ...point };

  for (const parentGroup of ancestors) {
    if (parentGroup.rotation) {
      const cx = parentGroup.x + parentGroup.width / 2;
      const cy = parentGroup.y + parentGroup.height / 2;
      localPt = rotatePoint(localPt.x, localPt.y, cx, cy, -parentGroup.rotation);
    }
  }

  return localPt;
}

/**
 * Get 4 corner points of an element in local space
 */
export function getLocalCorners(element) {
  const { x, y, width, height, rotation = 0 } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];

  if (!rotation) return corners;
  return corners.map(c => rotatePoint(c.x, c.y, cx, cy, rotation));
}

/**
 * Get 4 corner points of an element in World Canvas space accounting for all ancestor group transforms
 */
export function getWorldTransformedCorners(element, sceneGraphMap = new Map()) {
  let corners = getLocalCorners(element);
  const ancestors = getAncestorGroups(element, sceneGraphMap);

  for (let i = ancestors.length - 1; i >= 0; i--) {
    const parentGroup = ancestors[i];
    if (parentGroup.rotation) {
      const cx = parentGroup.x + parentGroup.width / 2;
      const cy = parentGroup.y + parentGroup.height / 2;
      corners = corners.map(c => rotatePoint(c.x, c.y, cx, cy, parentGroup.rotation));
    }
  }

  return corners;
}

export function getTransformedCorners(element) {
  return getLocalCorners(element);
}

/**
 * Get axis-aligned bounding box (AABB) for a single element or group
 * Consistently uses World Transformed Quad Corners for all group children!
 */
export function getBoundingBox(element, sceneGraphMap = new Map()) {
  if (!element) return { x: 0, y: 0, width: 0, height: 0 };

  if (element.type === 'group' && element.children) {
    const children = element.children
      .map(childId => sceneGraphMap.get(childId))
      .filter(Boolean);

    if (children.length === 0) {
      return { x: element.x || 0, y: element.y || 0, width: element.width || 0, height: element.height || 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const child of children) {
      // Consistently use World Space Quad Corners for every child and nested child group!
      const corners = getWorldTransformedCorners(child, sceneGraphMap);
      for (const c of corners) {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        maxX = Math.max(maxX, c.x);
        maxY = Math.max(maxY, c.y);
      }
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

/**
 * Compute union bounding box for multiple elements
 */
export function getMultiSelectionBoundingBox(elements, sceneGraphMap = new Map()) {
  if (!elements || elements.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const el of elements) {
    const box = getBoundingBox(el, sceneGraphMap);
    if (!el.rotation) {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    } else {
      const corners = getWorldTransformedCorners(el, sceneGraphMap);
      for (const c of corners) {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        maxX = Math.max(maxX, c.x);
        maxY = Math.max(maxY, c.y);
      }
    }
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Normalizes element geometry so width & height are always positive.
 */
export function normalizeGeometry({ x, y, width, height }) {
  let newX = x;
  let newY = y;
  let newW = width;
  let newH = height;

  if (newW < 0) {
    newW = Math.abs(newW);
    newX = newX - newW;
  }
  if (newH < 0) {
    newH = Math.abs(newH);
    newY = newY - newH;
  }

  return { x: newX, y: newY, width: Math.max(5, newW), height: Math.max(5, newH) };
}

/**
 * Calculate resized dimensions given active handle, delta dx/dy, aspect ratio, and rotation.
 */
export function calculateResize({ element, handle, dx, dy, keepAspectRatio = false, minSize = 5 }) {
  const rotation = element.rotation || 0;
  
  let localDx = dx;
  let localDy = dy;
  if (rotation) {
    const rad = degToRad(-rotation);
    localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
  }

  let { x, y, width, height } = element;
  const originalAspect = width / (height || 1);

  switch (handle) {
    case 'e':
      width += localDx;
      break;
    case 'w':
      width -= localDx;
      x += localDx;
      break;
    case 's':
      height += localDy;
      break;
    case 'n':
      height -= localDy;
      y += localDy;
      break;
    case 'se':
      width += localDx;
      height += localDy;
      break;
    case 'sw':
      width -= localDx;
      x += localDx;
      height += localDy;
      break;
    case 'ne':
      width += localDx;
      height -= localDy;
      y += localDy;
      break;
    case 'nw':
      width -= localDx;
      x += localDx;
      height -= localDy;
      y += localDy;
      break;
    default:
      break;
  }

  if (keepAspectRatio && originalAspect) {
    if (['e', 'w'].includes(handle)) {
      height = width / originalAspect;
    } else if (['n', 's'].includes(handle)) {
      width = height * originalAspect;
    } else {
      const newAspect = Math.abs(width / (height || 1));
      if (newAspect > originalAspect) {
        height = width / originalAspect;
      } else {
        width = height * originalAspect;
      }
    }
  }

  const normalized = normalizeGeometry({ x, y, width, height });
  normalized.width = Math.max(minSize, normalized.width);
  normalized.height = Math.max(minSize, normalized.height);

  return normalized;
}

/**
 * Calculate absolute pointer angle from element center
 */
export function calculatePointerAngle(elementCenter, pointerCanvasPos) {
  const dx = pointerCanvasPos.x - elementCenter.x;
  const dy = pointerCanvasPos.y - elementCenter.y;
  let angle = radToDeg(Math.atan2(dy, dx)) + 90;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Calculate smooth rotation delta without jumping on initial handle click
 */
export function calculateRotationDelta({
  elementCenter,
  currentPointerPos,
  initialPointerAngle,
  initialElementRotation = 0,
  snapShift = false,
}) {
  const currentAngle = calculatePointerAngle(elementCenter, currentPointerPos);
  let delta = currentAngle - initialPointerAngle;

  let newRotation = initialElementRotation + delta;
  if (newRotation < 0) newRotation += 360;
  newRotation = newRotation % 360;

  if (snapShift) {
    newRotation = Math.round(newRotation / 15) * 15;
  }

  return Math.round(newRotation % 360);
}
