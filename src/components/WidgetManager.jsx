import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import InteractivePanel from './InteractivePanel';
import {
  getWidgetTypes, getActiveWidgets, toggleWidget, isWidgetActive
} from '../services/widgetManagerService';

function WidgetManager({ onClose }) {
  const [activeWidgets, setActiveWidgets] = useState(() => getActiveWidgets());
  const widgetTypes = getWidgetTypes();

  const handleToggle = useCallback((widgetId) => {
    toggleWidget(widgetId);
    setActiveWidgets(getActiveWidgets());
  }, []);

  return (
    <InteractivePanel>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-16 right-4 w-72 rounded-2xl border border-white/10 shadow-2xl z-[9999]"
        style={{
          background: 'rgba(15, 15, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧩</span>
            <h3 className="text-white font-semibold text-sm">Desktop Widgets</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Widget List */}
        <div className="p-4 space-y-2">
          <p className="text-gray-500 text-[10px] mb-3">
            Toggle widgets to show floating panels on your desktop. Drag to reposition.
          </p>

          {Object.values(widgetTypes).map((widget) => {
            const isActive = activeWidgets.includes(widget.id);
            return (
              <motion.button
                key={widget.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToggle(widget.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{widget.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-white text-xs font-medium">{widget.name}</div>
                  <div className="text-gray-500 text-[10px]">{widget.description}</div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-all flex items-center ${
                  isActive ? 'bg-green-500/40 justify-end' : 'bg-white/10 justify-start'
                }`}>
                  <motion.div
                    layout
                    className={`w-3 h-3 rounded-full mx-0.5 ${
                      isActive ? 'bg-green-400' : 'bg-gray-600'
                    }`}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="text-gray-600 text-[9px] text-center">
            {activeWidgets.length} widget{activeWidgets.length !== 1 ? 's' : ''} active
          </div>
        </div>
      </motion.div>
    </InteractivePanel>
  );
}

export default WidgetManager;
