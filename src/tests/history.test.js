import { describe, it, expect } from 'vitest';
import {
  HistoryManager,
  AddElementsCommand,
  DeleteElementsCommand,
  GroupElementsCommand,
  TransformElementsCommand,
} from '../utils/commands.js';
import { collectAllSelectedAndDescendantIds } from '../hooks/useInteraction.js';

describe('Command Pattern History Manager & Group Hierarchy Operations', () => {
  it('pushes commands and manages undo/redo stack', () => {
    const history = new HistoryManager(10);
    let scene = [];

    const elem = { id: 'el-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 };
    const cmd1 = new AddElementsCommand(elem);

    scene = cmd1.execute(scene);
    history.push(cmd1);

    expect(scene.length).toBe(1);
    expect(history.canUndo()).toBe(true);

    scene = history.undo(scene);
    expect(scene.length).toBe(0);
    expect(history.canRedo()).toBe(true);

    scene = history.redo(scene);
    expect(scene.length).toBe(1);
  });

  it('recursively gathers all descendant child IDs for group operations', () => {
    const sceneGraph = [
      { id: 'g1', type: 'group', children: ['g2', 'c1'] },
      { id: 'g2', type: 'group', parentId: 'g1', children: ['r1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g2', x: 0, y: 0 },
      { id: 'c1', type: 'circle', parentId: 'g1', x: 50, y: 50 },
    ];

    const allIds = collectAllSelectedAndDescendantIds(['g1'], sceneGraph);
    expect(allIds.has('g1')).toBe(true);
    expect(allIds.has('g2')).toBe(true);
    expect(allIds.has('r1')).toBe(true);
    expect(allIds.has('c1')).toBe(true);
    expect(allIds.size).toBe(4);
  });

  it('deletes group and all descendant children recursively and restores hierarchy on undo', () => {
    const history = new HistoryManager(10);
    let sceneGraph = [
      { id: 'g1', type: 'group', children: ['r1', 'c1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1', x: 10, y: 10 },
      { id: 'c1', type: 'circle', parentId: 'g1', x: 50, y: 50 },
    ];

    const allTargetIds = collectAllSelectedAndDescendantIds(['g1'], sceneGraph);
    const toDelete = sceneGraph.filter(el => allTargetIds.has(el.id));
    const deleteCmd = new DeleteElementsCommand(toDelete);

    sceneGraph = deleteCmd.execute(sceneGraph);
    history.push(deleteCmd);

    // Completely deleted without orphaned children!
    expect(sceneGraph.length).toBe(0);

    // Undo restores full hierarchy cleanly
    sceneGraph = history.undo(sceneGraph);
    expect(sceneGraph.length).toBe(3);
    expect(sceneGraph.find(e => e.id === 'r1').parentId).toBe('g1');
  });

  it('transforms group and all descendant children simultaneously during arrow key nudging', () => {
    const history = new HistoryManager(10);
    let scene = [
      { id: 'g1', type: 'group', x: 0, y: 0, children: ['r1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1', x: 10, y: 10 },
    ];

    const allTargetIds = collectAllSelectedAndDescendantIds(['g1'], scene);
    const oldStates = scene.filter(e => allTargetIds.has(e.id)).map(e => ({ ...e }));
    const newStates = oldStates.map(e => ({ ...e, x: e.x + 10, y: e.y + 10 }));

    const nudgeCmd = new TransformElementsCommand(oldStates, newStates);
    scene = nudgeCmd.execute(scene);
    history.push(nudgeCmd);

    expect(scene.find(e => e.id === 'g1').x).toBe(10);
    expect(scene.find(e => e.id === 'r1').x).toBe(20);

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').x).toBe(0);
    expect(scene.find(e => e.id === 'r1').x).toBe(10);
  });
});
