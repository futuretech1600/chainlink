import {
  CANVAS_W, CANVAS_H, COURT_LEFT, COURT_RIGHT, COURT_TOP, COURT_BOTTOM,
  NET_Y, KITCHEN_TOP_Y, KITCHEN_BOTTOM_Y, COLORS,
} from '../constants';

export function renderCourt(ctx) {
  // Crowd background
  ctx.fillStyle = COLORS.CROWD_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Court surface — checkerboard tile pattern
  for (let cy = COURT_TOP; cy < COURT_BOTTOM; cy += 8) {
    for (let cx = COURT_LEFT; cx < COURT_RIGHT; cx += 8) {
      const alt = ((Math.floor(cx / 8) + Math.floor(cy / 8)) % 2 === 0);
      ctx.fillStyle = alt ? COLORS.COURT_SURFACE : COLORS.COURT_ALT;
      ctx.fillRect(cx, cy, 8, 8);
    }
  }

  // Kitchen zones — semi-transparent overlay
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#6060FF';
  ctx.fillRect(COURT_LEFT, KITCHEN_TOP_Y, COURT_RIGHT - COURT_LEFT, KITCHEN_BOTTOM_Y - KITCHEN_TOP_Y);
  ctx.globalAlpha = 1.0;

  // Outer court boundary
  ctx.strokeStyle = COLORS.COURT_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(COURT_LEFT, COURT_TOP, COURT_RIGHT - COURT_LEFT, COURT_BOTTOM - COURT_TOP);

  // Center service line (above and below kitchen)
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, COURT_TOP);
  ctx.lineTo(CANVAS_W / 2, KITCHEN_TOP_Y);
  ctx.moveTo(CANVAS_W / 2, KITCHEN_BOTTOM_Y);
  ctx.lineTo(CANVAS_W / 2, COURT_BOTTOM);
  ctx.stroke();

  // Kitchen boundary lines
  ctx.beginPath();
  ctx.moveTo(COURT_LEFT, KITCHEN_TOP_Y);
  ctx.lineTo(COURT_RIGHT, KITCHEN_TOP_Y);
  ctx.moveTo(COURT_LEFT, KITCHEN_BOTTOM_Y);
  ctx.lineTo(COURT_RIGHT, KITCHEN_BOTTOM_Y);
  ctx.stroke();

  // Net mesh texture
  ctx.strokeStyle = '#909090';
  ctx.lineWidth = 1;
  for (let nx = COURT_LEFT + 6; nx < COURT_RIGHT; nx += 6) {
    ctx.beginPath();
    ctx.moveTo(nx, NET_Y - 1);
    ctx.lineTo(nx, NET_Y + 2);
    ctx.stroke();
  }

  // Net bar
  ctx.fillStyle = COLORS.NET;
  ctx.fillRect(COURT_LEFT, NET_Y - 1, COURT_RIGHT - COURT_LEFT, 3);

  // Net posts
  ctx.fillStyle = COLORS.NET_POST;
  ctx.fillRect(COURT_LEFT - 3, NET_Y - 7, 4, 12);
  ctx.fillRect(COURT_RIGHT - 1, NET_Y - 7, 4, 12);

  // "KITCHEN" label (pixel style)
  ctx.fillStyle = 'rgba(180,180,255,0.4)';
  ctx.fillRect(COURT_LEFT + 4, NET_Y - 3, 28, 6);
}
