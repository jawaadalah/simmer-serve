// The game's rules and state, with no drawing and no browser in it: the
// hand, the chopping board, the stove pot, the plate, the order board, the
// shift timer and the coins. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react without the world knowing
// about screens or sound.
//
// Flow: click an ingredient on the counter to hold it. Click the board with
// a raw vegetable to chop it (3 clicks); click the stove with a chopped item
// or raw pasta to cook it; click the plate to put a ready item on it. Click
// SERVE when the plate matches a ticket. Click the bin to throw the hand away.
import {
  BURN_AFTER, CHOPS_NEEDED, COOK_SECONDS, INGREDIENTS, LAYOUT,
  RUSH_SECONDS, SHIFT_SECONDS, STARS,
} from './config.js';
import { boardHasRoom, matchRecipe, newOrder, orderInterval, serveValue } from './recipes.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_BURNED = 4;
export const EVENT_OVER = 8;
export const EVENT_CHOP = 16;
export const EVENT_COOK = 32;
export const EVENT_WRONG = 64;
export const EVENT_PICK = 128;

export const HAND_EMPTY = null;

/** A prepared item: 'chopped tomato', 'cooked pasta', 'cheese', ... */
export function preparedName(kind, step) {
  if (step === 'chop') return `chopped ${kind}`;
  if (step === 'cook') return `cooked ${kind}`;
  return kind;
}

/** What the hand holds after picking an ingredient, or null. */
export function handLabel(hand) {
  return hand ? hand.label : 'empty hands';
}

