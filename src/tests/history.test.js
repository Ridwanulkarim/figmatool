import { describe, it, expect } from 'vitest';
import {
  HistoryManager,
  AddElementsCommand,
  GroupElementsCommand,
  TransformElementsCommand,
} from '../utils/commands.js';
import { collectAllSelectedAndDescendantIds } from '../hooks/useInteraction.js';

describe('Command Pattern History Manager & Group Descendants', () => {
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

  it('recursively gathers all descendant child IDs for group drag operations', () => {
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

  it('transforms group and all descendant children simultaneously during drag', () => {
    const history = new HistoryManager(10);
    let scene = [
      { id: 'g1', type: 'group', x: 0, y: 0, children: ['r1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1', x: 10, y: 10 },
    ];

    const oldStates = scene.map(e => ({ ...e }));
    const newStates = scene.map(e => ({ ...e, x: e.x + 50, y: e.y + 50 }));

    const moveCmd = new TransformElementsCommand(oldStates, newStates);
    scene = moveCmd.execute(scene);
    history.push(moveCmd);

    expect(scene.find(e => e.id === 'g1').x).toBe(50);
    expect(scene.find(e => e.id === 'r1').x).toBe(60); // Child moved!

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').x).toBe(0);
    expect(scene.find(e => e.id === 'r1').x).toBe(10); // Child restored!
  });
});
