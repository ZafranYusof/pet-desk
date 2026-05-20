import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPetContext, updateUserProfile, updatePreferences, addNote, removeNote, removeProject } from '../services/petContextService';
import { getPatterns, getDailyStats, getInsight } from '../services/activityLearningService';
import { getKnownProjects, getStaleProjects } from '../services/fileAwarenessService';

function PetKnowledge({ onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [context, setContext] = useState(() => getPetContext());
  const [patterns, setPatterns] = useState(() => getPatterns());
  const [dailyStats, setDailyStats] = useState(() => getDailyStats());
  const [projects, setProjects] = useState(() => getKnownProjects());
  const [insight, setInsight] = useState(() => getInsight());
  const [newNote, setNewNote] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [nameValue, setNameValue] = useState(context.user.name);
  const [roleValue, setRoleValue] = useState(context.user.role);
  const [interestInput, setInterestInput] = useState('');

  const panelRef = useRef(null);

  const handleMouseEnter = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false);
  };

  const tabs = [
    { id: 'profile', label: '👤', title: 'Profile' },
    { id: 'projects', label: '📁', title: 'Projects' },
    { id: 'patterns', label: '📊', title: 'Patterns' },
    { id: 'notes', label: '📝', title: 'Notes' },
  ];

  function handleSaveName() {
    const updated = updateUserProfile({ name: nameValue });
    setContext(updated);
    setEditingName(false);
  }

  function handleSaveRole() {
    const updated = updateUserProfile({ role: roleValue });
    setContext(updated);
    setEditingRole(false);
  }

  function handleAddInterest() {
    if (!interestInput.trim()) return;
    const newInterests = [...context.user.interests, interestInput.trim()];
    const updated = updateUserProfile({ interests: newInterests });
    setContext(updated);
    setInterestInput('');
  }

  function handleRemoveInterest(idx) {
    const newInterests = context.user.interests.filter((_, i) => i !== idx);
    const updated = updateUserProfile({ interests: newInterests });
    setContext(updated);
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    const updated = addNote(newNote.trim());
    setContext(updated);
    setNewNote('');
  }

  function handleRemoveNote(noteId) {
    const updated = removeNote(noteId);
    setContext(updated);
  }

  function handleRemoveProject(path) {
    const updated = removeProject(path);
    setContext(updated);
    setProjects(getKnownProjects());
  }

  function handleTogglePreference(key) {
    const updated = updatePreferences({ [key]: !context.preferences[key] });
    setContext(updated);
  }

  function handleWorkHoursChange(field, value) {
    const num = parseInt(value);
    if (isNaN(num) || num < 0 || num > 23) return;
    const updated = updatePreferences({
      workHours: { ...context.preferences.workHours, [field]: num },
    });
    setContext(updated);
  }

  // Get hourly activity chart data
  function getHourlyData() {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const maxActivity = Math.max(1, ...Object.values(patterns.activeHours || {}));
    return hours.map((h) => ({
      hour: h,
      value: (patterns.activeHours || {})[h.toString()] || 0,
      normalized: ((patterns.activeHours || {})[h.toString()] || 0) / maxActivity,
    }));
  }

  return (
    <motion.div
      ref={panelRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseEnter={handleMouseEnter}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="relative w-[480px] max-h-[600px] bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-gray-600/30 shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h2 className="text-sm font-semibold text-white">Pet Knowledge</h2>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              What I know about you
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span>{tab.label}</span>
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Name */}
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Name</label>
                {editingName ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-purple-500/50"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName} className="text-xs text-green-400 hover:text-green-300 cursor-pointer">✓</button>
                    <button onClick={() => setEditingName(false)} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-white">{context.user.name}</span>
                    <button onClick={() => setEditingName(true)} className="text-[10px] text-gray-500 hover:text-purple-400 cursor-pointer">edit</button>
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Role</label>
                {editingRole ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={roleValue}
                      onChange={(e) => setRoleValue(e.target.value)}
                      className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-purple-500/50"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRole()}
                    />
                    <button onClick={handleSaveRole} className="text-xs text-green-400 hover:text-green-300 cursor-pointer">✓</button>
                    <button onClick={() => setEditingRole(false)} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-white">{context.user.role}</span>
                    <button onClick={() => setEditingRole(true)} className="text-[10px] text-gray-500 hover:text-purple-400 cursor-pointer">edit</button>
                  </div>
                )}
              </div>

              {/* Interests */}
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Interests</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {context.user.interests.map((interest, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
                      {interest}
                      <button onClick={() => handleRemoveInterest(idx)} className="text-purple-400 hover:text-red-400 cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Add interest..."
                    className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-purple-500/50 placeholder-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                  />
                  <button onClick={handleAddInterest} className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer px-2">+</button>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Preferences</label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Work Hours</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0" max="23"
                        value={context.preferences.workHours.start}
                        onChange={(e) => handleWorkHoursChange('start', e.target.value)}
                        className="w-10 bg-gray-700/50 border border-gray-600/50 rounded px-1 py-0.5 text-xs text-white text-center outline-none"
                      />
                      <span className="text-gray-500 text-xs">to</span>
                      <input
                        type="number"
                        min="0" max="23"
                        value={context.preferences.workHours.end}
                        onChange={(e) => handleWorkHoursChange('end', e.target.value)}
                        className="w-10 bg-gray-700/50 border border-gray-600/50 rounded px-1 py-0.5 text-xs text-white text-center outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Break Reminders</span>
                    <button
                      onClick={() => handleTogglePreference('breakReminders')}
                      className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${context.preferences.breakReminders ? 'bg-green-500' : 'bg-gray-600'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform mx-0.5 ${context.preferences.breakReminders ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Focus Mode</span>
                    <button
                      onClick={() => handleTogglePreference('focusMode')}
                      className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${context.preferences.focusMode ? 'bg-green-500' : 'bg-gray-600'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform mx-0.5 ${context.preferences.focusMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Common Apps */}
              {context.user.commonApps.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Common Apps (auto-detected)</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {context.user.commonApps.map((app, idx) => (
                      <span key={idx} className="bg-blue-500/15 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-500/20">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              {projects.length === 0 && context.projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <span className="text-2xl block mb-2">📁</span>
                  No projects detected yet. I'll scan your folders soon!
                </div>
              ) : (
                [...projects, ...context.projects.filter((p) => !projects.find((pp) => pp.path === p.path))].map((proj, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-white font-medium">
                          {proj.name || proj.path.split(/[/\\]/).pop()}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[300px]">
                          {proj.path}
                        </div>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.techStack.map((tech, i) => (
                              <span key={i} className="bg-cyan-500/15 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/20">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {proj.lastModified && (
                          <div className="text-[10px] text-gray-600 mt-1">
                            Last modified: {new Date(proj.lastModified).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveProject(proj.path)}
                        className="text-gray-600 hover:text-red-400 text-xs cursor-pointer"
                        title="Forget this project"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <div className="space-y-4">
              {/* Insight */}
              {insight && (
                <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1">💡 Insight</div>
                  <div className="text-sm text-purple-200">{insight}</div>
                </div>
              )}

              {/* Activity Chart */}
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Activity by Hour</label>
                <div className="flex items-end gap-[2px] mt-3 h-16">
                  {getHourlyData().map((d) => (
                    <div key={d.hour} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max(2, d.normalized * 100)}%`,
                          backgroundColor: d.value > 0
                            ? `rgba(168, 85, 247, ${0.3 + d.normalized * 0.7})`
                            : 'rgba(107, 114, 128, 0.2)',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] text-gray-600">0:00</span>
                  <span className="text-[8px] text-gray-600">6:00</span>
                  <span className="text-[8px] text-gray-600">12:00</span>
                  <span className="text-[8px] text-gray-600">18:00</span>
                  <span className="text-[8px] text-gray-600">23:00</span>
                </div>
              </div>

              {/* Daily Stats */}
              <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Today</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <div className="text-lg text-white font-bold">{dailyStats.totalSessions}</div>
                    <div className="text-[10px] text-gray-500">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-white font-bold">{dailyStats.topApp || '-'}</div>
                    <div className="text-[10px] text-gray-500">Top App</div>
                  </div>
                </div>
                {dailyStats.categories && Object.keys(dailyStats.categories).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(dailyStats.categories).map(([cat, count]) => (
                      <span key={cat} className="bg-gray-700/50 text-gray-300 text-[10px] px-2 py-0.5 rounded-full">
                        {cat}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Sequences */}
              {patterns.appSequences && patterns.appSequences.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Common Workflows</label>
                  <div className="space-y-1.5 mt-2">
                    {patterns.appSequences.slice(0, 5).map((seq, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-300">{seq.from}</span>
                        <span className="text-gray-600">→</span>
                        <span className="text-gray-300">{seq.to}</span>
                        <span className="text-gray-600 ml-auto">×{seq.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {/* Add note */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note for your pet to remember..."
                  className="flex-1 bg-gray-800/50 border border-gray-700/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50 placeholder-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  className="bg-purple-500/20 text-purple-300 px-3 py-2 rounded-xl text-xs hover:bg-purple-500/30 cursor-pointer border border-purple-500/30"
                >
                  Add
                </button>
              </div>

              {/* Notes list */}
              {context.notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <span className="text-2xl block mb-2">📝</span>
                  No notes yet. Add things you want your pet to remember!
                </div>
              ) : (
                [...context.notes].reverse().map((note) => (
                  <div key={note.id} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 group">
                    <div className="flex items-start justify-between">
                      <div className="text-xs text-gray-200 flex-1">{note.text}</div>
                      <button
                        onClick={() => handleRemoveNote(note.id)}
                        className="text-gray-600 hover:text-red-400 text-[10px] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        title="Forget this"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1">
                      {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-800/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">All data stays local on your device</span>
          <button
            onClick={() => {
              if (confirm('Clear all pet knowledge? This cannot be undone.')) {
                localStorage.removeItem('petdesk-context');
                localStorage.removeItem('petdesk-patterns');
                localStorage.removeItem('petdesk-file-awareness');
                setContext(getPetContext());
                setPatterns(getPatterns());
                setProjects([]);
              }
            }}
            className="text-[10px] text-red-400/60 hover:text-red-400 cursor-pointer"
          >
            Forget Everything
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PetKnowledge;
