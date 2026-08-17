/**
 * LocalStorage Multi-Project Persistence System
 */

const PROJECTS_INDEX_KEY = 'vector_craft_projects_index';
const PROJECT_PREFIX = 'vector_craft_project_';

/**
 * Default starter shapes for a stunning initial design
 */
export const DEFAULT_DEMO_PROJECT = {
  project: {
    id: 'proj-demo',
    name: 'Sample Dashboard UI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  elements: [
    {
      id: 'rect-bg',
      type: 'rectangle',
      name: 'Card Background',
      x: 150,
      y: 100,
      width: 440,
      height: 280,
      rotation: 0,
      fill: '#1e293b',
      stroke: '#334155',
      strokeWidth: 2,
      opacity: 0.95,
      hidden: false,
      locked: false,
    },
    {
      id: 'circle-accent',
      type: 'circle',
      name: 'Accent Badge',
      x: 180,
      y: 130,
      width: 60,
      height: 60,
      rotation: 0,
      fill: '#6366f1',
      stroke: '#818cf8',
      strokeWidth: 2,
      opacity: 1,
      hidden: false,
      locked: false,
    },
    {
      id: 'text-heading',
      type: 'text',
      name: 'Heading Text',
      x: 260,
      y: 140,
      width: 250,
      height: 30,
      rotation: 0,
      text: 'VectorCraft Engine',
      fontSize: 22,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      textAlign: 'left',
      fill: '#f8fafc',
      stroke: '#000000',
      strokeWidth: 0,
      opacity: 1,
      hidden: false,
      locked: false,
    },
    {
      id: 'text-subheading',
      type: 'text',
      name: 'Subheading Text',
      x: 260,
      y: 175,
      width: 300,
      height: 20,
      rotation: 0,
      text: 'Production-grade Figma vector design editor',
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      textAlign: 'left',
      fill: '#94a3b8',
      stroke: '#000000',
      strokeWidth: 0,
      opacity: 1,
      hidden: false,
      locked: false,
    },
    {
      id: 'rect-button',
      type: 'rectangle',
      name: 'Primary Button',
      x: 180,
      y: 280,
      width: 160,
      height: 48,
      rotation: 0,
      fill: '#0d99ff',
      stroke: '#38bdf8',
      strokeWidth: 1,
      opacity: 1,
      hidden: false,
      locked: false,
    },
    {
      id: 'text-button',
      type: 'text',
      name: 'Button Label',
      x: 215,
      y: 294,
      width: 90,
      height: 20,
      rotation: 0,
      text: 'Get Started',
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '600',
      textAlign: 'left',
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 0,
      opacity: 1,
      hidden: false,
      locked: false,
    },
  ],
};

export function getProjectsList() {
  try {
    const json = localStorage.getItem(PROJECTS_INDEX_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to load projects index:', err);
    return [];
  }
}

export function saveProjectsIndex(list) {
  try {
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save projects index:', err);
  }
}

export function loadProject(id) {
  try {
    const json = localStorage.getItem(`${PROJECT_PREFIX}${id}`);
    if (!json) return null;
    return JSON.parse(json);
  } catch (err) {
    console.error(`Failed to load project ${id}:`, err);
    return null;
  }
}

export function saveProject(id, projectMeta, elements, viewport = { panX: 0, panY: 0, zoom: 1 }) {
  try {
    const updatedMeta = {
      ...projectMeta,
      id,
      updatedAt: new Date().toISOString(),
    };

    const payload = {
      project: updatedMeta,
      elements,
      viewport,
    };

    localStorage.setItem(`${PROJECT_PREFIX}${id}`, JSON.stringify(payload));

    // Update index
    const list = getProjectsList();
    const existingIndex = list.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
      list[existingIndex] = updatedMeta;
    } else {
      list.push(updatedMeta);
    }
    saveProjectsIndex(list);

    return updatedMeta;
  } catch (err) {
    console.error(`Failed to save project ${id}:`, err);
    return null;
  }
}

export function createProject(name = 'Untitled Project') {
  const id = `proj-${Date.now()}`;
  const meta = {
    id,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProject(id, meta, []);
  return meta;
}

export function deleteProject(id) {
  try {
    localStorage.removeItem(`${PROJECT_PREFIX}${id}`);
    const list = getProjectsList().filter(p => p.id !== id);
    saveProjectsIndex(list);
  } catch (err) {
    console.error(`Failed to delete project ${id}:`, err);
  }
}

export function initializePersistence() {
  const list = getProjectsList();
  if (list.length === 0) {
    // Seed starter project
    saveProject(
      DEFAULT_DEMO_PROJECT.project.id,
      DEFAULT_DEMO_PROJECT.project,
      DEFAULT_DEMO_PROJECT.elements
    );
    return DEFAULT_DEMO_PROJECT.project.id;
  }
  return list[0].id;
}
