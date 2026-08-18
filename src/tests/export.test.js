import { describe, it, expect } from 'vitest';
import { generateSVGString, importFromJSON } from '../utils/export.js';
import { deepCloneElements } from '../hooks/useClipboard.js';

describe('Export & Strict JSON Schema Engine', () => {
  it('generates valid SVG markup string for flat scene graph with groups', () => {
    const sceneGraph = [
      { id: 'g1', type: 'group', children: ['r1', 'c1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1', x: 10, y: 20, width: 100, height: 50, fill: '#6366f1' },
      { id: 'c1', type: 'circle', parentId: 'g1', x: 50, y: 50, width: 60, height: 60, fill: '#0d99ff' },
    ];

    const svgString = generateSVGString(sceneGraph, { width: 800, height: 600 });
    expect(svgString).toContain('<g id="g1"');
    expect(svgString).toContain('<rect x="10" y="20"');
    expect(svgString).toContain('<ellipse cx="80" cy="80"');
  });

  it('recursively clones group objects with unique remapped child IDs', () => {
    const sceneGraph = [
      { id: 'g1', type: 'group', children: ['r1', 'c1'] },
      { id: 'r1', type: 'rectangle', parentId: 'g1', x: 10, y: 20, width: 100, height: 50 },
      { id: 'c1', type: 'circle', parentId: 'g1', x: 50, y: 50, width: 60, height: 60 },
    ];

    const toClone = [sceneGraph[0]]; // Clone group g1
    const { clonedElements } = deepCloneElements(toClone, sceneGraph, 20);

    expect(clonedElements.length).toBe(3); // Cloned group, cloned r1, cloned c1
    const clonedGroup = clonedElements.find(e => e.type === 'group');
    const clonedRect = clonedElements.find(e => e.type === 'rectangle');

    expect(clonedGroup.id).not.toBe('g1');
    expect(clonedRect.parentId).toBe(clonedGroup.id);
    expect(clonedGroup.children).toContain(clonedRect.id);
    expect(clonedGroup.children).not.toContain('r1'); // Remapped!
  });

  it('parses valid JSON design files with version validation', () => {
    const validJson = JSON.stringify({
      version: 1,
      project: { name: 'Test Design' },
      elements: [{ id: 'el-1', type: 'rectangle', x: 0, y: 0, width: 50, height: 50 }],
    });

    const result = importFromJSON(validJson);
    expect(result.success).toBe(true);
    expect(result.elements.length).toBe(1);
    expect(result.project.name).toBe('Test Design');
  });

  it('rejects invalid element types in JSON payload', () => {
    const invalidJson = JSON.stringify({
      version: 1,
      elements: [{ id: 'el-1', type: 'invalid-type-foo', x: 0, y: 0, width: 50, height: 50 }],
    });

    const result = importFromJSON(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid type');
  });

  it('rejects circular group parent relationships', () => {
    const circularJson = JSON.stringify({
      version: 1,
      elements: [
        { id: 'g1', type: 'group', x: 0, y: 0, width: 100, height: 100, parentId: 'g2', children: ['g2'] },
        { id: 'g2', type: 'group', x: 0, y: 0, width: 100, height: 100, parentId: 'g1', children: ['g1'] },
      ],
    });

    const result = importFromJSON(circularJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('circular group parent relationship');
  });
});
