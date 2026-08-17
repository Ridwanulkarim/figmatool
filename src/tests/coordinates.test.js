import { describe, it, expect } from 'vitest';
import { screenToCanvas, canvasToScreen } from '../utils/coordinates.js';

describe('Coordinate Transformation Engine', () => {
  it('converts screen pointer coordinates to canvas space under pan and zoom', () => {
    const viewport = { panX: 100, panY: 50, zoom: 2 };
    const bounds = { left: 0, top: 0 };
    const screenPoint = { x: 200, y: 150 };

    const canvasPoint = screenToCanvas(screenPoint, viewport, bounds);
    // (200 - 100)/2 = 50, (150 - 50)/2 = 50
    expect(canvasPoint).toEqual({ x: 50, y: 50 });
  });

  it('converts canvas coordinates back to screen pixels', () => {
    const viewport = { panX: 100, panY: 50, zoom: 2 };
    const bounds = { left: 10, top: 20 };
    const canvasPoint = { x: 50, y: 50 };

    const screenPoint = canvasToScreen(canvasPoint, viewport, bounds);
    // 50*2 + 100 + 10 = 210, 50*2 + 50 + 20 = 170
    expect(screenPoint).toEqual({ x: 210, y: 170 });
  });
});
