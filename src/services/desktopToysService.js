/**
 * PetDesk - Desktop Toys Service
 * Chase Mouse, React to Windows, Cursor Play behaviors.
 */

const DESKTOP_TOYS_KEY = 'petdesk_desktop_toys';

const DEFAULT_SETTINGS = {
  chaseMouse: false,
  cursorPlay: true,
  reactToWindows: true,
};

/**
 * Load desktop toys settings
 */
export function getDesktopToysSettings() {
  try {
    const stored = localStorage.getItem(DESKTOP_TOYS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save desktop toys settings
 */
export function saveDesktopToysSettings(settings) {
  try {
    localStorage.setItem(DESKTOP_TOYS_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

/**
 * Calculate chase target position based on mouse position.
 * Pet follows at a distance, like a cat watching.
 * @param {object} mousePos - { x, y }
 * @param {object} petPos - { x, y }
 * @param {object} screenSize - { width, height }
 * @returns {object} { x, y, lookDirection, excited }
 */
export function calculateChaseTarget(mousePos, petPos, screenSize) {
  if (!mousePos || !petPos) return null;

  const dx = mousePos.x - petPos.x;
  const dy = mousePos.y - petPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Determine look direction
  const lookDirection = dx > 0 ? 'right' : 'left';

  // If mouse is very close (< 80px), pet backs away slightly
  if (distance < 80) {
    return {
      x: petPos.x - (dx * 0.3),
      y: petPos.y - (dy * 0.3),
      lookDirection,
      excited: false,
      tooClose: true,
    };
  }

  // Follow at a distance (keep ~150px away)
  const followDistance = 150;
  if (distance > followDistance) {
    const ratio = (distance - followDistance) / distance;
    return {
      x: petPos.x + dx * ratio * 0.05, // Slow follow
      y: petPos.y + dy * ratio * 0.05,
      lookDirection,
      excited: false,
      tooClose: false,
    };
  }

  // Within comfortable range, just look toward cursor
  return {
    x: petPos.x,
    y: petPos.y,
    lookDirection,
    excited: false,
    tooClose: false,
  };
}

/**
 * Determine if pet should approach (cursor still for 3s)
 * @param {number} stillDuration - ms cursor has been still
 * @param {object} mousePos - { x, y }
 * @param {object} petPos - { x, y }
 * @returns {object|null} approach target or null
 */
export function shouldApproach(stillDuration, mousePos, petPos) {
  if (!mousePos || !petPos) return null;
  if (stillDuration < 3000) return null;

  const dx = mousePos.x - petPos.x;
  const dy = mousePos.y - petPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Only approach if far enough away
  if (distance < 100) return null;

  // Move toward cursor slowly
  const ratio = 0.02;
  return {
    x: petPos.x + dx * ratio,
    y: petPos.y + dy * ratio,
    approaching: true,
  };
}

/**
 * Detect fast mouse movement (pet gets excited)
 * @param {object[]} recentPositions - array of { x, y, t } recent mouse positions
 * @returns {boolean} whether mouse is moving fast
 */
export function detectFastMovement(recentPositions) {
  if (!recentPositions || recentPositions.length < 3) return false;

  const last = recentPositions[recentPositions.length - 1];
  const prev = recentPositions[recentPositions.length - 3];

  if (!last || !prev) return false;

  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const dt = last.t - prev.t;

  if (dt === 0) return false;

  const speed = Math.sqrt(dx * dx + dy * dy) / dt; // pixels per ms
  return speed > 2; // threshold for "fast"
}

/**
 * Get cursor play action (pet occasionally "bats" at cursor)
 * @param {object} mousePos - { x, y }
 * @param {object} petPos - { x, y }
 * @returns {object|null} play action or null
 */
export function getCursorPlayAction(mousePos, petPos) {
  if (!mousePos || !petPos) return null;

  const dx = mousePos.x - petPos.x;
  const dy = mousePos.y - petPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Only play if cursor is within range (100-200px)
  if (distance < 100 || distance > 200) return null;

  // Random chance to bat at cursor
  if (Math.random() > 0.02) return null; // 2% chance per check

  return {
    type: 'bat',
    targetX: mousePos.x + (Math.random() - 0.5) * 30,
    targetY: mousePos.y + (Math.random() - 0.5) * 30,
    direction: dx > 0 ? 'right' : 'left',
  };
}

/**
 * Get look direction toward a point
 * @param {object} petPos - { x, y }
 * @param {object} targetPos - { x, y }
 * @returns {string} 'left' or 'right'
 */
export function getLookDirection(petPos, targetPos) {
  if (!petPos || !targetPos) return 'right';
  return targetPos.x > petPos.x ? 'right' : 'left';
}
