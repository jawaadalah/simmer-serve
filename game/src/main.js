// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens:
// title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURNED, EVENT_CHOP, EVENT_COOK, EVENT_OVER, EVENT_PICK, EVENT_SERVED, EVENT_WRONG } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
createInput(canvas, world);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit.
  }
}

function soundFor(events) {
  if (events & EVENT_SERVED) audio.serve();
  else if (events & EVENT_WRONG) audio.wrong();
  else if (events & EVENT_BURNED) audio.wrong();
  else if (events & EVENT_CHOP) audio.chop();
  else if (events & EVENT_COOK) audio.cook();
  else if (events & EVENT_PICK) audio.pick();
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) {
  runShot(shot);
} else {
  let best = readBest();
  let last = performance.now();
  let accumulator = 0;
  status.textContent = 'Simmer & Serve: chop, cook, plate and serve before the tickets expire.';

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = world.step(STEP);
      soundFor(events);
      if (events & EVENT_OVER) {
        if (world.state.coins > best) { best = world.state.coins; saveBest(best); }
        status.textContent = `Shift over: ${world.state.coins} coins, ${world.state.served} dishes served.`;
      }
    }
    renderer.draw(world.state, world.state.screen, best);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
