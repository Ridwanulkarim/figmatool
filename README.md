# VectorCraft - Figma-Style Vector Design Tool

🌐 **Live Application Demo**: [https://figmatool.vercel.app/](https://figmatool.vercel.app/)

VectorCraft is a browser-based **Figma-inspired vector design editor** built with React, Vite, Tailwind CSS, and SVG rendering. It is designed to demonstrate advanced frontend engineering architecture, state management, complex geometry transformations, command-based undo/redo history, object & grid snapping, nested grouping, and multi-format export.


---

## 🌟 Features

### 🎨 Canvas & Vector Rendering
- **SVG Scene Engine**: High-performance SVG scene graph renderer driven purely by React state.
- **Shape Support**: Rectangles, Circles/Ellipses, Editable Typography Text, and Nested Groups.
- **Double-Click Canvas**: Spawns default shapes near clicked location.
- **Empty State Onboarding**: Contextual guidance when the design canvas is empty.

### 📐 Selection & Transformations
- **8 Resize Handles**: Top-Left, Top, Top-Right, Right, Bottom-Right, Bottom, Bottom-Left, Left with handle flipping for negative dimension resizing.
- **Aspect Ratio Constraint**: Hold `Shift` while dragging handles to preserve proportions.
- **Rotation Handle**: Free rotation and `Shift`-snapped 15° increment rotation.
- **Marquee Selection**: Multi-select elements by dragging a selection rectangle across the canvas.
- **Keyboard Nudging**: Arrow keys nudge elements by 1px (`Shift + Arrow` nudges by 10px).

### ⚡ Command-Based Undo / Redo
- **Command Pattern**: Implements atomic `execute()`, `undo()`, and `redo()` actions without saving monolithic scene snapshots.
- **Pointerup Transactions**: Dragging, resizing, and rotating create **exactly one** undoable history command when interaction completes.

### 🎯 Snapping & Alignment Engine
- **Grid Snapping**: Snap positions to customizable grid intervals (e.g. 10px).
- **Smart Object Snapping**: Snap to Left, Right, Center X, Top, Bottom, and Center Y of other visible elements.
- **Visual Alignment Guides**: Dynamic SVG overlay rendering alignment lines.
- **Alignment & Distribution**: Align Left, Center, Right, Top, Middle, Bottom, and Distribute Horizontally / Vertically.

### 📂 Layers & Hierarchy
- **Z-Index Layer Tree**: Visual order reflects rendering z-index.
- **Reordering**: Bring Forward, Send Backward, Bring to Front, Send to Back.
- **Lock & Hide**: Lock elements against accidental movement or toggle visibility.
- **Layer Renaming**: Double-click layer name to rename.
- **Nested Groups**: Group (`Ctrl/Cmd + G`) and Ungroup (`Shift + G`) with recursive scene graph structure.

### 🎛️ Dynamic Properties Inspector
- Position (X, Y), Dimension (W, H), Rotation (°).
- Fill color picker with preset palette swatches.
- Stroke border color and width (px).
- Opacity slider (0% - 100%).
- Text typography: Font Family, Font Size, Font Weight, Alignment.

### 💾 Projects & Export
- **LocalStorage Persistence**: Autosave and named multi-project manager.
- **SVG Export**: Standalone vector `.svg` document export.
- **PNG Export**: High-resolution PNG raster rendering.
- **JSON Import / Export**: Schema versioned JSON format (`version: 1`) with schema migration capability.

---

## 🏗️ Architecture

```text
App (Main Controller & Context)
├── TopToolbar (File, Edit, Export, Undo/Redo, Projects)
├── LeftToolPanel (Select, Rectangle, Circle, Text, Hand)
├── SVGCanvas (SVG Scene Graph Engine)
│   ├── RenderElement (Recursive Rect/Circle/Text/Group renderer)
│   ├── SelectionOverlay (8 Resize Handles, Rotation Handle, Marquee)
│   ├── InPlaceTextEditor (Double-click overlay text input)
│   └── Alignment Guides (Smart snapping line overlay)
├── LayersPanel (Z-Index Tree, Visibility, Lock, Rename)
├── PropertiesPanel (Inspector, Color Swatches, Align/Distribute)
├── ContextMenu (Right-click floating menu)
├── ProjectModal (Named Projects Manager)
└── StatusBar (Coordinates, Selection info, Mouse-centered Zoom)

Engine Utilities (Pure JS - Decoupled from React DOM):
├── geometry.js (Rotate points, Rotated AABB, Aspect ratio & negative handles)
├── hitTesting.js (Point hit test, Rotated rect collision, Marquee intersection)
├── coordinates.js (Screen to Canvas & Canvas to Screen coordinate transforms)
├── snapping.js (Grid & Object edge/center alignment guide math)
├── commands.js (Command pattern history manager & transaction batching)
├── export.js (SVG markup builder, PNG canvas exporter, Versioned JSON importer)
├── persistence.js (LocalStorage project manager & seed starter templates)
└── shortcuts.js (Centralized keyboard event registry with form input safety)
```

---

## ❓ Why SVG over Canvas 2D?

| Feature | SVG Vector Engine | Canvas 2D Engine |
| :--- | :--- | :--- |
| **DOM Hierarchy** | Native DOM element mapping per shape | Manual pixel buffer rasterization |
| **Resolution** | Resolution independent at any zoom | Pixelation on high DPI / extreme zoom |
| **Exporting** | Direct SVG string serialization | Requires manual path reconstruction |
| **Accessibility & Styling**| Native CSS properties, cursors, and pointer events | Manual hit-region color index buffer |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `V` | Select Tool |
| `R` | Rectangle Tool |
| `O` | Circle Tool |
| `T` | Text Tool |
| `H` | Hand (Pan) Tool |
| `Delete` / `Backspace` | Delete selected elements |
| `Arrow Keys` | Nudge selected elements by 1px |
| `Shift + Arrow Keys` | Nudge selected elements by 10px |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + G` | Group selected elements |
| `Shift + G` / `Ctrl/Cmd + Shift + G` | Ungroup selected group |
| `Ctrl/Cmd + C` | Copy selected elements |
| `Ctrl/Cmd + V` | Paste copied elements |
| `Ctrl/Cmd + D` | Duplicate selected elements |
| `Ctrl/Cmd + S` | Save current project |

---

## 🚫 Intentionally Excluded Scope

The following features are intentionally out of scope to focus on frontend architecture and interaction design:
- Real-time multiplayer WebSockets / CRDT collaboration
- Bezier pen / vector curve path editing
- Plugin system architecture
- Prototyping interactive transitions
- Backend cloud storage

---

## 🧪 Testing

Run automated Vitest test suite covering geometry, rotated bounding boxes, negative handle normalization, hit testing, coordinate conversions, and snapping math:

```sh
npm test
```

---

## 🛠️ Development Setup

```sh
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run production build
npm run build
```
