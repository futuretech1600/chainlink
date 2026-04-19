import { NET_Y, COURT_LEFT, COURT_RIGHT, COURT_TOP, CANVAS_H } from '../constants';
import { hitBall, checkPlayerBallCollision } from './PhysicsEngine';

export class AIPlayer {
  constructor(difficulty = 1) {
    this.difficulty = Math.max(0, Math.min(2, difficulty));
    this.targetX = 160;
    this.targetY = NET_Y - 40;
    this.thinkTimer = 0;
    this.REACTION_DELAY = [0.45, 0.2, 0.05][this.difficulty];
    this.ACCURACY     = [0.45, 0.75, 0.95][this.difficulty];
    this.SPEED        = [50,   70,   95  ][this.difficulty];
  }

  update(dt, player, ball, gameState) {
    if (gameState !== 'RALLY' && gameState !== 'SERVE') return { hit: false };

    this.thinkTimer -= dt;

    if (this.thinkTimer <= 0) {
      this.thinkTimer = this.REACTION_DELAY;
      const timeToReach = Math.abs(ball.y - player.y) / (Math.abs(ball.vy) + 1);
      const predX = ball.x + ball.vx * timeToReach * this.ACCURACY;
      this.targetX = Math.max(COURT_LEFT + 10, Math.min(COURT_RIGHT - 10, predX));
      this.targetY = COURT_TOP + 20 + (2 - this.difficulty) * 10;
    }

    // Move toward target position
    const dx = this.targetX - player.x;
    const dy = this.targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist > 3) {
      player.vx = (dx / dist) * this.SPEED;
      player.vy = (dy / dist) * this.SPEED;
    } else {
      player.vx = 0;
      player.vy = 0;
    }

    // Decide whether to swing
    const ballClose = checkPlayerBallCollision(ball, player);
    const ballComingToward = ball.vy > 0; // ball moving toward AI (downward = toward p1, upward = toward AI on top)

    if (ballClose && ball.lastHitBy !== player.id) {
      const rand = Math.random();
      let shotType;
      if (ball.y < NET_Y - 35) {
        shotType = rand < 0.5 ? 'DRIVE' : 'LOB';
      } else {
        shotType = rand < 0.45 ? 'DINK' : 'DRIVE';
      }

      // Aim into P1's half with some randomness
      const aimX = COURT_LEFT + 20 + Math.random() * (COURT_RIGHT - COURT_LEFT - 40);
      const aimY = CANVAS_H - 40;

      return { hit: true, shotType, targetX: aimX, targetY: aimY };
    }

    return { hit: false };
  }
}
