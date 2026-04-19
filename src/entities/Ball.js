import { BALL_RADIUS, COLORS } from '../constants';

export function renderBall(ctx, ball) {
  const displayY = ball.y - ball.z * 0.28;

  // Shadow (on ground, scales with height)
  const shadowW = Math.max(2, BALL_RADIUS * 2 - ball.z * 0.08);
  const shadowAlpha = Math.max(0.05, 0.4 - ball.z * 0.012);
  ctx.globalAlpha = shadowAlpha;
  ctx.fillStyle = COLORS.BALL_SHADOW;
  ctx.fillRect(
    Math.round(ball.x - shadowW / 2),
    Math.round(ball.y),
    Math.round(shadowW),
    Math.round(shadowW * 0.4 + 1)
  );
  ctx.globalAlpha = 1.0;

  // Ghost trail
  ball.trail.forEach((pos, i) => {
    const alpha = 0.28 - i * 0.07;
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.BALL_TRAIL;
    const r = Math.max(1, BALL_RADIUS - 1);
    const ty = pos.y - pos.z * 0.28;
    ctx.fillRect(Math.round(pos.x - r), Math.round(ty - r), r * 2, r * 2);
  });
  ctx.globalAlpha = 1.0;

  // Ball body
  ctx.fillStyle = COLORS.BALL;
  ctx.fillRect(
    Math.round(ball.x - BALL_RADIUS),
    Math.round(displayY - BALL_RADIUS),
    BALL_RADIUS * 2,
    BALL_RADIUS * 2
  );

  // Highlight pixel
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(Math.round(ball.x - 1), Math.round(displayY - BALL_RADIUS + 1), 1, 1);
}

export function renderSmashEffect(ctx, effect) {
  const alpha = 1 - effect.frame / 8;
  const spread = effect.frame * 3;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFE040';

  // 8-point star burst
  const dirs = [
    [1,0],[-1,0],[0,1],[0,-1],
    [0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7],
  ];
  dirs.forEach(([dx, dy]) => {
    ctx.fillRect(
      Math.round(effect.x + dx * spread - 1),
      Math.round(effect.y + dy * spread - 1),
      2, 2
    );
  });
  ctx.globalAlpha = 1.0;
}
