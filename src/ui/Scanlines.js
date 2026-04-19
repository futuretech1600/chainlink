import { CANVAS_W, CANVAS_H } from '../constants';

export function renderScanlines(ctx) {
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < CANVAS_H; y += 2) {
    ctx.fillRect(0, y, CANVAS_W, 1);
  }
  ctx.globalAlpha = 1.0;
}
