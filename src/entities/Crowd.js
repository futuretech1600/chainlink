import { CANVAS_W, COURT_TOP } from '../constants';

const SHIRT_COLORS = ['#E03030','#30A030','#3030E0','#E0E030','#E030C0','#30C0E0','#E08030'];

export function renderCrowd(ctx, frameCount) {
  const waveIdx = Math.floor(frameCount / 25);

  // Bleacher tiers
  for (let tier = 0; tier < 3; tier++) {
    ctx.fillStyle = tier % 2 === 0 ? '#221444' : '#1A0C38';
    ctx.fillRect(0, tier * 8, CANVAS_W, 8);
  }

  // Pixel crowd figures
  for (let col = 0; col < 32; col++) {
    for (let row = 0; row < 3; row++) {
      const x = col * 10 + 5;
      const y = row * 7 + 1;
      const waving = (col + waveIdx) % 9 === 0;
      const colorIdx = (col * 5 + row * 11) % SHIRT_COLORS.length;
      const dy = waving ? -1 : 0;

      // Shirt / body
      ctx.fillStyle = SHIRT_COLORS[colorIdx];
      ctx.fillRect(x - 2, y + 3 + dy, 4, 4);

      // Head
      ctx.fillStyle = '#D8A050';
      ctx.fillRect(x - 1, y + dy, 2, 3);

      // Raised arm when waving
      if (waving) {
        ctx.fillStyle = SHIRT_COLORS[colorIdx];
        ctx.fillRect(x + 2, y - 1, 1, 4);
      }
    }
  }
}
