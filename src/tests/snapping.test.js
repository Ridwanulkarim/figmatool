import { describe, it, expect } from 'vitest';
import { snapToGrid, calculateSnapping } from '../utils/snapping.js';

describe('Snapping & Alignment Guide Engine', () => {
  it('snaps numerical values to grid intervals', () => {
    expect(snapToGrid(14, 10)).toBe(10);
    expect(snapToGrid(17, 10)).toBe(20);
    expect(snapToGrid(25, 20)).toBe(20);
  });

  it('snaps dragged element to matching object edges', () => {
    const dragged = { x: 98, y: 100, width: 50, height: 50 }; // Right edge = 148
    const targets = [{ id: 't1', x: 150, y: 100, width: 50, height: 50 }]; // Left edge = 150 (diff = 2 <= SNAP_THRESHOLD)

    const snapped = calculateSnapping(dragged, targets, false);
    expect(snapped.x).toBe(100); // 100 + 50 = 150
    expect(snapped.guides.length).toBeGreaterThan(0);
  });

  it('generates vertical and horizontal visual alignment guide line segments', () => {
    const dragged = { x: 100, y: 99, width: 50, height: 50 };
    const targets = [{ id: 't1', x: 100, y: 300, width: 50, height: 50 }];

    const snapped = calculateSnapping(dragged, targets, false);
    expect(snapped.guides.some(g => g.type === 'vertical')).toBe(true);
  });
});
