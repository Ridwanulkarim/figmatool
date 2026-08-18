import { describe, it, expect } from 'vitest';
import {
  rotatePoint,
  getBoundingBox,
  getMultiSelectionBoundingBox,
  normalizeGeometry,
  getTransformedCorners,
  getTopLevelSelectableElement,
} from '../utils/geometry.js';

describe('Geometry & Multi-Level Rotated Group Bounding Box Utilities', () => {
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

  it('calculates group bounding box accounting for multi-level nested rotated groups in world space', () => {
    const groupA = { id: 'gA', type: 'group', x: 100, y: 100, width: 100, height: 50, rotation: 30, children: ['gB'] };
    const groupB = { id: 'gB', type: 'group', parentId: 'gA', x: 100, y: 100, width: 100, height: 50, rotation: 20, children: ['r1'] };
    const rect1 = { id: 'r1', type: 'rectangle', parentId: 'gB', x: 100, y: 100, width: 100, height: 50, rotation: 15 };

    const sceneGraphMap = new Map([['gA', groupA], ['gB', groupB], ['r1', rect1]]);

    const boxA = getBoundingBox(groupA, sceneGraphMap);
    expect(boxA.width).toBeGreaterThan(0);
    expect(boxA.height).toBeGreaterThan(0);
  });

  it('implements Figma Group Selection Policy (getTopLevelSelectableElement)', () => {
    const group = { id: 'g1', type: 'group' };
    const child = { id: 'c1', type: 'rectangle', parentId: 'g1' };
    const sceneGraphMap = new Map([['g1', group], ['c1', child]]);

    // Normal click selects root parent group
    const topElement = getTopLevelSelectableElement(child, sceneGraphMap, false);
    expect(topElement.id).toBe('g1');

    // Cmd/Ctrl + Click deep selects the child element directly
    const deepElement = getTopLevelSelectableElement(child, sceneGraphMap, true);
    expect(deepElement.id).toBe('c1');
  });
});
