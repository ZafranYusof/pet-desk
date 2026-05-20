import React, { useCallback } from 'react';

/**
 * Wrapper that ensures Electron click-through is disabled
 * when mouse is over any panel/modal content.
 */
function InteractivePanel({ children, className = '', style = {}, ...props }) {
  const handleMouseEnter = useCallback(() => {
    if (window.electronAPI?.setIgnoreMouse) {
      window.electronAPI.setIgnoreMouse(false);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Don't re-enable here - let App.jsx anyPanelOpen handle it
  }, []);

  return (
    <div
      className={className}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}

export default InteractivePanel;
