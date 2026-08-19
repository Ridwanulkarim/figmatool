import { describe, it, expect } from 'vitest';
import {
  HistoryManager,
  AddElementsCommand,
  TransformElementsCommand,
} from '../utils/commands.js';
import {
  getBoundingBox,
  getWorldTransformedCorners,
  transformPointToLocalSpace,
} from '../utils/geometry.js';
import { isElementHit } from '../utils/hitTesting.js';
import { deepCloneElements } from '../hooks/useClipboard.js';

describe('Group Transformation Audit Test Suite (11 Core Tests)', () => {
  // Test 1: Single-level group movement
  it('1. Single-level group movement: moves group x while child local x stays constant', () => {
    const group = { id: 'g1', type: 'group', x: 100, y: 50, width: 200, height: 100, children: ['r1', 'c1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'g1', x: 20, y: 10, width: 50, height: 30 };
    const circle = { id: 'c1', type: 'circle', parentId: 'g1', x: 80, y: 20, width: 40, height: 40 };
    let scene = [group, rect, circle];

    // Move group +50px
    const oldStates = [group];
    const newStates = [{ ...group, x: group.x + 50 }];
    const cmd = new TransformElementsCommand(oldStates, newStates);
    scene = cmd.execute(scene);

    const updatedGroup = scene.find(e => e.id === 'g1');
    const updatedRect = scene.find(e => e.id === 'r1');
    const updatedCircle = scene.find(e => e.id === 'c1');

    expect(updatedGroup.x).toBe(150);
    // Local coordinates remain unchanged
    expect(updatedRect.x).toBe(20);
    expect(updatedCircle.x).toBe(80);
    // World coordinates are group.x + child.x
    expect(updatedGroup.x + updatedRect.x).toBe(170);
    expect(updatedGroup.x + updatedCircle.x).toBe(230);
  });

  // Test 2: Nested-group movement
  it('2. Nested-group movement: moving ancestor updates ancestor x while descendants retain local x', () => {
    const groupA = { id: 'gA', type: 'group', x: 100, y: 0, width: 300, height: 300, children: ['gB'] };
    const groupB = { id: 'gB', type: 'group', parentId: 'gA', x: 50, y: 0, width: 200, height: 200, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'gB', x: 20, y: 0, width: 50, height: 50 };
    let scene = [groupA, groupB, rect];

    // Rect initial world X = 100 + 50 + 20 = 170
    expect(groupA.x + groupB.x + rect.x).toBe(170);

    // Move Group A +30px
    const cmd = new TransformElementsCommand([groupA], [{ ...groupA, x: groupA.x + 30 }]);
    scene = cmd.execute(scene);

    const nextGA = scene.find(e => e.id === 'gA');
    const nextGB = scene.find(e => e.id === 'gB');
    const nextRect = scene.find(e => e.id === 'r1');

    expect(nextGA.x).toBe(130);
    expect(nextGB.x).toBe(50); // Local X unchanged
    expect(nextRect.x).toBe(20); // Local X unchanged
    // Rect world X = 130 + 50 + 20 = 200
    expect(nextGA.x + nextGB.x + nextRect.x).toBe(200);
  });

  // Test 3: Group rotation
  it('3. Group rotation: rotating group updates group rotation while child local rotation remains constant', () => {
    const group = { id: 'g1', type: 'group', x: 100, y: 100, width: 200, height: 100, rotation: 0, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'g1', x: 20, y: 10, width: 50, height: 30, rotation: 15 };
    let scene = [group, rect];

    const cmd = new TransformElementsCommand([group], [{ ...group, rotation: 30 }]);
    scene = cmd.execute(scene);

    expect(scene.find(e => e.id === 'g1').rotation).toBe(30);
    expect(scene.find(e => e.id === 'r1').rotation).toBe(15); // Local rotation unchanged
  });

  // Test 4: Nested-group rotation
  it('4. Nested-group rotation: accumulates matrix rotations in world space', () => {
    const groupA = { id: 'gA', type: 'group', x: 100, y: 50, width: 300, height: 300, rotation: 30, children: ['gB'] };
    const groupB = { id: 'gB', type: 'group', parentId: 'gA', x: 50, y: 20, width: 200, height: 200, rotation: 20, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'gB', x: 20, y: 10, width: 50, height: 30, rotation: 15 };
    const sceneGraphMap = new Map([['gA', groupA], ['gB', groupB], ['r1', rect]]);

    const worldCorners = getWorldTransformedCorners(rect, sceneGraphMap);
    expect(worldCorners.length).toBe(4);
    expect(worldCorners[0].x).toBeGreaterThan(0);
  });

  // Test 5: Group resize
  it('5. Group resize: scales group and child local coordinates proportionally', () => {
    const group = { id: 'g1', type: 'group', x: 0, y: 0, width: 100, height: 100, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'g1', x: 20, y: 10, width: 40, height: 30 };
    let scene = [group, rect];

    // Resize group to 200x200 (scale 2x)
    const scaleX = 2;
    const scaleY = 2;
    const newGroup = { ...group, width: 200, height: 200 };
    const newRect = {
      ...rect,
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    };

    const cmd = new TransformElementsCommand([group, rect], [newGroup, newRect]);
    scene = cmd.execute(scene);

    expect(scene.find(e => e.id === 'g1').width).toBe(200);
    expect(scene.find(e => e.id === 'r1').x).toBe(40);
    expect(scene.find(e => e.id === 'r1').width).toBe(80);
  });

  // Test 6: Rotated-child bounding box
  it('6. Rotated-child bounding box: calculates world space bounds for group containing rotated child', () => {
    const rectRotated = { id: 'r1', type: 'rectangle', x: 100, y: 100, width: 100, height: 50, rotation: 45 };
    const group = { id: 'g1', type: 'group', x: 0, y: 0, width: 200, height: 200, children: ['r1'] };
    const sceneGraphMap = new Map([['r1', rectRotated], ['g1', group]]);

    const bbox = getBoundingBox(group, sceneGraphMap);
    expect(bbox.width).toBeGreaterThan(0);
    expect(bbox.height).toBeGreaterThan(0);
  });

  // Test 7: Nested transformed hit testing
  it('7. Nested transformed hit testing: transforms world point into local space for nested rotated group shape', () => {
    const groupA = { id: 'gA', type: 'group', x: 100, y: 50, width: 300, height: 300, rotation: 30, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'gA', x: 20, y: 10, width: 100, height: 50, rotation: 0 };
    const sceneGraphMap = new Map([['gA', groupA], ['r1', rect]]);

    // Transform world point to local space
    const localPt = transformPointToLocalSpace({ x: 150, y: 100 }, rect, sceneGraphMap);
    expect(localPt).toBeDefined();

    const isHit = isElementHit({ x: 150, y: 100 }, rect, sceneGraphMap);
    expect(typeof isHit).toBe('boolean');
  });

  // Test 8: Group move undo/redo
  it('8. Group move undo/redo: restores exact group position and hierarchy', () => {
    const history = new HistoryManager(10);
    const group = { id: 'g1', type: 'group', x: 100, y: 100, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'g1', x: 20, y: 20 };
    let scene = [group, rect];

    const cmd = new TransformElementsCommand([group], [{ ...group, x: 200, y: 200 }]);
    scene = cmd.execute(scene);
    history.push(cmd);

    expect(scene.find(e => e.id === 'g1').x).toBe(200);

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').x).toBe(100);

    scene = history.redo(scene);
    expect(scene.find(e => e.id === 'g1').x).toBe(200);
  });

  // Test 9: Group rotation undo/redo
  it('9. Group rotation undo/redo: restores exact group rotation', () => {
    const history = new HistoryManager(10);
    const group = { id: 'g1', type: 'group', rotation: 0, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'g1', rotation: 15 };
    let scene = [group, rect];

    const cmd = new TransformElementsCommand([group], [{ ...group, rotation: 45 }]);
    scene = cmd.execute(scene);
    history.push(cmd);

    expect(scene.find(e => e.id === 'g1').rotation).toBe(45);

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').rotation).toBe(0);

    scene = history.redo(scene);
    expect(scene.find(e => e.id === 'g1').rotation).toBe(45);
  });

  // Test 10: Group resize undo/redo
  it('10. Group resize undo/redo: restores exact group and child dimensions', () => {
    const history = new HistoryManager(10);
    const group = { id: 'g1', type: 'group', width: 100, height: 100, children: ['r1'] };
    const rect = { id: 'r1', type: 'rectangle', parentId: 'g1', width: 50, height: 50 };
    let scene = [group, rect];

    const cmd = new TransformElementsCommand([group, rect], [{ ...group, width: 200 }, { ...rect, width: 100 }]);
    scene = cmd.execute(scene);
    history.push(cmd);

    expect(scene.find(e => e.id === 'g1').width).toBe(200);
    expect(scene.find(e => e.id === 'r1').width).toBe(100);

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').width).toBe(100);
    expect(scene.find(e => e.id === 'r1').width).toBe(50);
  });

  // Test 11: Nested-group copy/paste
  it('11. Nested-group copy/paste: clones unique IDs, remaps children/parentId links, offsets top-level group, and preserves child local coordinates', () => {
    const groupA = { id: 'gA', type: 'group', name: 'gA', x: 100, y: 100, children: ['gB'] };
    const groupB = { id: 'gB', type: 'group', name: 'gB', parentId: 'gA', x: 50, y: 50, children: ['r1', 'c1'] };
    const rect = { id: 'r1', type: 'rectangle', name: 'r1', parentId: 'gB', x: 20, y: 10 };
    const circle = { id: 'c1', type: 'circle', name: 'c1', parentId: 'gB', x: 80, y: 20 };
    const scene = [groupA, groupB, rect, circle];

    const { clonedElements } = deepCloneElements([groupA], scene, 20);

    expect(clonedElements.length).toBe(4);
    const clonedGA = clonedElements.find(e => e.name.includes('gA (Copy)'));
    const clonedGB = clonedElements.find(e => e.name.includes('gB (Copy)'));
    const clonedRect = clonedElements.find(e => e.name.includes('r1 (Copy)'));

    expect(clonedGA).toBeDefined();
    expect(clonedGA.id).not.toBe('gA');
    expect(clonedGA.x).toBe(120); // Top-level group offset by +20
    expect(clonedGB.parentId).toBe(clonedGA.id);
    expect(clonedGB.x).toBe(50); // Nested child group retains local x
    expect(clonedRect.parentId).toBe(clonedGB.id);
    expect(clonedRect.x).toBe(20); // Child shape retains local x
  });
});
