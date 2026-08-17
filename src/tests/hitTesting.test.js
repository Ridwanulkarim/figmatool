import { describe, it, expect } from 'vitest';
import {
  isPointInRotatedRect,
  isPointInEllipse,
  isElementHit,
  hitTestPoint,
  hitTestRectangle,
} from '../utils/hitTesting.js';

describe('Hit Testing Engine', () => {
  it('detects point hits inside unrotated rectangles', () => {
    const rect = { id: 'r1', type: 'rectangle', x: 50, y: 50, width: 100, height: 100, rotation: 0 };
    expect(isPointInRotatedRect({ x: 75, y: 75 }, rect)).toBe(true);
    expect(isPointInRotatedRect({ x: 10, y: 10 }, rect)).toBe(false);
  });

  it('detects point hits inside rotated rectangles', () => {
    const rect = { id: 'r1', type: 'rectangle', x: 100, y: 100, width: 100, height: 50, rotation: 45 };
    const centerPoint = { x: 150, y: 125 };
    expect(isPointInRotatedRect(centerPoint, rect)).toBe(true);
  });

  it('detects point hits inside ellipse/circles', () => {
    const circle = { id: 'c1', type: 'circle', x: 100, y: 100, width: 100, height: 100, rotation: 0 };
    expect(isPointInEllipse({ x: 150, y: 150 }, circle)).toBe(true); // Center
    expect(isPointInEllipse({ x: 100, y: 100 }, circle)).toBe(false); // Corner outside circle boundary
  });

  it('respects locked and hidden states during hit testing', () => {
    const hiddenEl = { id: 'h1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, hidden: true };
    const lockedEl = { id: 'l1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, locked: true };

    expect(isElementHit({ x: 50, y: 50 }, hiddenEl)).toBe(false);
    expect(isElementHit({ x: 50, y: 50 }, lockedEl)).toBe(false);
  });

  it('selects highest z-index element on overlapping hits', () => {
    const sceneGraph = [
      { id: 'bottom', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
      { id: 'top', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
    ];

    const hit = hitTestPoint({ x: 50, y: 50 }, sceneGraph);
    expect(hit.id).toBe('top');
  });

  it('detects marquee box intersections with elements', () => {
    const sceneGraph = [
      { id: 'inside', type: 'rectangle', x: 50, y: 50, width: 50, height: 50 },
      { id: 'outside', type: 'rectangle', x: 300, y: 300, width: 50, height: 50 },
    ];

    const marquee = { x: 0, y: 0, width: 150, height: 150 };
    const matched = hitTestRectangle(marquee, sceneGraph);
    expect(matched).toEqual(['inside']);
  });
});
