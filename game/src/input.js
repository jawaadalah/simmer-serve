// Mouse and keyboard input: clicks on stations, keys 1-6 to grab an
// ingredient from the counter, Space/Enter to serve, P to pause.
import { INGREDIENTS } from './config.js';

export const ACTION_PAUSE = 'pause';
export const ACTION_SERVE = 'serve';

const KEYS = Object.keys(INGREDIENTS);

export function createInput(canvas, world) {
  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event);
    world.clickAt(point.x, point.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const index = Number.parseInt(event.key, 10) - 1;
    if (index >= 0 && index < KEYS.length) {
      world.pickIngredient(KEYS[index]);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      world.clickServe();
    }
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      if (world.state.screen === 'play') world.state.screen = 'paused';
      else if (world.state.screen === 'paused') world.state.screen = 'play';
    }
  });
}
