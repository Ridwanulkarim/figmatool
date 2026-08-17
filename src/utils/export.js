/**
 * Export and Migration Utility Engine
 * Supports SVG, PNG, and Versioned JSON import/export
 */

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Render single element to SVG markup string
 */
function elementToSVG(element, sceneGraphMap) {
  if (element.hidden) return '';

  const { x, y, width, height, rotation = 0, opacity = 1, fill = '#6366f1', stroke = '#000000', strokeWidth = 0 } = element;
  const transform = rotation ? `transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})"` : '';
  const opacityAttr = opacity < 1 ? `opacity="${opacity}"` : '';
  const strokeAttr = strokeWidth > 0 ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';

  switch (element.type) {
    case 'rectangle':
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${strokeAttr} ${opacityAttr} ${transform} />`;

    case 'circle':
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${strokeAttr} ${opacityAttr} ${transform} />`;

    case 'text':
      const {
        text = 'Text',
        fontSize = 16,
        fontFamily = 'Inter',
        fontWeight = 'normal',
        textAlign = 'left',
      } = element;

      let textAnchor = 'start';
      let textX = x;
      if (textAlign === 'center') {
        textAnchor = 'middle';
        textX = x + width / 2;
      } else if (textAlign === 'right') {
        textAnchor = 'end';
        textX = x + width;
      }

      const textY = y + fontSize; // Approx baseline
      return `<text x="${textX}" y="${textY}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="${textAnchor}" fill="${fill}" ${opacityAttr} ${transform}>${escapeXML(text)}</text>`;

    case 'group':
      if (!element.children || element.children.length === 0) return '';
      const childrenMarkup = element.children
        .map(childId => sceneGraphMap.get(childId))
        .filter(Boolean)
        .map(child => elementToSVG(child, sceneGraphMap))
        .join('\n');
      return `<g id="${element.id}" ${opacityAttr} ${transform}>\n${childrenMarkup}\n</g>`;

    default:
      return '';
  }
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate full SVG document string
 */
export function generateSVGString(sceneGraph, bounds = { width: 1920, height: 1080 }) {
  const sceneGraphMap = new Map(sceneGraph.map(el => [el.id, el]));
  const bodyMarkup = sceneGraph
    .map(el => elementToSVG(el, sceneGraphMap))
    .filter(Boolean)
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}">
  <style>
    text { font-family: 'Inter', sans-serif; }
  </style>
  ${bodyMarkup}
</svg>`;
}

/**
 * Download SVG file
 */
export function exportToSVG(sceneGraph, filename = 'design.svg') {
  const svgContent = generateSVGString(sceneGraph);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Download PNG image rendered from SVG
 */
export function exportToPNG(sceneGraph, filename = 'design.png', width = 1920, height = 1080) {
  const svgString = generateSVGString(sceneGraph, { width, height });
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Transparent background
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((pngBlob) => {
      URL.revokeObjectURL(url);
      triggerDownload(pngBlob, filename);
    }, 'image/png');
  };
  img.src = url;
}

/**
 * Export JSON project file with versioning
 */
export function exportToJSON(sceneGraph, projectMeta = {}, filename = 'design.json') {
  const data = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    project: {
      name: projectMeta.name || 'Untitled Project',
      id: projectMeta.id || 'project-1',
      ...projectMeta,
    },
    elements: sceneGraph,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

/**
 * Import JSON project file with Schema Version Migration
 */
export function importFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON file format.');
    }

    let version = parsed.version || 1;
    let elements = parsed.elements || [];
    let project = parsed.project || { name: 'Imported Project' };

    // Migration Pipeline for future schema versions
    if (version === 1) {
      // Ensure required default properties exist on all elements
      elements = elements.map((el, idx) => ({
        id: el.id || `imported-${idx}-${Date.now()}`,
        type: el.type || 'rectangle',
        name: el.name || `${el.type || 'Shape'} ${idx + 1}`,
        x: Number(el.x) || 0,
        y: Number(el.y) || 0,
        width: Number(el.width) || 100,
        height: Number(el.height) || 100,
        rotation: Number(el.rotation) || 0,
        fill: el.fill || '#6366f1',
        stroke: el.stroke || '#000000',
        strokeWidth: Number(el.strokeWidth) || 0,
        opacity: el.opacity !== undefined ? Number(el.opacity) : 1,
        hidden: Boolean(el.hidden),
        locked: Boolean(el.locked),
        ...el,
      }));
    }

    return {
      success: true,
      project,
      elements,
      version: CURRENT_SCHEMA_VERSION,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to parse JSON design file.',
    };
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
