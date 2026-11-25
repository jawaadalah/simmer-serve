// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (grab what the oldest ticket needs next, chop it,
// cook it, plate it, serve it), so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { matchRecipe } from './recipes.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 55;
const RUSH_SECONDS = 118;
const END_LIMIT_SECONDS = 400;
const SAMPLE = 1 / 30;

/** The next useful click for the oldest live ticket, as a world action. */
function autopilot(world) {
  const s = world.state;
  if (s.screen !== 'play') return null;
  const live = s.orders.filter((o) => !o.served && !o.expired);
  if (!live.length) return null;
  const oldest = live[0];
  // The plate already completes some ticket: serve it.
  if (matchRecipe(s.plate)) return () => world.clickServe();
  const missing = oldest.recipe.needs.filter((item) => !s.plate.includes(item));
  if (!missing.length) return () => world.clickServe();
  const next = missing[0];
  const kind = next.replace('chopped ', '').replace('cooked ', '');
  // Holding the finished piece: put it on the plate.
  if (s.hand && s.hand.prepared === next) return () => world.clickPlate();
  // A cooked item is waiting in the pot: take it out (the hand bins it
  // on the next tick when the ticket does not need it).
  if (s.pot.item && s.pot.done) return () => world.clickStove();
  // Something is cooking: wait for it.
  if (s.pot.item && !s.pot.done) return null;
  // Holding something that is not the next need: keep it only when the
  // hand's own kind, once prepared, is exactly what the ticket wants.
  if (s.hand && s.hand.prepared !== next) {
    if (s.hand.step === 'chop' && s.hand.kind === kind) return () => world.clickBoard();
    if (s.hand.step === 'cook' && s.hand.kind === kind) return () => world.clickStove();
    return () => world.clickBin();
  }
  // Chopping in progress: keep chopping.
  if (s.board.item) return () => world.clickBoard();
  // Holding a raw vegetable the ticket needs chopped: put it on the board.
  if (s.hand && s.hand.step === 'chop') return () => world.clickBoard();
  // Holding a cookable item: put it in the pot.
  if (s.hand && s.hand.step === 'cook') return () => world.clickStove();
  // Nothing in hand: grab the next ingredient.
  return () => world.pickIngredient(kind);
}

/** Advance the world `seconds` forward. `pace` is the seconds between the
 *  autopilot's actions: 0 plays at full speed, 0.5 plays at a human pace,
 *  so orders pile up on the board and dishes sit mid-assembly for a while.
 */
function playForward(world, seconds, pace = 0) {
  let t = 0;
  let sinceAction = pace;
  while (t < seconds) {
    sinceAction += SAMPLE;
    if (sinceAction >= pace) {
      const action = autopilot(world);
      if (action) action();
      sinceAction = 0;
    }
    world.step(SAMPLE);
    t += SAMPLE;
    if (world.state.screen === 'over') break;
  }
}

/**
 * Play forward until the kitchen shows a dish mid-assembly (something on
 * the plate, tickets live on the board, the hand busy) or the time is up:
 * the cover shot must show a complete game, not an empty moment between
 * dishes.
 */
function playUntilBusy(world, maxSeconds, pace = 0.5) {
  let t = 0;
  let sinceAction = pace;
  while (t < maxSeconds) {
    sinceAction += SAMPLE;
    if (sinceAction >= pace) {
      const action = autopilot(world);
      if (action) action();
      sinceAction = 0;
    }
    world.step(SAMPLE);
    t += SAMPLE;
    const s = world.state;
    if (s.screen === 'over') break;
    const live = s.orders.filter((o) => !o.served && !o.expired).length;
    if (s.plate.length > 0 && live >= 1 && (s.hand || s.board.item || s.pot.item)) break;
  }
}

/**
 * Set `world` to the named scene (start, play, rush or end; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    world.start();
    playForward(world, START_SECONDS);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.start();
  if (name === 'play') {
    playForward(world, 12, 0.5);
    playUntilBusy(world, PLAY_SECONDS, 0.5);
    const over = world.state.screen === 'over';
    return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.coins };
  }
  if (name === 'rush') {
    playForward(world, 100, 0.5);
    playUntilBusy(world, 40, 0.5);
    const over = world.state.screen === 'over';
    return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.coins };
  }
  const limit = END_LIMIT_SECONDS;
  playForward(world, limit);
  const over = world.state.screen === 'over';
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.coins };
}
