import { describe, it, expect } from 'vitest';
import {
  isPointInRotatedRect,
  isPointInEllipse,
  isElementHit,
  hitTestRectangle,
} from '../utils/hitTesting.js';

describe('Hit Testing Engine with Model A World Transforms', () => {
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

  it('correctly hit tests child elements inside rotated parent groups via World Transforms', () => {
    const group = { id: 'g1', type: 'group', x: 100, y: 100, width: 100, height: 50, rotation: 45, children: ['r1'] };
    // Model A local coordinates: child is at (0, 0) relative to parent group g1 (100, 100)
    const child = { id: 'r1', type: 'rectangle', parentId: 'g1', x: 0, y: 0, width: 100, height: 50, rotation: 0 };
    const sceneGraphMap = new Map([['g1', group], ['r1', child]]);

    const centerPoint = { x: 150, y: 125 }; // World center point
    expect(isElementHit(centerPoint, child, sceneGraphMap)).toBe(true);
  });

  it('detects marquee box intersections for nested rotated group elements in world space', () => {
    const group = { id: 'g1', type: 'group', x: 100, y: 100, width: 100, height: 50, rotation: 45, children: ['r1'] };
    const child = { id: 'r1', type: 'rectangle', parentId: 'g1', x: 0, y: 0, width: 100, height: 50, rotation: 0 };
    const sceneGraph = [group, child];

    const marquee = { x: 140, y: 110, width: 30, height: 30 };
    const matched = hitTestRectangle(marquee, sceneGraph);
    expect(matched).toContain('r1');
  });
});
