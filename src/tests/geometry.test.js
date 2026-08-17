import { describe, it, expect } from 'vitest';
import {
  rotatePoint,
  getBoundingBox,
  getMultiSelectionBoundingBox,
  normalizeGeometry,
  calculateResize,
  calculateRotation,
} from '../utils/geometry.js';
import { isPointInRotatedRect, isPointInEllipse, hitTestRectangle } from '../utils/hitTesting.js';
import { screenToCanvas, canvasToScreen } from '../utils/coordinates.js';
import { snapToGrid, calculateSnapping } from '../utils/snapping.js';

describe('Geometry & Math Utilities', () => {
  it('rotates a point around origin correctly', () => {
    const point = { x: 10, y: 0 };
    const center = { x: 0, y: 0 };
    const rotated = rotatePoint(point.x, point.y, center.x, center.y, 90);
    expect(Math.round(rotated.x)).toBe(0);
    expect(Math.round(rotated.y)).toBe(10);
  });

  it('normalizes negative width and height correctly', () => {
    const rect = { x: 100, y: 100, width: -50, height: -30 };
    const normalized = normalizeGeometry(rect);
    expect(normalized.x).toBe(50);
    expect(normalized.y).toBe(70);
    expect(normalized.width).toBe(50);
    expect(normalized.height).toBe(30);
  });

  it('calculates bounding box for multiple elements', () => {
    const el1 = { x: 10, y: 10, width: 20, height: 20 };
    const el2 = { x: 50, y: 40, width: 30, height: 30 };
    const multiBox = getMultiSelectionBoundingBox([el1, el2]);
    expect(multiBox).toEqual({
      x: 10,
      y: 10,
      width: 70,
      height: 60,
    });
  });

  it('correctly calculates rotated rectangle hit testing', () => {
    const rect = { x: 100, y: 100, width: 100, height: 50, rotation: 45 };
    // Center is (150, 125)
    const centerPoint = { x: 150, y: 125 };
    expect(isPointInRotatedRect(centerPoint, rect)).toBe(true);

    const farPoint = { x: 0, y: 0 };
    expect(isPointInRotatedRect(farPoint, rect)).toBe(false);
  });

  it('converts screen to canvas coordinates with pan and zoom', () => {
    const viewport = { panX: 50, panY: 100, zoom: 2 };
    const bounds = { left: 10, top: 20 };
    const screenPt = { x: 110, y: 220 }; // Relative screen = (100, 200)

    const canvasPt = screenToCanvas(screenPt, viewport, bounds);
    // (100 - 50)/2 = 25, (200 - 100)/2 = 50
    expect(canvasPt.x).toBe(25);
    expect(canvasPt.y).toBe(50);

    const backToScreen = canvasToScreen(canvasPt, viewport, bounds);
    expect(backToScreen.x).toBe(110);
    expect(backToScreen.y).toBe(220);
  });

  it('snaps values to grid intervals', () => {
    expect(snapToGrid(24, 10)).toBe(20);
    expect(snapToGrid(26, 10)).toBe(30);
  });

  it('detects object alignment guides during snapping', () => {
    const dragged = { x: 98, y: 100, width: 50, height: 50 };
    const other = [{ id: 'el-1', x: 150, y: 100, width: 50, height: 50 }]; // Left edge of el-1 is 150, right edge of dragged is 148 (diff = 2)

    const result = calculateSnapping(dragged, other, false);
    expect(result.x).toBe(100); // Snapped so right edge (100+50) matches 150
    expect(result.guides.length).toBeGreaterThan(0);
  });
});
