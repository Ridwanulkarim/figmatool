import { describe, it, expect } from 'vitest';
import {
  rotatePoint,
  getBoundingBox,
  getMultiSelectionBoundingBox,
  normalizeGeometry,
  getTransformedCorners,
} from '../utils/geometry.js';

describe('Geometry & Group Bounding Box Utilities', () => {
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

  it('calculates group bounding box accounting for rotated child element quad corners', () => {
    const childRotated = { id: 'r1', type: 'rectangle', x: 100, y: 100, width: 100, height: 50, rotation: 45 };
    const group = { id: 'g1', type: 'group', children: ['r1'] };
    const sceneGraphMap = new Map([['r1', childRotated], ['g1', group]]);

    const groupBox = getBoundingBox(group, sceneGraphMap);
    const corners = getTransformedCorners(childRotated);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of corners) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x);
      maxY = Math.max(maxY, c.y);
    }

    expect(groupBox.x).toBeCloseTo(minX, 1);
    expect(groupBox.y).toBeCloseTo(minY, 1);
    expect(groupBox.width).toBeCloseTo(maxX - minX, 1);
    expect(groupBox.height).toBeCloseTo(maxY - minY, 1);
  });
});
