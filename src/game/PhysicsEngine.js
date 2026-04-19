import {
  COURT_LEFT, COURT_RIGHT, COURT_TOP, COURT_BOTTOM,
  NET_Y, NET_HEIGHT, BALL_RADIUS, GRAVITY, BOUNCE_RESTITUTION,
  PLAYER_W,
} from '../constants';

export function updateBall(ball, dt) {
  const prevX = ball.x;
  const prevY = ball.y;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;
  ball.vz -= GRAVITY * dt;

  // Update ghost trail
  ball.trail.unshift({ x: prevX, y: prevY, z: ball.z });
  if (ball.trail.length > 4) ball.trail.pop();

  // Ground bounce
  if (ball.z <= 0) {
    ball.z = 0;
    if (ball.vz < -15) {
      ball.vz = -ball.vz * BOUNCE_RESTITUTION;
      ball.bounces++;
      ball.vx *= 0.9;
      ball.vy *= 0.9;
      return { type: 'bounce', x: ball.x, y: ball.y };
    } else {
      ball.vz = 0;
    }
  }

  // Out of bounds (side walls reflect; baselines are out)
  if (ball.x - BALL_RADIUS < COURT_LEFT) {
    ball.x = COURT_LEFT + BALL_RADIUS;
    ball.vx = Math.abs(ball.vx) * 0.7;
  }
  if (ball.x + BALL_RADIUS > COURT_RIGHT) {
    ball.x = COURT_RIGHT - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx) * 0.7;
  }
  if (ball.inPlay && (ball.y < COURT_TOP - 5 || ball.y > COURT_BOTTOM + 5)) {
    return { type: 'out' };
  }

  return null;
}

export function checkNetCollision(ball, prevY) {
  const crossedNet =
    (prevY <= NET_Y && ball.y > NET_Y) ||
    (prevY >= NET_Y && ball.y < NET_Y);

  if (crossedNet && ball.z < NET_HEIGHT) {
    // Push ball back to previous side
    ball.y = prevY;
    ball.vy = -ball.vy * 0.25;
    ball.vz = Math.abs(ball.vz) * 0.25;
    return true;
  }
  return false;
}

export function checkPlayerBallCollision(ball, player) {
  if (!ball.inPlay) return false;
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < 14 && ball.z < 24;
}

export function hitBall(ball, player, shotType, targetX, targetY) {
  const dx = targetX - ball.x;
  const dy = targetY - ball.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  const powerMult = 1 + (player.stats.power - 3) * 0.12;

  let speed, vzInit;
  switch (shotType) {
    case 'DINK':
      speed = 75 * powerMult;
      vzInit = 28;
      break;
    case 'DRIVE':
      speed = 210 * powerMult;
      vzInit = 18;
      break;
    case 'LOB':
      speed = 110 * powerMult;
      vzInit = 100;
      break;
    default:
      speed = 150 * powerMult;
      vzInit = 40;
  }

  ball.vx = (dx / dist) * speed;
  ball.vy = (dy / dist) * speed;
  ball.vz = vzInit;
  ball.lastHitBy = player.id;
  ball.bounces = 0;
  ball.inPlay = true;
}

export function isInKitchen(player) {
  return player.y > KITCHEN_TOP_Y && player.y < KITCHEN_BOTTOM_Y;
}
