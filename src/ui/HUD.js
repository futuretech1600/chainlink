import { CANVAS_W, HUD_H, COLORS } from '../constants';

// 3×5 pixel bitmap digits
const DIGITS = {
  '0': [0b111,0b101,0b101,0b101,0b111],
  '1': [0b010,0b110,0b010,0b010,0b111],
  '2': [0b111,0b001,0b111,0b100,0b111],
  '3': [0b111,0b001,0b111,0b001,0b111],
  '4': [0b101,0b101,0b111,0b001,0b001],
  '5': [0b111,0b100,0b111,0b001,0b111],
  '6': [0b111,0b100,0b111,0b101,0b111],
  '7': [0b111,0b001,0b001,0b001,0b001],
  '8': [0b111,0b101,0b111,0b101,0b111],
  '9': [0b111,0b101,0b111,0b001,0b111],
};

function drawNumber(ctx, n, x, y, color, px = 2) {
  ctx.fillStyle = color;
  String(n).split('').forEach((ch, ci) => {
    const rows = DIGITS[ch] || DIGITS['0'];
    rows.forEach((row, ri) => {
      for (let bit = 2; bit >= 0; bit--) {
        if (row & (1 << bit)) {
          ctx.fillRect(x + ci * (3 * px + px) + (2 - bit) * px, y + ri * px, px, px);
        }
      }
    });
  });
}

export function renderHUD(ctx, state) {
  const { score, sets, servingPlayer, gameState, pointWinner, scoreFlashTimer, frameCount } = state;

  // Background bar
  ctx.fillStyle = COLORS.HUD_BG;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);

  // Bottom edge highlight
  ctx.fillStyle = COLORS.HUD_BORDER;
  ctx.fillRect(0, HUD_H - 1, CANVAS_W, 1);

  // Score flash full-bar tint
  if (scoreFlashTimer > 0) {
    ctx.globalAlpha = (scoreFlashTimer / 12) * 0.6;
    ctx.fillStyle = pointWinner === 0 ? '#FF2020' : '#2020FF';
    ctx.fillRect(0, 0, CANVAS_W, HUD_H);
    ctx.globalAlpha = 1.0;
  }

  // ── P1 panel (left) ──
  ctx.fillStyle = '#200028';
  ctx.fillRect(3, 2, 50, HUD_H - 4);
  ctx.strokeStyle = '#C04060';
  ctx.lineWidth = 1;
  ctx.strokeRect(3, 2, 50, HUD_H - 4);

  // P1 color chip
  ctx.fillStyle = COLORS.P1_BODY;
  ctx.fillRect(5, 4, 6, 6);

  // P1 score
  drawNumber(ctx, score[0], 14, 5, COLORS.HUD_TEXT, 2);

  // P1 set dots
  for (let i = 0; i < sets[0]; i++) {
    ctx.fillStyle = COLORS.P1_BODY;
    ctx.fillRect(40 + i * 6, 5, 5, 5);
  }

  // ── P2 panel (right) ──
  ctx.fillStyle = '#000028';
  ctx.fillRect(CANVAS_W - 53, 2, 50, HUD_H - 4);
  ctx.strokeStyle = '#4060C0';
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_W - 53, 2, 50, HUD_H - 4);

  // P2 color chip
  ctx.fillStyle = COLORS.P2_BODY;
  ctx.fillRect(CANVAS_W - 51, 4, 6, 6);

  // P2 score
  drawNumber(ctx, score[1], CANVAS_W - 42, 5, COLORS.HUD_TEXT, 2);

  // P2 set dots
  for (let i = 0; i < sets[1]; i++) {
    ctx.fillStyle = COLORS.P2_BODY;
    ctx.fillRect(CANVAS_W - 14 - i * 6, 5, 5, 5);
  }

  // ── Centre: serve arrow ──
  const blink = Math.floor(frameCount / 14) % 2 === 0;
  if (blink) {
    ctx.fillStyle = COLORS.HUD_TEXT;
    const ax = CANVAS_W / 2;
    if (servingPlayer === 0) {
      // Down arrow
      ctx.fillRect(ax - 3, 5, 7, 1);
      ctx.fillRect(ax - 2, 6, 5, 1);
      ctx.fillRect(ax - 1, 7, 3, 1);
      ctx.fillRect(ax,     8, 1, 1);
    } else {
      // Up arrow
      ctx.fillRect(ax,     5, 1, 1);
      ctx.fillRect(ax - 1, 6, 3, 1);
      ctx.fillRect(ax - 2, 7, 5, 1);
      ctx.fillRect(ax - 3, 8, 7, 1);
    }
  }

  // SERVE / POINT banners
  if (gameState === 'SERVE') {
    ctx.fillStyle = blink ? COLORS.HUD_TEXT : '#606020';
    // Draw S-E-R-V-E tiny text (reuse number renderer style omitted; use rect)
    ctx.fillRect(CANVAS_W / 2 - 10, 13, 20, 6);
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(CANVAS_W / 2 - 9, 14, 18, 4);
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.fillRect(CANVAS_W / 2 - 8, 15, 16, 2);
  }

  if (gameState === 'POINT' && pointWinner !== null) {
    ctx.fillStyle = COLORS.FLASH_WHITE;
    ctx.fillRect(CANVAS_W / 2 - 24, 3, 48, 18);
    ctx.fillStyle = pointWinner === 0 ? '#E02020' : '#2020E0';
    ctx.fillRect(CANVAS_W / 2 - 23, 4, 46, 16);
    // "P1 POINT" or "P2 POINT" indicator strip
    ctx.fillStyle = COLORS.FLASH_WHITE;
    ctx.fillRect(CANVAS_W / 2 - 18, 9, 36, 5);
  }
}
