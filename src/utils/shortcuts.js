/**
 * Centralized Keyboard Shortcut Registry System
 * Safely filters out key events originating inside input/textarea form elements.
 */

export function setupKeyboardShortcuts(handlers) {
  const handleKeyDown = (e) => {
    const activeElement = document.activeElement;
    const isTyping =
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable);

    const isCtrlCmd = e.ctrlKey || e.metaKey;

    // Save project (Cmd+S) - allow even if typing
    if (isCtrlCmd && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handlers.onSave?.();
      return;
    }

    // Ignore all other hotkeys if editing text inside input box
    if (isTyping) return;

    // Undo / Redo
    if (isCtrlCmd && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handlers.onRedo?.();
      } else {
        handlers.onUndo?.();
      }
      return;
    }

    if (isCtrlCmd && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handlers.onRedo?.();
      return;
    }

    // Group (Cmd+G) / Ungroup (Shift+G or Cmd+Shift+G)
    if (isCtrlCmd && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      if (e.shiftKey) {
        handlers.onUngroup?.();
      } else {
        handlers.onGroup?.();
      }
      return;
    }

    if (e.shiftKey && e.key.toUpperCase() === 'G' && !isCtrlCmd) {
      e.preventDefault();
      handlers.onUngroup?.();
      return;
    }

    // Copy / Paste / Duplicate
    if (isCtrlCmd && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      handlers.onCopy?.();
      return;
    }

    if (isCtrlCmd && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      handlers.onPaste?.();
      return;
    }

    if (isCtrlCmd && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handlers.onDuplicate?.();
      return;
    }

    // Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handlers.onDelete?.();
      return;
    }

    // Arrow Keys Movement
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      handlers.onNudge?.(dx, dy);
      return;
    }

    // Tool switching hotkeys (single key)
    if (!isCtrlCmd && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'v') handlers.onSelectTool?.('select');
      if (key === 'r') handlers.onSelectTool?.('rectangle');
      if (key === 'o') handlers.onSelectTool?.('circle');
      if (key === 't') handlers.onSelectTool?.('text');
      if (key === 'h') handlers.onSelectTool?.('hand');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
