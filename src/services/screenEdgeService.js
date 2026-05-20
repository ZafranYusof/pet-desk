/**
 * PetDesk - Screen Edge Awareness Service
 * Pet reacts when near screen edges.
 */

const EDGE_THRESHOLD = 50; // pixels from edge to trigger reaction

/**
 * Detect which edge the pet is near
 * @param {object} position - { x, y } pet position
 * @param {object} screenSize - { width, height }
 * @returns {object|null} edge reaction data
 */
export function detectEdge(position, screenSize) {
  if (!position || !screenSize) return null;

  const { x, y } = position;
  const { width, height } = screenSize;

  // Near bottom (taskbar area)
  if (y > height - EDGE_THRESHOLD) {
    return {
      edge: 'bottom',
      reaction: 'sit',
      message: '*sits down on the taskbar*',
      spriteModifier: 'sitting',
      offsetY: -5,
    };
  }

  // Near top
  if (y < EDGE_THRESHOLD) {
    return {
      edge: 'top',
      reaction: 'lookUp',
      message: '*looks up confused*',
      spriteModifier: 'lookingUp',
      offsetY: 5,
    };
  }

  // Near left edge
  if (x < EDGE_THRESHOLD) {
    return {
      edge: 'left',
      reaction: 'lean',
      message: '*leans against the edge*',
      spriteModifier: 'leanLeft',
      offsetX: 5,
      flipX: false,
    };
  }

  // Near right edge
  if (x > width - EDGE_THRESHOLD) {
    return {
      edge: 'right',
      reaction: 'lean',
      message: '*leans against the edge*',
      spriteModifier: 'leanRight',
      offsetX: -5,
      flipX: true,
    };
  }

  return null;
}

/**
 * Get CSS transform for edge reaction
 */
export function getEdgeTransform(edgeReaction) {
  if (!edgeReaction) return {};

  switch (edgeReaction.edge) {
    case 'bottom':
      return {
        transform: 'scaleY(0.8) translateY(4px)',
        transition: 'transform 0.3s ease',
      };
    case 'top':
      return {
        transform: 'rotate(-5deg) translateY(-2px)',
        transition: 'transform 0.3s ease',
      };
    case 'left':
      return {
        transform: 'rotate(8deg) translateX(3px)',
        transition: 'transform 0.3s ease',
      };
    case 'right':
      return {
        transform: 'rotate(-8deg) translateX(-3px)',
        transition: 'transform 0.3s ease',
      };
    default:
      return {};
  }
}

/**
 * Should the pet bounce back from edge?
 */
export function shouldBounceBack(position, screenSize) {
  if (!position || !screenSize) return null;

  const { x, y } = position;
  const { width, height } = screenSize;
  const BOUNCE_THRESHOLD = 20;

  if (x < BOUNCE_THRESHOLD) return { x: BOUNCE_THRESHOLD + 30, y };
  if (x > width - BOUNCE_THRESHOLD) return { x: width - BOUNCE_THRESHOLD - 30, y };
  if (y < BOUNCE_THRESHOLD) return { x, y: BOUNCE_THRESHOLD + 30 };
  if (y > height - BOUNCE_THRESHOLD) return { x, y: height - BOUNCE_THRESHOLD - 30 };

  return null;
}