export function createWorld(random) {
  const state = {
    screen: 'title',
    elapsed: 0,
    coins: 0,
    served: 0,
    expiredCount: 0,
    orders: [],
    orderTimer: 4,
    hand: HAND_EMPTY,
    board: { item: null, chops: 0 },
    pot: { item: null, progress: 0, done: false, burn: 0 },
    plate: [],
    flash: '',
    flashTime: 0,
    best: 0,
  };

  function reset() {
    state.screen = 'title';
    state.elapsed = 0;
    state.coins = 0;
    state.served = 0;
    state.expiredCount = 0;
    state.orders = [];
    state.orderTimer = 4;
    state.hand = HAND_EMPTY;
    state.board = { item: null, chops: 0 };
    state.pot = { item: null, progress: 0, done: false, burn: 0 };
    state.plate = [];
    state.flash = '';
    state.flashTime = 0;
  }

  function start() {
    reset();
    state.screen = 'play';
    state.orders.push(newOrder(random));
    state.orders.push(newOrder(random));
  }

  function rush() {
    return state.elapsed > SHIFT_SECONDS - RUSH_SECONDS;
  }

  function timeLeft() {
    return Math.max(0, SHIFT_SECONDS - state.elapsed);
  }

  function stars() {
    let n = 0;
    for (const bar of STARS) if (state.coins >= bar) n += 1;
    return n;
  }

  function pickIngredient(kind) {
    if (state.screen !== 'play') return 0;
    if (state.hand) return 0;
    const def = INGREDIENTS[kind];
    if (!def) return 0;
    // Raw until prepared: a picked pasta is 'pasta', not 'cooked pasta'.
    state.hand = { kind, label: kind, step: def.step, prepared: kind };
    return EVENT_PICK;
  }

  function clickBoard() {
    if (state.screen !== 'play') return 0;
    // Chopping in progress: one more chop.
    if (state.board.item) {
      state.board.chops += 1;
      if (state.board.chops >= CHOPS_NEEDED) {
        const done = state.board.item;
        state.board = { item: null, chops: 0 };
        // The board hands back a CHOPPED item, not the raw one it took in.
        state.hand = { kind: done.kind, label: done.label, step: 'plate', prepared: preparedName(done.kind, 'chop') };
        return EVENT_CHOP;
      }
      return EVENT_CHOP;
    }
    // Put a raw vegetable on the board.
    if (state.hand && state.hand.step === 'chop') {
      state.board = { item: state.hand, chops: 0 };
      state.hand = HAND_EMPTY;
      return EVENT_CHOP;
    }
    return 0;
  }

  function clickStove() {
    if (state.screen !== 'play') return 0;
    // Take a finished dish out of the pot (hands must be empty first).
    if (state.pot.item && state.pot.done && !state.hand) {
      state.hand = { kind: state.pot.item.kind, label: state.pot.item.label, step: 'plate', prepared: state.pot.item.prepared };
      state.pot = { item: null, progress: 0, done: false, burn: 0 };
      return EVENT_COOK;
    }
    // Put something cookable in the pot (raw pasta only: chopped food is
    // plated as it is, never cooked).
    if (!state.pot.item && state.hand && state.hand.step === 'cook') {
      const item = state.hand;
      state.pot = { item: { ...item, prepared: preparedName(item.kind, 'cook') }, progress: 0, done: false, burn: 0 };
      state.hand = HAND_EMPTY;
      return EVENT_COOK;
    }
    return 0;
  }

  function clickPlate() {
    if (state.screen !== 'play') return 0;
    if (!state.hand || state.hand.step !== 'plate') return 0;
    if (state.plate.length >= 3) return 0;
    state.plate.push(state.hand.prepared);
    state.hand = HAND_EMPTY;
    return EVENT_PICK;
  }

  function clickBin() {
    if (state.screen !== 'play') return 0;
    if (state.hand) { state.hand = HAND_EMPTY; return EVENT_PICK; }
    if (state.plate.length) { state.plate = []; return EVENT_PICK; }
    return 0;
  }

  function clickServe() {
    if (state.screen !== 'play') return 0;
    const recipe = matchRecipe(state.plate);
    if (!recipe) {
      state.flash = state.plate.length ? 'No ticket wants this plate!' : 'Plate is empty!';
      state.flashTime = 1.5;
      return EVENT_WRONG;
    }
    const ticket = state.orders.find((o) => !o.served && !o.expired && o.recipe.id === recipe.id);
    if (!ticket) {
      state.flash = 'No ticket for that dish right now!';
      state.flashTime = 1.5;
      return EVENT_WRONG;
    }
    const value = serveValue(recipe, ticket.timeLeft, rush());
    state.coins += value.coins;
    state.served += 1;
    ticket.served = true;
    state.plate = [];
    state.flash = `Served ${recipe.name}! +${value.coins} coins${value.tip ? ` (tip ${value.tip})` : ''}`;
    state.flashTime = 2;
    return EVENT_SERVED;
  }

  function clickAt(x, y) {
    const inBox = (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    if (state.screen === 'title' || state.screen === 'over') { start(); return EVENT_CHOP; }
    if (state.screen !== 'play') return 0;
    if (inBox(LAYOUT.boardStation)) return clickBoard();
    if (inBox(LAYOUT.stove)) return clickStove();
    if (inBox(LAYOUT.plate)) return clickPlate();
    if (inBox(LAYOUT.bin)) return clickBin();
    if (inBox(LAYOUT.serve)) return clickServe();
    return 0;
  }

  function step(dt) {
    if (state.screen !== 'play') return 0;
    let events = 0;
    state.elapsed += dt;
    if (state.flashTime > 0) state.flashTime -= dt;
    // Pot cooks, then burns.
    if (state.pot.item && !state.pot.done) {
      state.pot.progress += dt / COOK_SECONDS;
      if (state.pot.progress >= 1) { state.pot.progress = 1; state.pot.done = true; }
    } else if (state.pot.item && state.pot.done) {
      state.pot.burn += dt;
      if (state.pot.burn >= BURN_AFTER) {
        state.pot = { item: null, progress: 0, done: false, burn: 0 };
        state.flash = 'Burned! The pot is ruined.';
        state.flashTime = 2;
        events |= EVENT_BURNED;
      }
    }
    // Tickets count down.
    for (const order of state.orders) {
      if (order.served || order.expired) continue;
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        order.expired = true;
        state.expiredCount += 1;
        state.flash = `${order.recipe.name} expired! A guest left hungry.`;
        state.flashTime = 2;
        events |= EVENT_EXPIRED;
      }
    }
    // New tickets arrive.
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      state.orderTimer = orderInterval(state.elapsed);
      if (boardHasRoom(state.orders)) state.orders.push(newOrder(random));
    }
    if (state.elapsed >= SHIFT_SECONDS) {
      state.screen = 'over';
      events |= EVENT_OVER;
    }
    return events;
  }

  return {
    state, reset, start, rush, timeLeft, stars,
    pickIngredient, clickBoard, clickStove, clickPlate, clickBin, clickServe,
    clickAt, step,
  };
}
