import { describe, it, expect } from 'vitest';
import { generateSVGString, importFromJSON } from '../utils/export.js';

describe('Export & JSON Schema Engine', () => {
  it('generates valid SVG markup string for scene graph', () => {
    const sceneGraph = [
      { id: 'r1', type: 'rectangle', x: 10, y: 20, width: 100, height: 50, fill: '#6366f1' },
      { id: 'c1', type: 'circle', x: 50, y: 50, width: 60, height: 60, fill: '#0d99ff' },
      { id: 't1', type: 'text', x: 10, y: 10, width: 100, height: 20, text: 'Hello', fill: '#ffffff' },
    ];

    const svgString = generateSVGString(sceneGraph, { width: 800, height: 600 });
    expect(svgString).toContain('<svg');
    expect(svgString).toContain('<rect x="10" y="20"');
    expect(svgString).toContain('<ellipse cx="80" cy="80"');
    expect(svgString).toContain('Hello</text>');
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

  it('rejects invalid JSON strings gracefully', () => {
    const result = importFromJSON('invalid json content');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
