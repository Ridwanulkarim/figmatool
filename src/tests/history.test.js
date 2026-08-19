import { describe, it, expect } from 'vitest';
import {
  HistoryManager,
  AddElementsCommand,
  DeleteElementsCommand,
  GroupElementsCommand,
  TransformElementsCommand,
} from '../utils/commands.js';
import { collectAllSelectedAndDescendantIds } from '../hooks/useInteraction.js';

describe('Command Pattern History Manager & Model A Local Coordinates', () => {
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

  it('converts child world coordinates to local coordinates on grouping and restores on undo', () => {
    const history = new HistoryManager(10);
    let scene = [
      { id: 'r1', type: 'rectangle', x: 10, y: 10, width: 100, height: 50 },
      { id: 'c1', type: 'circle', x: 50, y: 50, width: 50, height: 50 },
    ];

    const group = { id: 'g1', type: 'group', x: 10, y: 10, width: 90, height: 90, children: ['r1', 'c1'] };
    const groupCmd = new GroupElementsCommand(group, scene);

    scene = groupCmd.execute(scene);
    history.push(groupCmd);

    // Child r1 local x = 10 - 10 = 0
    expect(scene.find(e => e.id === 'r1').x).toBe(0);
    expect(scene.find(e => e.id === 'r1').parentId).toBe('g1');

    // Undo restores world coordinate r1 x = 10
    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'r1').x).toBe(10);
    expect(scene.find(e => e.id === 'r1').parentId).toBeNull();
  });

  it('Model A group drag: moving group updates group position while child local position remains static', () => {
    const history = new HistoryManager(10);
    let scene = [
      { id: 'g1', type: 'group', x: 0, y: 0, children: ['r1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1', x: 10, y: 10 },
    ];

    const oldStates = scene.filter(e => e.id === 'g1').map(e => ({ ...e }));
    const newStates = oldStates.map(e => ({ ...e, x: e.x + 50, y: e.y + 50 }));

    const moveCmd = new TransformElementsCommand(oldStates, newStates);
    scene = moveCmd.execute(scene);
    history.push(moveCmd);

    // Group moved to 50
    expect(scene.find(e => e.id === 'g1').x).toBe(50);
    // Child local x remains static at 10 (rendered inside <g transform="translate(50, 50)">)
    expect(scene.find(e => e.id === 'r1').x).toBe(10);

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').x).toBe(0);
    expect(scene.find(e => e.id === 'r1').x).toBe(10);
  });
});
