/**
 * PetDesk - File Awareness Service
 * Scans user's key folders to detect projects, new files, and track file activity.
 * Uses Electron IPC for file system access.
 */

const FILE_AWARENESS_KEY = 'petdesk-file-awareness';
const SCAN_INTERVAL = 30 * 60 * 1000; // 30 minutes

let scanTimer = null;
let initialScanTimeout = null;
let lastScanTime = 0;

/**
 * Get stored file awareness data.
 */
function getStoredData() {
  try {
    const stored = localStorage.getItem(FILE_AWARENESS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    projects: [],        // [{ name, path, lastModified, techStack, lastSeen }]
    desktopFiles: [],    // [{ name, path, size, modified, isNew }]
    recentFiles: [],     // [{ name, path, modified }]
    lastScan: 0,
  };
}

/**
 * Save file awareness data.
 */
function saveData(data) {
  try {
    localStorage.setItem(FILE_AWARENESS_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

/**
 * Detect tech stack from project indicators.
 */
function detectTechStack(files) {
  const stack = [];
  const fileNames = files.map((f) => (typeof f === 'string' ? f : f.name || '').toLowerCase());

  if (fileNames.includes('package.json')) stack.push('Node.js');
  if (fileNames.includes('tsconfig.json')) stack.push('TypeScript');
  if (fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) stack.push('Vite');
  if (fileNames.includes('next.config.js') || fileNames.includes('next.config.mjs')) stack.push('Next.js');
  if (fileNames.includes('pubspec.yaml')) stack.push('Flutter');
  if (fileNames.includes('cargo.toml')) stack.push('Rust');
  if (fileNames.includes('pom.xml')) stack.push('Java/Maven');
  if (fileNames.includes('build.gradle')) stack.push('Gradle');
  if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py')) stack.push('Python');
  if (fileNames.includes('go.mod')) stack.push('Go');
  if (fileNames.includes('composer.json')) stack.push('PHP');
  if (fileNames.includes('.csproj') || fileNames.some((f) => f.endsWith('.csproj'))) stack.push('C#/.NET');
  if (fileNames.includes('tailwind.config.js') || fileNames.includes('tailwind.config.ts')) stack.push('Tailwind');
  if (fileNames.includes('docker-compose.yml') || fileNames.includes('dockerfile')) stack.push('Docker');

  return stack;
}

/**
 * Scan desktop folder via IPC.
 */
async function scanDesktop() {
  if (!window.electronAPI?.scanDesktop) return [];
  try {
    const files = await window.electronAPI.scanDesktop();
    return files || [];
  } catch (e) {
    return [];
  }
}

/**
 * Scan for projects via IPC.
 */
async function scanProjects() {
  if (!window.electronAPI?.scanProjects) return [];
  try {
    const projects = await window.electronAPI.scanProjects();
    return projects || [];
  } catch (e) {
    return [];
  }
}

/**
 * Get recent files via IPC.
 */
async function getRecentFilesFromSystem() {
  if (!window.electronAPI?.getRecentFiles) return [];
  try {
    const files = await window.electronAPI.getRecentFiles();
    return files || [];
  } catch (e) {
    return [];
  }
}

/**
 * Perform a full scan of the file system.
 * Called on startup and every 30 minutes.
 */
export async function performScan() {
  const now = Date.now();
  // Don't scan more than once every 5 minutes
  if (now - lastScanTime < 5 * 60 * 1000) return getStoredData();
  lastScanTime = now;

  const data = getStoredData();
  const previousDesktopFiles = data.desktopFiles.map((f) => f.name);

  // Scan desktop
  const desktopFiles = await scanDesktop();
  data.desktopFiles = desktopFiles.map((f) => ({
    ...f,
    isNew: !previousDesktopFiles.includes(f.name),
  }));

  // Scan projects
  const projects = await scanProjects();
  if (projects.length > 0) {
    // Merge with existing (keep manual additions)
    const existingPaths = new Set(data.projects.map((p) => p.path));
    projects.forEach((proj) => {
      if (existingPaths.has(proj.path)) {
        // Update existing
        const idx = data.projects.findIndex((p) => p.path === proj.path);
        if (idx >= 0) {
          data.projects[idx] = { ...data.projects[idx], ...proj, lastSeen: now };
        }
      } else {
        data.projects.push({ ...proj, lastSeen: now, detectedAt: now });
      }
    });
  }

  // Get recent files
  const recentFiles = await getRecentFilesFromSystem();
  data.recentFiles = recentFiles.slice(0, 20);

  data.lastScan = now;
  saveData(data);
  return data;
}

/**
 * Start periodic file scanning.
 */
export function startFileAwareness() {
  // Initial scan after 5 seconds (let app settle)
  if (initialScanTimeout) clearTimeout(initialScanTimeout);
  initialScanTimeout = setTimeout(() => {
    performScan();
    initialScanTimeout = null;
  }, 5000);

  // Periodic scan every 30 minutes
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = setInterval(() => {
    performScan();
  }, SCAN_INTERVAL);
}

/**
 * Stop periodic scanning.
 */
export function stopFileAwareness() {
  if (initialScanTimeout) {
    clearTimeout(initialScanTimeout);
    initialScanTimeout = null;
  }
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
}

/**
 * Get known projects.
 */
export function getKnownProjects() {
  const data = getStoredData();
  return data.projects;
}

/**
 * Get new desktop files (detected since last scan).
 */
export function getNewDesktopFiles() {
  const data = getStoredData();
  return data.desktopFiles.filter((f) => f.isNew);
}

/**
 * Get all desktop files.
 */
export function getDesktopFiles() {
  const data = getStoredData();
  return data.desktopFiles;
}

/**
 * Get recent files.
 */
export function getRecentFiles() {
  const data = getStoredData();
  return data.recentFiles;
}

/**
 * Get projects not touched in X days.
 */
export function getStaleProjects(days = 3) {
  const data = getStoredData();
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return data.projects.filter((p) => {
    const lastMod = p.lastModified || p.lastSeen || 0;
    return lastMod < threshold;
  });
}

/**
 * Get file awareness summary for AI context.
 */
export function getFileAwarenessSummary() {
  const data = getStoredData();
  const parts = [];

  if (data.projects.length > 0) {
    const projectList = data.projects.slice(0, 5).map((p) => {
      const name = p.name || p.path.split(/[/\\]/).pop();
      const stack = p.techStack ? ` (${p.techStack.join(', ')})` : '';
      return `${name}${stack}`;
    });
    parts.push(`Known projects: ${projectList.join(', ')}`);
  }

  const newFiles = data.desktopFiles.filter((f) => f.isNew);
  if (newFiles.length > 0) {
    parts.push(`New desktop files: ${newFiles.slice(0, 3).map((f) => f.name).join(', ')}`);
  }

  if (data.recentFiles.length > 0) {
    parts.push(`Recently modified: ${data.recentFiles.slice(0, 3).map((f) => f.name).join(', ')}`);
  }

  const stale = getStaleProjects(3);
  if (stale.length > 0) {
    parts.push(`Untouched projects (3+ days): ${stale.slice(0, 2).map((p) => p.name || p.path.split(/[/\\]/).pop()).join(', ')}`);
  }

  return parts.join('\n') || 'No file data yet';
}

/**
 * Get a random file-related insight the pet can say.
 */
export function getFileInsight() {
  const data = getStoredData();
  const insights = [];

  // New desktop files
  const newFiles = data.desktopFiles.filter((f) => f.isNew);
  if (newFiles.length > 0) {
    const file = newFiles[0];
    insights.push(`New file on desktop: ${file.name}`);
  }

  // Stale projects
  const stale = getStaleProjects(3);
  if (stale.length > 0) {
    const proj = stale[Math.floor(Math.random() * stale.length)];
    const name = proj.name || proj.path.split(/[/\\]/).pop();
    const days = Math.floor((Date.now() - (proj.lastModified || proj.lastSeen)) / 86400000);
    insights.push(`You haven't touched ${name} in ${days} days`);
  }

  // Recent project activity
  const recentProjects = data.projects
    .filter((p) => p.lastModified && Date.now() - p.lastModified < 24 * 60 * 60 * 1000)
    .slice(0, 3);
  if (recentProjects.length > 0) {
    const proj = recentProjects[0];
    const name = proj.name || proj.path.split(/[/\\]/).pop();
    insights.push(`I see you've been working on ${name} recently`);
  }

  if (insights.length === 0) return null;
  return insights[Math.floor(Math.random() * insights.length)];
}
