/**
 * Command-Based History System for Vector Editor Engine
 * Implements Command Pattern with execute(), undo(), redo()
 * Transacts atomic operations without duplicating full scene snapshots on every pointer move.
 */

export class Command {
  execute(sceneGraph) {
    throw new Error('execute() must be implemented');
  }
  undo(sceneGraph) {
    throw new Error('undo() must be implemented');
  }
  redo(sceneGraph) {
    return this.execute(sceneGraph);
  }
}

/**
 * Command to add new element(s)
 */
export class AddElementsCommand extends Command {
  constructor(elements) {
    super();
    this.elements = Array.isArray(elements) ? elements : [elements];
  }

  execute(sceneGraph) {
    return [...sceneGraph, ...this.elements];
  }

  undo(sceneGraph) {
    const ids = new Set(this.elements.map(e => e.id));
    return sceneGraph.filter(e => !ids.has(e.id));
  }
}

/**
 * Command to delete element(s)
 */
export class DeleteElementsCommand extends Command {
  constructor(elements) {
    super();
    this.elements = Array.isArray(elements) ? elements : [elements];
    this.indices = [];
  }

  execute(sceneGraph) {
    const ids = new Set(this.elements.map(e => e.id));
    this.indices = this.elements.map(e => sceneGraph.findIndex(item => item.id === e.id));
    return sceneGraph.filter(e => !ids.has(e.id));
  }

  undo(sceneGraph) {
    const nextGraph = [...sceneGraph];
    this.elements.forEach((el, index) => {
      const origIndex = this.indices[index];
      if (origIndex >= 0 && origIndex <= nextGraph.length) {
        nextGraph.splice(origIndex, 0, el);
      } else {
        nextGraph.push(el);
      }
    });
    return nextGraph;
  }
}

/**
 * Command for position/size/rotation transforms (Move, Resize, Rotate)
 * Stores pre-transform states and post-transform states
 */
export class TransformElementsCommand extends Command {
  constructor(oldStates, newStates) {
    super();
    this.oldMap = new Map(oldStates.map(el => [el.id, { ...el }]));
    this.newMap = new Map(newStates.map(el => [el.id, { ...el }]));
  }

  execute(sceneGraph) {
    return sceneGraph.map(el => {
      if (this.newMap.has(el.id)) {
        return { ...el, ...this.newMap.get(el.id) };
      }
      return el;
    });
  }

  undo(sceneGraph) {
    return sceneGraph.map(el => {
      if (this.oldMap.has(el.id)) {
        return { ...el, ...this.oldMap.get(el.id) };
      }
      return el;
    });
  }
}

/**
 * Command for property updates (e.g. fill, stroke, opacity, text, font)
 * Standardized using ES6 Map for previousValuesMap
 */
export class UpdatePropertiesCommand extends Command {
  constructor(elementIds, changes, previousValuesMap) {
    super();
    this.elementIds = Array.isArray(elementIds) ? elementIds : [elementIds];
    this.changes = changes;
    
    // Normalize to ES6 Map
    if (previousValuesMap instanceof Map) {
      this.previousValuesMap = previousValuesMap;
    } else {
      this.previousValuesMap = new Map(Object.entries(previousValuesMap || {}));
    }
  }

  execute(sceneGraph) {
    const idSet = new Set(this.elementIds);
    return sceneGraph.map(el => {
      if (idSet.has(el.id)) {
        return { ...el, ...this.changes };
      }
      return el;
    });
  }

  undo(sceneGraph) {
    const idSet = new Set(this.elementIds);
    return sceneGraph.map(el => {
      if (idSet.has(el.id) && this.previousValuesMap.has(el.id)) {
        return { ...el, ...this.previousValuesMap.get(el.id) };
      }
      return el;
    });
  }
}

/**
 * Command for Grouping elements (Option B: Flat Scene Graph with parentId)
 */
export class GroupElementsCommand extends Command {
  constructor(groupElement, childElements) {
    super();
    this.groupElement = groupElement;
    this.childElements = childElements;
  }

  execute(sceneGraph) {
    const childIds = new Set(this.childElements.map(c => c.id));
    const firstChildIndex = sceneGraph.findIndex(el => childIds.has(el.id));

    // Update parentId on child elements while retaining them in sceneGraph
    const nextGraph = sceneGraph.map(el => {
      if (childIds.has(el.id)) {
        return { ...el, parentId: this.groupElement.id };
      }
      return el;
    });

    // Insert group object at position of top child
    const insertIndex = firstChildIndex >= 0 ? firstChildIndex : nextGraph.length;
    nextGraph.splice(insertIndex, 0, this.groupElement);
    return nextGraph;
  }

  undo(sceneGraph) {
    const childIds = new Set(this.childElements.map(c => c.id));
    
    // Remove group element and clear parentId on children
    return sceneGraph
      .filter(el => el.id !== this.groupElement.id)
      .map(el => {
        if (childIds.has(el.id)) {
          return { ...el, parentId: el.parentId === this.groupElement.id ? null : el.parentId };
        }
        return el;
      });
  }
}

/**
 * Command for Ungrouping element (Option B: Flat Scene Graph with parentId)
 */
export class UngroupElementsCommand extends Command {
  constructor(groupElement, childElements) {
    super();
    this.groupElement = groupElement;
    this.childElements = childElements;
  }

  execute(sceneGraph) {
    const childIds = new Set(this.childElements.map(c => c.id));
    
    // Remove group element and clear parentId on children
    return sceneGraph
      .filter(el => el.id !== this.groupElement.id)
      .map(el => {
        if (childIds.has(el.id)) {
          return { ...el, parentId: null };
        }
        return el;
      });
  }

  undo(sceneGraph) {
    const childIds = new Set(this.childElements.map(c => c.id));
    const firstChildIndex = sceneGraph.findIndex(el => childIds.has(el.id));

    const nextGraph = sceneGraph.map(el => {
      if (childIds.has(el.id)) {
        return { ...el, parentId: this.groupElement.id };
      }
      return el;
    });

    const insertIndex = firstChildIndex >= 0 ? firstChildIndex : nextGraph.length;
    nextGraph.splice(insertIndex, 0, this.groupElement);
    return nextGraph;
  }
}

/**
 * Command for Layer Z-Index Reordering
 */
export class ReorderZIndexCommand extends Command {
  constructor(previousGraph, nextGraph) {
    super();
    this.previousGraph = previousGraph;
    this.nextGraph = nextGraph;
  }

  execute(sceneGraph) {
    return [...this.nextGraph];
  }

  undo(sceneGraph) {
    return [...this.previousGraph];
  }
}

/**
 * Command History Manager
 */
export class HistoryManager {
  constructor(maxHistory = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
  }

  push(command) {
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo(sceneGraph) {
    if (!this.canUndo()) return sceneGraph;
    const command = this.undoStack.pop();
    const nextGraph = command.undo(sceneGraph);
    this.redoStack.push(command);
    return nextGraph;
  }

  redo(sceneGraph) {
    if (!this.canRedo()) return sceneGraph;
    const command = this.redoStack.pop();
    const nextGraph = command.execute(sceneGraph);
    this.undoStack.push(command);
    return nextGraph;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
