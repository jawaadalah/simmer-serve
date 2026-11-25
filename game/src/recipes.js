// Recipes and orders: which dishes exist, what a ticket asks for, and how
// the board fills up as the shift goes on.
import { MAX_ORDERS, ORDER_EVERY, ORDER_EVERY_MIN, ORDER_TIME, RECIPES, RUSH_SECONDS, SHIFT_SECONDS } from './config.js';
import { pick } from './random.js';

let orderId = 1;

/** A fresh ticket for a random recipe, with a countdown in seconds. */
export function newOrder(random) {
  const recipe = pick(random, RECIPES);
  return {
    id: orderId++,
    recipe,
    timeLeft: ORDER_TIME,
    served: false,
    expired: false,
  };
}

/** Seconds between new orders right now: faster in the dinner rush. */
export function orderInterval(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  const base = ORDER_EVERY - (ORDER_EVERY - ORDER_EVERY_MIN) * t;
  return elapsed > SHIFT_SECONDS - RUSH_SECONDS ? base * 0.6 : base;
}

/** True when the board has room for another ticket. */
export function boardHasRoom(orders) {
  return orders.filter((o) => !o.served && !o.expired).length < MAX_ORDERS;
}

/** The recipe a plate matches, or null when the plate holds no full recipe. */
export function matchRecipe(plateItems) {
  const have = [...plateItems].sort();
  for (const recipe of RECIPES) {
    const need = [...recipe.needs].sort();
    if (have.length === need.length && have.every((item, i) => item === need[i])) return recipe;
  }
  return null;
}

/** Coins for serving a recipe with `timeLeft` seconds on its ticket. */
export function serveValue(recipe, timeLeft, rush) {
  const tip = Math.round((timeLeft / ORDER_TIME) * 8);
  return { coins: recipe.coins + tip * (rush ? 2 : 1), tip: tip * (rush ? 2 : 1) };
}
