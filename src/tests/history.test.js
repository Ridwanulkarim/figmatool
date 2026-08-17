import { describe, it, expect } from 'vitest';
import {
  HistoryManager,
  AddElementsCommand,
  DeleteElementsCommand,
  TransformElementsCommand,
  UpdatePropertiesCommand,
  GroupElementsCommand,
  UngroupElementsCommand,
} from '../utils/commands.js';

describe('Command Pattern History Manager & Grouping', () => {
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

  it('correctly updates element properties and rolls back on undo', () => {
    const history = new HistoryManager(10);
    let scene = [{ id: 'el-1', fill: '#000000' }];

    const cmd = new UpdatePropertiesCommand(['el-1'], { fill: '#ffffff' }, new Map([['el-1', { fill: '#000000' }]]));
    scene = cmd.execute(scene);
    history.push(cmd);

    expect(scene[0].fill).toBe('#ffffff');

    scene = history.undo(scene);
    expect(scene[0].fill).toBe('#000000');
  });

  it('executes GroupElementsCommand and retains children in flat sceneGraph with parentId links', () => {
    const history = new HistoryManager(10);
    let scene = [
      { id: 'r1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
      { id: 'c1', type: 'circle', x: 50, y: 50, width: 50, height: 50 },
    ];

    const group = { id: 'g1', type: 'group', children: ['r1', 'c1'] };
    const groupCmd = new GroupElementsCommand(group, scene);

    scene = groupCmd.execute(scene);
    history.push(groupCmd);

    // Scene contains 3 objects: group, r1, c1
    expect(scene.length).toBe(3);
    expect(scene.find(e => e.id === 'r1').parentId).toBe('g1');
    expect(scene.find(e => e.id === 'c1').parentId).toBe('g1');

    // Undo group
    scene = history.undo(scene);
    expect(scene.length).toBe(2);
    expect(scene.find(e => e.id === 'r1').parentId).toBeNull();
  });

  it('handles nested group transactions seamlessly', () => {
    const history = new HistoryManager(10);
    let scene = [
      { id: 'g1', type: 'group', children: ['r1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1' },
      { id: 'c1', type: 'circle', parentId: null },
    ];

    const outerGroup = { id: 'g2', type: 'group', children: ['g1', 'c1'] };
    const outerCmd = new GroupElementsCommand(outerGroup, scene);

    scene = outerCmd.execute(scene);
    history.push(outerCmd);

    expect(scene.length).toBe(4);
    expect(scene.find(e => e.id === 'g1').parentId).toBe('g2');

    scene = history.undo(scene);
    expect(scene.find(e => e.id === 'g1').parentId).toBeNull();
  });
});
