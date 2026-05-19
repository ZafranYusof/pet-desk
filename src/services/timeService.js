/**
 * Day/Night cycle service based on real system clock.
 * No API needed - purely time-based.
 */

/**
 * Get current time of day period.
 * @returns {'morning' | 'afternoon' | 'evening' | 'night'}
 */
export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Get mood/behavior modifier based on time of day.
 * Affects energy decay, happiness, and walk speed.
 * @returns {{ energyDecayMultiplier: number, happinessBonus: number, walkSpeedMultiplier: number, label: string }}
 */
export function getTimeMoodModifier() {
  const time = getTimeOfDay();
  switch (time) {
    case 'morning':
      return {
        energyDecayMultiplier: 0.7, // slower energy decay
        happinessBonus: 0.2,
        walkSpeedMultiplier: 1.3, // more energetic
        label: 'Energetic',
      };
    case 'afternoon':
      return {
        energyDecayMultiplier: 1.0,
        happinessBonus: 0,
        walkSpeedMultiplier: 1.0,
        label: 'Normal',
      };
    case 'evening':
      return {
        energyDecayMultiplier: 1.2,
        happinessBonus: -0.1,
        walkSpeedMultiplier: 0.8,
        label: 'Drowsy',
      };
    case 'night':
      return {
        energyDecayMultiplier: 1.5,
        happinessBonus: -0.2,
        walkSpeedMultiplier: 0.5, // very slow at night
        label: 'Sleepy',
      };
    default:
      return {
        energyDecayMultiplier: 1.0,
        happinessBonus: 0,
        walkSpeedMultiplier: 1.0,
        label: 'Normal',
      };
  }
}

/**
 * Check if pet should auto-sleep (after 11pm).
 * @returns {boolean}
 */
export function shouldAutoSleep() {
  const hour = new Date().getHours();
  return hour >= 23 || hour < 5;
}
