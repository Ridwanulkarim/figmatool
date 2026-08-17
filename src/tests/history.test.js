import { describe, it, expect } from 'vitest';
import {
  HistoryManager,
  AddElementsCommand,
  DeleteElementsCommand,
  TransformElementsCommand,
  UpdatePropertiesCommand,
} from '../utils/commands.js';

describe('Command Pattern History Manager', () => {
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

    const cmd = new UpdatePropertiesCommand(['el-1'], { fill: '#ffffff' }, { 'el-1': { fill: '#000000' } });
    scene = cmd.execute(scene);
    history.push(cmd);

    expect(scene[0].fill).toBe('#ffffff');

    scene = history.undo(scene);
    expect(scene[0].fill).toBe('#000000');
  });

  it('limits history size to maxHistory', () => {
    const history = new HistoryManager(3);
    const elem = { id: 'e1', type: 'rectangle' };

    for (let i = 0; i < 5; i++) {
      const cmd = new AddElementsCommand({ ...elem, id: `e-${i}` });
      history.push(cmd);
    }

    expect(history.undoStack.length).toBe(3);
  });
});
