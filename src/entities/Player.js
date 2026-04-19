import { PLAYER_W, PLAYER_H, COLORS, CHARACTERS } from '../constants';

export function renderPlayer(ctx, player, frameCount) {
  const { x, y, state, direction, id, charId } = player;
  const scale = player.spriteScale || 1.0;

  const w = Math.round(PLAYER_W * scale);
  const h = Math.round(PLAYER_H * scale);
  const px = Math.round(x - w / 2);
  const py = Math.round(y - h / 2);

  const walkFrame    = Math.floor(frameCount / 7) % 4;
  const isSwinging   = state === 'SWINGING';
  const swingPhase   = 1 - (player.swingTimer / 0.25);
  const bodyColor    = id === 0 ? COLORS.P1_BODY   : COLORS.P2_BODY;
  const shortsColor  = id === 0 ? COLORS.P1_SHORTS : COLORS.P2_SHORTS;
  const skinColor    = COLORS.P1_SKIN;

  // Drop shadow
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000000';
  ctx.fillRect(px + 2, py + h, w - 3, 3);
  ctx.globalAlpha = 1.0;

  // Legs with walk animation
  const legBob = state === 'RUNNING' ? (walkFrame % 2 === 0 ? 1 : -1) : 0;
  ctx.fillStyle = shortsColor;
  ctx.fillRect(px + 2,         py + h - 9, Math.max(3, w / 2 - 2), 9);
  ctx.fillRect(px + w / 2 + 1, py + h - 9 + legBob, Math.max(3, w / 2 - 3), 9 - legBob);

  // Shoes
  ctx.fillStyle = '#202020';
  ctx.fillRect(px + 1,     py + h - 2, Math.max(3, w / 2 - 1), 2);
  ctx.fillRect(px + w / 2, py + h - 2, Math.max(3, w / 2 - 1), 2);

  // Torso / jersey
  ctx.fillStyle = bodyColor;
  ctx.fillRect(px + 1, py + 5, w - 2, h - 14);

  // Jersey stripe
  ctx.fillStyle = id === 0 ? '#FFFFFF' : '#FFFF80';
  ctx.fillRect(px + w / 2 - 1, py + 7, 2, 5);

  // Head
  ctx.fillStyle = skinColor;
  ctx.fillRect(px + Math.round(w / 2) - 3, py, 6, 6);

  // Eyes (face direction)
  ctx.fillStyle = '#000000';
  if (direction > 0) {
    ctx.fillRect(px + Math.round(w / 2) - 2, py + 2, 1, 2);
    ctx.fillRect(px + Math.round(w / 2) + 1, py + 2, 1, 2);
  } else {
    ctx.fillRect(px + Math.round(w / 2) - 2, py + 1, 1, 2);
    ctx.fillRect(px + Math.round(w / 2) + 1, py + 1, 1, 2);
  }

  // Paddle
  ctx.fillStyle = '#D08818';
  if (isSwinging) {
    const angle = swingPhase * Math.PI * 0.6;
    const padX = id === 0
      ? px + w - 1 + Math.cos(angle) * 6
      : px - 6 - Math.cos(angle) * 4;
    ctx.fillRect(Math.round(padX), py + Math.round(h / 2) - 4, 8, 7);
    ctx.fillStyle = '#604010';
    ctx.fillRect(Math.round(padX), py + Math.round(h / 2) + 3, 2, 4);
  } else {
    ctx.fillRect(px + w - 2, py + Math.round(h / 2) - 3, 7, 6);
    ctx.fillStyle = '#604010';
    ctx.fillRect(px + w + 1, py + Math.round(h / 2) + 3, 2, 3);
  }
}
