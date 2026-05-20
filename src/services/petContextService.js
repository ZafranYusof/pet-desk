/**
 * PetDesk - Pet Context Service
 * Manages the pet's knowledge about the user, their projects, workflows, and preferences.
 * All data stored in localStorage for privacy.
 */

const PET_CONTEXT_KEY = 'petdesk-context';

const DEFAULT_CONTEXT = {
  user: {
    name: 'User',
    role: 'developer',
    interests: [],
    commonApps: [],
  },
  projects: [],
  workflows: [],
  preferences: {
    workHours: { start: 9, end: 17 },
    breakReminders: true,
    focusMode: false,
  },
  notes: [],
};

/**
 * Get the full pet context from localStorage.
 */
export function getPetContext() {
  try {
    const stored = localStorage.getItem(PET_CONTEXT_KEY);
    if (stored) {
      return { ...DEFAULT_CONTEXT, ...JSON.parse(stored) };
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_CONTEXT };
}

/**
 * Update pet context with partial updates (deep merge top-level keys).
 */
export function updatePetContext(updates) {
  try {
    const current = getPetContext();
    const merged = { ...current };

    for (const key of Object.keys(updates)) {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
        merged[key] = { ...(current[key] || {}), ...updates[key] };
      } else {
        merged[key] = updates[key];
      }
    }

    localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) { /* ignore */ }
  return getPetContext();
}

/**
 * Add a project to the pet's knowledge.
 */
export function addProject(project) {
  try {
    const ctx = getPetContext();
    // Avoid duplicates by path
    const existing = ctx.projects.findIndex((p) => p.path === project.path);
    if (existing >= 0) {
      ctx.projects[existing] = { ...ctx.projects[existing], ...project, lastSeen: Date.now() };
    } else {
      ctx.projects.push({ ...project, addedAt: Date.now(), lastSeen: Date.now() });
    }
    localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(ctx));
    return ctx;
  } catch (e) { /* ignore */ }
  return getPetContext();
}

/**
 * Remove a project by path.
 */
export function removeProject(path) {
  try {
    const ctx = getPetContext();
    ctx.projects = ctx.projects.filter((p) => p.path !== path);
    localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(ctx));
    return ctx;
  } catch (e) { /* ignore */ }
  return getPetContext();
}

/**
 * Add a note (pet observation or user note).
 */
export function addNote(note) {
  try {
    const ctx = getPetContext();
    ctx.notes.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: note,
      createdAt: Date.now(),
    });
    // Keep max 50 notes
    if (ctx.notes.length > 50) {
      ctx.notes = ctx.notes.slice(-50);
    }
    localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(ctx));
    return ctx;
  } catch (e) { /* ignore */ }
  return getPetContext();
}

/**
 * Remove a note by id.
 */
export function removeNote(noteId) {
  try {
    const ctx = getPetContext();
    ctx.notes = ctx.notes.filter((n) => n.id !== noteId);
    localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(ctx));
    return ctx;
  } catch (e) { /* ignore */ }
  return getPetContext();
}

/**
 * Update user profile fields.
 */
export function updateUserProfile(profileUpdates) {
  return updatePetContext({ user: profileUpdates });
}

/**
 * Update preferences.
 */
export function updatePreferences(prefUpdates) {
  return updatePetContext({ preferences: prefUpdates });
}

/**
 * Add an app to commonApps if not already there.
 */
export function trackCommonApp(appName) {
  try {
    const ctx = getPetContext();
    if (!ctx.user.commonApps.includes(appName)) {
      ctx.user.commonApps.push(appName);
      // Keep max 20
      if (ctx.user.commonApps.length > 20) {
        ctx.user.commonApps = ctx.user.commonApps.slice(-20);
      }
      localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(ctx));
    }
    return ctx;
  } catch (e) { /* ignore */ }
  return getPetContext();
}

/**
 * Clear all pet context (forget everything).
 */
export function clearPetContext() {
  try {
    localStorage.setItem(PET_CONTEXT_KEY, JSON.stringify(DEFAULT_CONTEXT));
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_CONTEXT };
}

/**
 * Get a summary string of the context for AI prompts.
 */
export function getContextSummary() {
  const ctx = getPetContext();
  const parts = [];

  if (ctx.user.name && ctx.user.name !== 'User') {
    parts.push(`Owner: ${ctx.user.name} (${ctx.user.role})`);
  }
  if (ctx.user.interests.length > 0) {
    parts.push(`Interests: ${ctx.user.interests.join(', ')}`);
  }
  if (ctx.user.commonApps.length > 0) {
    parts.push(`Common apps: ${ctx.user.commonApps.slice(0, 5).join(', ')}`);
  }
  if (ctx.projects.length > 0) {
    const projectNames = ctx.projects.slice(0, 5).map((p) => p.name || p.path.split(/[/\\]/).pop());
    parts.push(`Known projects: ${projectNames.join(', ')}`);
  }
  if (ctx.preferences.focusMode) {
    parts.push('Focus mode: ON');
  }
  const hour = new Date().getHours();
  const isWorkHours = hour >= ctx.preferences.workHours.start && hour < ctx.preferences.workHours.end;
  parts.push(`Work hours: ${isWorkHours ? 'yes' : 'no'} (${ctx.preferences.workHours.start}:00-${ctx.preferences.workHours.end}:00)`);

  if (ctx.notes.length > 0) {
    const recentNotes = ctx.notes.slice(-3).map((n) => n.text);
    parts.push(`Recent notes: ${recentNotes.join('; ')}`);
  }

  return parts.join('\n');
}
