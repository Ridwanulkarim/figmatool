/**
 * Coordinate Conversion Utilities
 * Converts between Screen (DOM pointer) coordinates and Canvas SVG scene space coordinates.
 */

/**
 * Convert DOM screen coordinates (e.g. e.clientX, e.clientY) to SVG canvas coordinates
 * @param {Object} screenPoint - { x: clientX, y: clientY }
 * @param {Object} viewport - { panX, panY, zoom }
 * @param {DOMRect} canvasBounds - Bounding client rect of SVG element container
 */
export function screenToCanvas(screenPoint, viewport, canvasBounds) {
  const { panX = 0, panY = 0, zoom = 1 } = viewport;
  const offsetX = canvasBounds ? canvasBounds.left : 0;
  const offsetY = canvasBounds ? canvasBounds.top : 0;

  // Subtract element offset to get relative screen position in container
  const relativeX = screenPoint.x - offsetX;
  const relativeY = screenPoint.y - offsetY;

  // Apply inverse pan and zoom
  const canvasX = (relativeX - panX) / zoom;
  const canvasY = (relativeY - panY) / zoom;

  return { x: canvasX, y: canvasY };
}

/**
 * Convert SVG canvas space point to screen pixel coordinates
 */
export function canvasToScreen(canvasPoint, viewport, canvasBounds) {
  const { panX = 0, panY = 0, zoom = 1 } = viewport;
  const offsetX = canvasBounds ? canvasBounds.left : 0;
  const offsetY = canvasBounds ? canvasBounds.top : 0;

  const screenX = canvasPoint.x * zoom + panX + offsetX;
  const screenY = canvasPoint.y * zoom + panY + offsetY;

  return { x: screenX, y: screenY };
}
