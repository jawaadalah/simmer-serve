// All drawing: the kitchen, the order board, the stations, the counter and
// the screens. Food is drawn as vector shapes (no images, no network).
import { FIELD, INGREDIENTS, LAYOUT, PALETTE, RUSH_SECONDS, SHIFT_SECONDS, STARS } from './config.js';
import { matchRecipe } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Draw one ingredient as a small vector picture. `chopped` draws pieces. */
export function drawIngredient(ctx, kind, x, y, r, chopped = false) {
  ctx.save();
  ctx.translate(x, y);
  if (chopped) {
    ctx.fillStyle = INGREDIENTS[kind].color;
    for (const [dx, dy, s] of [[-r * 0.5, -r * 0.2, 0.55], [r * 0.45, -r * 0.35, 0.5], [0, r * 0.45, 0.6]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'tomato': {
      ctx.fillStyle = '#e04a3a';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f9e4d';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.moveTo(0, -r * 0.25);
        ctx.lineTo(Math.cos(a) * r * 0.5, -r * 0.25 + Math.sin(a) * r * 0.5);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'onion': {
      ctx.fillStyle = '#b678c4';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#efe3f5'; ctx.lineWidth = r * 0.12;
      for (const rr of [0.65, 0.35]) { ctx.beginPath(); ctx.arc(0, 0, r * rr, 0, Math.PI * 2); ctx.stroke(); }
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = '#d8c9a8';
      ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.95, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#efe6cf';
      ctx.fillRect(-r * 0.28, r * 0.1, r * 0.56, r * 0.6);
      ctx.fillStyle = '#b09a72';
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.35, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.5, r * 0.14, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'pasta': {
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
      for (const dy of [-r * 0.5, 0, r * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, dy);
        ctx.quadraticCurveTo(0, dy - r * 0.35, r * 0.8, dy);
        ctx.stroke();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f7d774';
      ctx.beginPath(); ctx.moveTo(-r, r * 0.7); ctx.lineTo(r, r * 0.7); ctx.lineTo(r * 0.2, -r * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9a441';
      for (const [hx, hy] of [[-r * 0.3, r * 0.3], [r * 0.35, r * 0.35], [0, -r * 0.2]]) {
        ctx.beginPath(); ctx.arc(hx, hy, r * 0.14, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'basil': {
      ctx.fillStyle = '#3f9e4d';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.45, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2c6e37'; ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.7); ctx.lineTo(r * 0.7, -r * 0.7); ctx.stroke();
      break;
    }
    default: break;
  }
  ctx.restore();
}

/** A prepared item's icon: chopped pieces, a steaming bowl, or the raw kind. */
function drawPrepared(ctx, label, x, y, r) {
  if (label.startsWith('chopped ')) {
    drawIngredient(ctx, label.slice(8), x, y, r, true);
    return;
  }
  if (label.startsWith('cooked ')) {
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.9, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 1.1); ctx.quadraticCurveTo(x - r * 0.6, y - r * 1.5, x - r * 0.4, y - r * 1.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.4, y - r * 1.1); ctx.quadraticCurveTo(x + r * 0.6, y - r * 1.5, x + r * 0.4, y - r * 1.8); ctx.stroke();
    return;
  }
  drawIngredient(ctx, label, x, y, r, false);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, bold = false, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '400'} ${size}px ${'system-ui, sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function drawBoard(state) {
    const b = LAYOUT.board;
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.strokeStyle = PALETTE.boardEdge; ctx.lineWidth = 3;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
    text(ctx, 'ORDER BOARD', b.x + 16, b.y + 30, 15, PALETTE.boardEdge, true);
    const live = state.orders.filter((o) => !o.served && !o.expired);
    live.slice(0, 4).forEach((order, i) => {
      const x = b.x + 146 + i * 200;
      const y = b.y + 8;
      ctx.fillStyle = PALETTE.paper;
      roundRect(ctx, x, y, 190, 80, 8); ctx.fill();
      text(ctx, `#${order.id} ${order.recipe.name}`, x + 10, y + 20, 14, PALETTE.text, true);
      order.recipe.needs.forEach((need, j) => {
        drawPrepared(ctx, need, x + 30 + j * 52, y + 44, 12);
        text(ctx, need.split(' ').pop(), x + 30 + j * 52, y + 66, 9, PALETTE.muted, false, 'center');
      });
      const frac = Math.max(0, order.timeLeft / 70);
      ctx.fillStyle = '#e0d6c2';
      ctx.fillRect(x + 10, y + 71, 170, 5);
      ctx.fillStyle = frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.warn : PALETTE.bad;
      ctx.fillRect(x + 10, y + 71, 170 * frac, 5);
    });
    if (!live.length) text(ctx, 'No orders yet — the lunch crowd is coming…', b.x + 160, b.y + 55, 16, '#cfd6de');
    // Shift timer + coins, right side.
    const rush = state.elapsed > SHIFT_SECONDS - RUSH_SECONDS;
    text(ctx, rush ? 'DINNER RUSH ×2 TIPS' : 'SHIFT', b.x + b.w - 210, b.y + 28, 13, rush ? '#ff8a65' : '#9fb0c3', true);
    text(ctx, fmtTime(SHIFT_SECONDS - state.elapsed), b.x + b.w - 210, b.y + 58, 30, rush ? '#ff8a65' : '#ffffff', true);
    text(ctx, `● ${state.coins} coins · ${state.served} served`, b.x + b.w - 210, b.y + 82, 14, '#ffe082', true);
  }

  function drawStations(state) {
    // Chopping board.
    const bs = LAYOUT.boardStation;
    ctx.fillStyle = '#e8d9b8';
    roundRect(ctx, bs.x, bs.y, bs.w, bs.h, 10); ctx.fill();
    ctx.strokeStyle = '#c9b183'; ctx.lineWidth = 3;
    roundRect(ctx, bs.x, bs.y, bs.w, bs.h, 10); ctx.stroke();
    text(ctx, '1 · CHOPPING BOARD', bs.x + 14, bs.y + 26, 14, PALETTE.muted, true);
    if (state.board.item) {
      drawIngredient(ctx, state.board.item.kind, bs.x + bs.w / 2, bs.y + 105, 42, state.board.chops > 0);
      text(ctx, `Chop! ${state.board.chops}/3`, bs.x + bs.w / 2, bs.y + 168, 16, PALETTE.text, true, 'center');
      ctx.fillStyle = '#e0d6c2'; ctx.fillRect(bs.x + 40, bs.y + 178, bs.w - 80, 6);
      ctx.fillStyle = PALETTE.accent;
      ctx.fillRect(bs.x + 40, bs.y + 178, (bs.w - 80) * (state.board.chops / 3), 6);
    } else {
      text(ctx, 'Click a vegetable,', bs.x + bs.w / 2, bs.y + 100, 15, PALETTE.muted, false, 'center');
      text(ctx, 'then click here', bs.x + bs.w / 2, bs.y + 122, 15, PALETTE.muted, false, 'center');
      ctx.fillStyle = '#c9d2d8';
      roundRect(ctx, bs.x + bs.w / 2 - 58, bs.y + 138, 66, 26, 4); ctx.fill();
      ctx.strokeStyle = '#8b98a1'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bs.x + bs.w / 2 - 58, bs.y + 164); ctx.lineTo(bs.x + bs.w / 2 + 8, bs.y + 164); ctx.stroke();
      ctx.fillStyle = '#5d4037';
      roundRect(ctx, bs.x + bs.w / 2 + 8, bs.y + 142, 34, 18, 5); ctx.fill();
    }
    // Stove.
    const st = LAYOUT.stove;
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
    ctx.strokeStyle = PALETTE.steelDark; ctx.lineWidth = 3;
    roundRect(ctx, st.x, st.y, st.w, st.h, 10); ctx.stroke();
    text(ctx, '2 · STOVE', st.x + 14, st.y + 26, 14, PALETTE.muted, true);
    if (state.pot.item) {
      ctx.fillStyle = '#3a3f45';
      ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + 105, 58, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = state.pot.done ? '#ff7043' : '#5d4037';
      ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + 105, 46, 0, Math.PI * 2); ctx.fill();
      drawPrepared(ctx, state.pot.item.prepared, st.x + st.w / 2, st.y + 105, 26);
      if (!state.pot.done) {
        ctx.fillStyle = '#e0d6c2'; ctx.fillRect(st.x + 40, st.y + 178, st.w - 80, 6);
        ctx.fillStyle = PALETTE.warn;
        ctx.fillRect(st.x + 40, st.y + 178, (st.w - 80) * state.pot.progress, 6);
        text(ctx, 'Cooking…', st.x + st.w / 2, st.y + 168, 15, PALETTE.text, true, 'center');
      } else {
        text(ctx, state.pot.burn > 1.5 ? 'Take it out — burning!' : 'Ready! Click to take out', st.x + st.w / 2, st.y + 168, 15, state.pot.burn > 1.5 ? PALETTE.bad : PALETTE.good, true, 'center');
      }
    } else {
      text(ctx, 'Click raw pasta', st.x + st.w / 2, st.y + 72, 15, PALETTE.muted, false, 'center');
      text(ctx, 'to cook it', st.x + st.w / 2, st.y + 94, 15, PALETTE.muted, false, 'center');
      ctx.fillStyle = '#3a3f45';
      ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + 148, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5d4037';
      ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + 148, 25, 0, Math.PI * 2); ctx.fill();
    }
    // Plate.
    const pl = LAYOUT.plate;
    ctx.fillStyle = '#f3e2c7';
    roundRect(ctx, pl.x, pl.y, pl.w, pl.h, 10); ctx.fill();
    ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 3;
    roundRect(ctx, pl.x, pl.y, pl.w, pl.h, 10); ctx.stroke();
    text(ctx, '3 · PLATE', pl.x + 14, pl.y + 26, 14, PALETTE.muted, true);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(pl.x + pl.w / 2, pl.y + 105, 120, 52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(pl.x + pl.w / 2, pl.y + 105, 120, 52, 0, 0, Math.PI * 2); ctx.stroke();
    state.plate.forEach((item, i) => {
      drawPrepared(ctx, item, pl.x + 90 + i * 60, pl.y + 105, 24);
    });
    const match = matchRecipe(state.plate);
    text(ctx, match ? `${match.name} — ready to serve!` : state.plate.length ? 'Keep building the dish…' : 'Click ready items to plate them', pl.x + pl.w / 2, pl.y + 178, 15, match ? PALETTE.good : PALETTE.muted, true, 'center');
    // Bin.
    const bn = LAYOUT.bin;
    ctx.fillStyle = '#6b6259';
    roundRect(ctx, bn.x, bn.y, bn.w, bn.h, 10); ctx.fill();
    text(ctx, 'BIN', bn.x + bn.w / 2, bn.y + 30, 14, '#ffffff', true, 'center');
    ctx.fillStyle = '#cfd6de';
    ctx.beginPath(); ctx.moveTo(bn.x + bn.w / 2 - 34, bn.y + 78); ctx.lineTo(bn.x + bn.w / 2 + 34, bn.y + 78); ctx.lineTo(bn.x + bn.w / 2 + 26, bn.y + 140); ctx.lineTo(bn.x + bn.w / 2 - 26, bn.y + 140); ctx.closePath(); ctx.fill();
    ctx.fillRect(bn.x + bn.w / 2 - 40, bn.y + 70, 80, 8);
    text(ctx, 'Throw away hand / plate', bn.x + bn.w / 2, bn.y + 168, 12, '#e8e2d8', false, 'center');
    // Serve button.
    const sv = LAYOUT.serve;
    ctx.fillStyle = match ? PALETTE.good : '#9aa7b0';
    roundRect(ctx, sv.x, sv.y, sv.w, sv.h, 12); ctx.fill();
    text(ctx, 'SERVE', sv.x + sv.w / 2, sv.y + 38, 26, '#ffffff', true, 'center');
    text(ctx, match ? `+${match.coins} coins` : 'Space / click', sv.x + sv.w / 2, sv.y + 68, 14, '#ffffff', false, 'center');
  }

  function drawCounter(state) {
    const c = LAYOUT.counter;
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(c.x, c.y, c.w, 14);
    text(ctx, 'INGREDIENTS — click to pick up (keys 1–6)', c.x + 16, c.y + 40, 15, '#ffe8c2', true);
    Object.keys(INGREDIENTS).forEach((kind, i) => {
      const x = c.x + 80 + i * 172;
      const y = c.y + 92;
      ctx.fillStyle = '#7c4f2c';
      roundRect(ctx, x - 62, y - 46, 124, 92, 10); ctx.fill();
      drawIngredient(ctx, kind, x, y - 4, 26);
      text(ctx, `${i + 1} ${INGREDIENTS[kind].name}`, x, y + 34, 13, '#ffe8c2', true, 'center');
    });
    // Hand slot.
    const hx = c.x + c.w - 148;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, hx, c.y + 46, 132, 92, 10); ctx.fill();
    text(ctx, 'IN HAND', hx + 66, c.y + 64, 12, '#ffe8c2', true, 'center');
    if (state.hand) {
      drawPrepared(ctx, state.hand.prepared, hx + 66, c.y + 102, 20);
      text(ctx, state.hand.prepared, hx + 66, c.y + 132, 11, '#ffffff', false, 'center');
    } else {
      text(ctx, '— empty —', hx + 66, c.y + 105, 13, '#d8c9b8', false, 'center');
    }
  }

  function drawOverlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(20,16,12,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.paper;
    roundRect(ctx, 290, 130, 700, 460, 16); ctx.fill();
    text(ctx, title, 640, 200, 40, accent, true, 'center');
    lines.forEach((line, i) => {
      text(ctx, line, 640, 260 + i * 34, 18, PALETTE.text, false, 'center');
    });
  }

  function draw(state, screen, best) {
    // Wall + floor.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 540, FIELD.width, 180);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let x = 0; x < FIELD.width; x += 90) ctx.fillRect(x, 0, 2, 540);
    text(ctx, 'DAPUR SENJA — a tiny kitchen, a big dinner rush', 24, 545, 13, 'rgba(255,255,255,0.75)', true);
    drawBoard(state);
    drawStations(state);
    drawCounter(state);
    if (state.flashTime > 0 && state.flash) {
      ctx.fillStyle = 'rgba(20,16,12,0.85)';
      ctx.font = '700 18px system-ui, sans-serif';
      const w = ctx.measureText(state.flash).width + 48;
      roundRect(ctx, 640 - w / 2, 350, w, 44, 10); ctx.fill();
      text(ctx, state.flash, 640, 379, 18, '#ffe082', true, 'center');
    }
    if (screen === SCREEN_TITLE) {
      drawOverlay('SIMMER & SERVE', [
        'Run Dapur Senja, a tiny street-food kitchen.',
        'Chop it, cook it, plate it, serve it — before the ticket expires.',
        'Click ingredients (or keys 1–6), then the board, the stove, the plate.',
        'Serve the right dish to the right ticket. Tips grow in the dinner rush.',
        '',
        'Click anywhere to start your shift!',
      ], PALETTE.accent);
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', ['Take a breath. The stove is off.', '', 'Press P or click to keep cooking.'], PALETTE.muted);
    } else if (screen === SCREEN_OVER) {
      const n = STARS.filter((bar) => state.coins >= bar).length;
      const stars = '★'.repeat(n) + '☆'.repeat(3 - n);
      drawOverlay('SHIFT OVER!', [
        `${stars}   ${state.coins} coins · ${state.served} dishes served · ${state.expiredCount} expired`,
        `Best shift so far: ${Math.max(best, state.coins)} coins`,
        '',
        'Click anywhere to cook another shift!',
      ], PALETTE.good);
    }
  }

  return { draw };
}
