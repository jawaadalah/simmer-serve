// Every tuning number, colour and recipe in one place. The kitchen is a
// fixed 1280x720 logical area; the renderer scales it to the window, so no
// rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One full service: how long a shift lasts, in seconds. */
export const SHIFT_SECONDS = 150;
/** Orders on the board at once, and the fastest new orders arrive. */
export const MAX_ORDERS = 4;
export const ORDER_EVERY = 16;
export const ORDER_EVERY_MIN = 8;
/** Seconds an order ticket lives before it expires. */
export const ORDER_TIME = 70;
/** Last seconds of the shift: the dinner rush (orders faster, tips doubled). */
export const RUSH_SECONDS = 30;
/** How many clicks to finish chopping one vegetable. */
export const CHOPS_NEEDED = 3;
/** Seconds a pot needs on the stove, and the grace before it burns. */
export const COOK_SECONDS = 4;
export const BURN_AFTER = 3;
/** Coins per served dish, plus a tip for serving with time to spare. */
export const SERVE_COINS = 10;
export const TIP_MAX = 8;
/** Stars at these coin totals (shown on the results screen). */
export const STARS = [60, 110, 170];

/** Ingredients: id, display name, colour, and what it needs before plating. */
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e04a3a', step: 'chop' },
  onion: { name: 'Onion', color: '#b678c4', step: 'chop' },
  mushroom: { name: 'Mushroom', color: '#d8c9a8', step: 'chop' },
  pasta: { name: 'Pasta', color: '#f2c94c', step: 'cook' },
  cheese: { name: 'Cheese', color: '#f7d774', step: 'plate' },
  basil: { name: 'Basil', color: '#3f9e4d', step: 'plate' },
};

/** Recipes: the dish name, the price in coins, and the prepared items it takes.
 *  An item is "chopped tomato", "cooked pasta", or a plain ingredient name
 *  when it needs no preparation (cheese, basil go straight on the plate). */
export const RECIPES = [
  { id: 'pasta-marinara', name: 'Pasta Marinara', coins: 12, needs: ['chopped tomato', 'chopped onion', 'cooked pasta'] },
  { id: 'mushroom-soup', name: 'Mushroom Soup', coins: 11, needs: ['chopped mushroom', 'chopped onion', 'cooked pasta'] },
  { id: 'garden-salad', name: 'Garden Salad', coins: 9, needs: ['chopped tomato', 'chopped onion', 'basil'] },
  { id: 'cheesy-pasta', name: 'Cheesy Pasta', coins: 10, needs: ['cooked pasta', 'cheese'] },
  { id: 'truffle-pasta', name: 'Truffle Pasta', coins: 14, needs: ['chopped mushroom', 'cooked pasta', 'cheese'] },
];

/** Where the stations sit on the 1280x720 kitchen (x, y, w, h). */
export const LAYOUT = {
  board: { x: 24, y: 16, w: 1232, h: 96 },
  counter: { x: 24, y: 560, w: 1232, h: 144 },
  boardStation: { x: 40, y: 140, w: 300, h: 190 },
  stove: { x: 380, y: 140, w: 300, h: 190 },
  plate: { x: 720, y: 140, w: 300, h: 190 },
  bin: { x: 1060, y: 140, w: 180, h: 190 },
  serve: { x: 1060, y: 350, w: 180, h: 90 },
};

export const PALETTE = {
  wall: '#f6e3c8',
  floor: '#c98f5f',
  board: '#2f3a4a',
  boardEdge: '#f2c94c',
  counter: '#8a5a33',
  counterTop: '#b07a45',
  steel: '#c9d2d8',
  steelDark: '#9aa7b0',
  text: '#23201c',
  muted: '#6b6259',
  paper: '#fff8ea',
  good: '#2e7d32',
  bad: '#c62828',
  warn: '#ef6c00',
  accent: '#e04a3a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift total is kept between visits (this browser only). */
export const BEST_KEY = 'simmer-serve.best';
