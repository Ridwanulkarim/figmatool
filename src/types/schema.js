/**
 * VectorCraft Scene Graph & Core Data Contracts (JSDoc Specifications)
 */

/**
 * @typedef {Object} BaseElement
 * @property {string} id - Unique identifier (e.g., 'rect-123456789')
 * @property {'rectangle'|'circle'|'text'|'group'} type - Element vector type
 * @property {string} name - User-friendly display name (e.g., 'Rectangle 1')
 * @property {string|null} [parentId=null] - ID of parent group if element belongs to a group
 * @property {number} x - Top-left X coordinate in canvas space
 * @property {number} y - Top-left Y coordinate in canvas space
 * @property {number} width - Element width in canvas units
 * @property {number} height - Element height in canvas units
 * @property {number} [rotation=0] - Rotation angle in degrees (0-360)
 * @property {string} [fill='#6366f1'] - Fill color in CSS hex/rgb/rgba format
 * @property {string} [stroke='#000000'] - Stroke border color
 * @property {number} [strokeWidth=0] - Stroke border width in pixels
 * @property {number} [opacity=1] - Opacity alpha channel (0 to 1)
 * @property {boolean} [hidden=false] - Layer visibility state
 * @property {boolean} [locked=false] - Layer selection/transform lock state
 */

/**
 * @typedef {BaseElement & {
 *   text: string,
 *   fontSize: number,
 *   fontFamily: string,
 *   fontWeight: 'normal'|'medium'|'600'|'bold',
 *   textAlign: 'left'|'center'|'right'
 * }} TextElement
 */

/**
 * @typedef {BaseElement & {
 *   children: string[]
 * }} GroupElement
 */

/**
 * @typedef {BaseElement | TextElement | GroupElement} VectorElement
 */

/**
 * @typedef {Object} Viewport
 * @property {number} panX - Horizontal pan offset in screen pixels
 * @property {number} panY - Vertical pan offset in screen pixels
 * @property {number} zoom - Zoom scaling factor (e.g. 1 = 100%, 1.5 = 150%)
 */

/**
 * @typedef {Object} ProjectMetadata
 * @property {string} id - Project unique identifier
 * @property {string} name - Project display title
 * @property {string} createdAt - ISO timestamp string
 * @property {string} updatedAt - ISO timestamp string
 */

/**
 * Schema Validation Helper: Ensures object conforms to VectorElement contract
 */
export function validateElementSchema(element) {
  if (!element || typeof element !== 'object') {
    throw new Error('Element must be a valid non-null object');
  }

  if (!element.id || typeof element.id !== 'string') {
    throw new Error('Element schema violation: missing or invalid "id"');
  }

  if (!['rectangle', 'circle', 'text', 'group'].includes(element.type)) {
    throw new Error(`Element schema violation: invalid type "${element.type}"`);
  }

  return true;
}
