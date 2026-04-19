import {
  CANVAS_W, CANVAS_H, COURT_LEFT, COURT_RIGHT, COURT_TOP, COURT_BOTTOM,
  NET_Y, KITCHEN_TOP_Y, KITCHEN_BOTTOM_Y,
  PLAYER_W, PLAYER_H, PLAYER_SPEED_BASE, SWING_DURATION,
  POINTS_TO_WIN, WIN_BY, SETS_TO_WIN,
  SCORE_FLASH_FRAMES, SCREEN_SHAKE_FRAMES, SCREEN_SHAKE_INTENSITY,
  CHARACTERS, GAME_STATES, COLORS,
} from '../constants';
import {
  updateBall, checkNetCollision, checkPlayerBallCollision,
  hitBall, isInKitchen,
} from './PhysicsEngine';
import { AIPlayer } from './AIPlayer';
import { SoundEngine } from './SoundEngine';

function makePlayer(id, charId) {
  const ch = CHARACTERS[charId] || CHARACTERS[0];
  return {
    id,
    charId,
    x: CANVAS_W / 2,
    y: id === 0 ? COURT_BOTTOM - 30 : COURT_TOP + 20,
    vx: 0,
    vy: 0,
    state: 'IDLE',
    direction: id === 0 ? -1 : 1,
    swingTimer: 0,
    stats: ch.stats,
    color: id === 0 ? COLORS.P1_BODY : COLORS.P2_BODY,
    spriteScale: ch.spriteScale,
  };
}

function makeBall() {
  return {
    x: CANVAS_W / 2,
    y: COURT_BOTTOM - 40,
    z: 5,
    vx: 0, vy: 0, vz: 0,
    inPlay: false,
    lastHitBy: null,
    bounces: 0,
    trail: [],
  };
}

export class GameEngine {
  constructor(config) {
    this.config = config;
    this.sound = new SoundEngine();
    this.ai = config.mode === 'VS_CPU' ? new AIPlayer(config.difficulty || 1) : null;
    this.smashEffects = [];
    this.reset();
    this.sound.init();
  }

  reset() {
    this.players = [
      makePlayer(0, this.config.player1Char ?? 0),
      makePlayer(1, this.config.player2Char ?? 1),
    ];
    this.ball = makeBall();
    this.score = [0, 0];
    this.sets  = [0, 0];
    this.servingPlayer = 0;
    this.gameState = GAME_STATES.SERVE;
    this.pointWinner = null;
    this.matchWinner = null;
    this.scoreFlashTimer = 0;
    this.screenShakeTimer = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
    this.stateTimer = 0;
    this.frameCount = 0;
    this.smashEffects = [];
    this._positionForServe();
  }

  _positionForServe() {
    const srv = this.players[this.servingPlayer];
    const rcv = this.players[1 - this.servingPlayer];
    if (this.servingPlayer === 0) {
      srv.x = CANVAS_W / 2 - 20; srv.y = COURT_BOTTOM - 32;
      rcv.x = CANVAS_W / 2;      rcv.y = COURT_TOP + 22;
    } else {
      srv.x = CANVAS_W / 2 + 20; srv.y = COURT_TOP + 22;
      rcv.x = CANVAS_W / 2;      rcv.y = COURT_BOTTOM - 32;
    }
    srv.state = 'IDLE'; srv.vx = 0; srv.vy = 0;
    rcv.state = 'IDLE'; rcv.vx = 0; rcv.vy = 0;
    const b = this.ball;
    b.x = srv.x; b.y = srv.y - 6; b.z = 5;
    b.vx = 0; b.vy = 0; b.vz = 0;
    b.inPlay = false; b.lastHitBy = null; b.bounces = 0; b.trail = [];
  }

  update(dt, inputHandler) {
    this.frameCount++;
    this.stateTimer += dt;

    if (this.scoreFlashTimer > 0) this.scoreFlashTimer--;
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer--;
      this.screenShakeX = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY;
      this.screenShakeY = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY;
    } else {
      this.screenShakeX = 0;
      this.screenShakeY = 0;
    }

    this.smashEffects = this.smashEffects.filter(e => ++e.frame < 8);

    switch (this.gameState) {
      case GAME_STATES.SERVE:    this._updateServe(dt, inputHandler); break;
      case GAME_STATES.RALLY:    this._updateRally(dt, inputHandler); break;
      case GAME_STATES.POINT:    if (this.stateTimer > 1.8) this._startNextPoint(); break;
      case GAME_STATES.GAME_OVER: break;
    }
  }

  _updateServe(dt, inputHandler) {
    const srv = this.players[this.servingPlayer];
    const input = inputHandler.getPlayerInput();

    // Human serves (P1 is always human in VS_CPU / VS_PLAYER)
    if (this.servingPlayer === 0 || this.config.mode === 'VS_PLAYER') {
      this._movePlayer(srv, input.move, dt, true);
      this.ball.x = srv.x;
      this.ball.y = srv.y - 6;
      if (input.drive || input.dink) {
        this._executeServe(srv, input.drive ? 'DRIVE' : 'DINK');
      }
    } else {
      // AI serves automatically after short delay
      if (this.stateTimer > 1.0) {
        this._executeServe(srv, 'DRIVE');
      }
    }
  }

  _executeServe(server, shotType) {
    const toP1Side = this.servingPlayer === 1;
    const targetX = toP1Side
      ? COURT_LEFT + (COURT_RIGHT - COURT_LEFT) * 0.65
      : COURT_LEFT + (COURT_RIGHT - COURT_LEFT) * 0.35;
    const targetY = toP1Side ? COURT_BOTTOM - 35 : COURT_TOP + 25;

    hitBall(this.ball, server, shotType, targetX, targetY);
    this.ball.vz = 65;
    this.gameState = GAME_STATES.RALLY;
    this.stateTimer = 0;
    this.sound.play('hit');
  }

  _updateRally(dt, inputHandler) {
    const p1 = this.players[0];
    const p2 = this.players[1];
    const input = inputHandler.getPlayerInput();

    // ── Player 1 (human) ──
    this._movePlayer(p1, input.move, dt, false);
    this._tickSwing(p1, dt);

    if ((input.dink || input.drive || input.lob) && p1.swingTimer <= 0) {
      if (checkPlayerBallCollision(this.ball, p1)) {
        if (isInKitchen(p1) && this.ball.z > 5) {
          this.sound.play('net');
          this._awardPoint(1, 'KITCHEN_FAULT');
          return;
        }
        const shotType = input.dink ? 'DINK' : input.lob ? 'LOB' : 'DRIVE';
        const aimX = CANVAS_W / 2 + (Math.random() - 0.5) * 120;
        const aimY = COURT_TOP + 25;
        hitBall(this.ball, p1, shotType, aimX, aimY);
        p1.swingTimer = SWING_DURATION;
        p1.state = 'SWINGING';
        if (shotType === 'DRIVE') {
          this.screenShakeTimer = SCREEN_SHAKE_FRAMES;
          this.smashEffects.push({ x: this.ball.x, y: this.ball.y, frame: 0 });
          this.sound.play('hit_hard');
        } else if (shotType === 'DINK') {
          this.sound.play('dink');
        } else {
          this.sound.play('lob');
        }
      }
    }

    // ── Player 2 (AI or 2nd human) ──
    if (this.ai) {
      const res = this.ai.update(dt, p2, this.ball, this.gameState);
      if (res && res.hit) {
        hitBall(this.ball, p2, res.shotType, res.targetX, res.targetY);
        p2.state = 'SWINGING';
        p2.swingTimer = SWING_DURATION;
        this.sound.play(res.shotType === 'DINK' ? 'dink' : 'hit');
      }
      // Constrain AI to its half
      p2.x = Math.max(COURT_LEFT + PLAYER_W / 2, Math.min(COURT_RIGHT - PLAYER_W / 2, p2.x + p2.vx * dt));
      p2.y = Math.max(COURT_TOP + PLAYER_H / 2, Math.min(NET_Y - 5, p2.y + p2.vy * dt));
    } else {
      // VS_PLAYER: 2nd player uses separate keys (IJKL + UOP)
      const p2Input = this._getP2Input(inputHandler);
      this._movePlayer(p2, p2Input.move, dt, false);
      this._tickSwing(p2, dt);
      if ((p2Input.dink || p2Input.drive || p2Input.lob) && p2.swingTimer <= 0) {
        if (checkPlayerBallCollision(this.ball, p2)) {
          const shotType = p2Input.dink ? 'DINK' : p2Input.lob ? 'LOB' : 'DRIVE';
          const aimX = CANVAS_W / 2 + (Math.random() - 0.5) * 120;
          const aimY = COURT_BOTTOM - 25;
          hitBall(this.ball, p2, shotType, aimX, aimY);
          p2.swingTimer = SWING_DURATION;
          p2.state = 'SWINGING';
          this.sound.play(shotType === 'DRIVE' ? 'hit_hard' : 'hit');
        }
      }
    }

    // ── Ball physics ──
    const prevY = this.ball.y;
    const evt = updateBall(this.ball, dt);

    if (checkNetCollision(this.ball, prevY)) {
      this.sound.play('net');
      if (Math.abs(this.ball.vy) < 5) {
        this._awardPoint(1 - (this.ball.lastHitBy ?? 0), 'NET');
        return;
      }
    }

    if (evt && evt.type === 'out') {
      this.sound.play('out');
      this._awardPoint(1 - (this.ball.lastHitBy ?? 0), 'OUT');
      return;
    }

    if (evt && evt.type === 'bounce') {
      this.sound.play('bounce');
      const onP1Side = this.ball.y > NET_Y;
      if (onP1Side && this.ball.lastHitBy === 0 && this.ball.bounces >= 2) {
        this._awardPoint(1, 'DOUBLE_BOUNCE');
        return;
      }
      if (!onP1Side && this.ball.lastHitBy === 1 && this.ball.bounces >= 2) {
        this._awardPoint(0, 'DOUBLE_BOUNCE');
        return;
      }
    }
  }

  _getP2Input(inputHandler) {
    const k = inputHandler.keys;
    const rawX = (k['l'] ? 1 : 0) - (k['j'] ? 1 : 0);
    const rawY = (k['k'] ? 1 : 0) - (k['i'] ? 1 : 0);
    const mag = Math.sqrt(rawX * rawX + rawY * rawY) || 1;
    return {
      move: { x: rawX / mag, y: rawY / mag },
      dink:  k['u'],
      drive: k['o'],
      lob:   k['p'],
    };
  }

  _movePlayer(player, move, dt, isServeMode) {
    const speedMult = 1 + (player.stats.speed - 3) * 0.12;
    const speed = PLAYER_SPEED_BASE * speedMult;
    player.vx = move.x * speed;
    player.vy = move.y * speed;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    const minY = isServeMode
      ? (player.id === 0 ? NET_Y + 5 : COURT_TOP + PLAYER_H / 2)
      : (player.id === 0 ? NET_Y + 5 : COURT_TOP + PLAYER_H / 2);
    const maxY = isServeMode
      ? (player.id === 0 ? COURT_BOTTOM - PLAYER_H / 2 : NET_Y - 5)
      : (player.id === 0 ? COURT_BOTTOM - PLAYER_H / 2 : NET_Y - 5);

    player.x = Math.max(COURT_LEFT + PLAYER_W / 2, Math.min(COURT_RIGHT - PLAYER_W / 2, player.x));
    player.y = Math.max(minY, Math.min(maxY, player.y));

    if (move.x !== 0 || move.y !== 0) {
      player.state = 'RUNNING';
      if (move.y !== 0) player.direction = move.y > 0 ? 1 : -1;
    } else if (player.state === 'RUNNING') {
      player.state = 'IDLE';
    }
  }

  _tickSwing(player, dt) {
    if (player.swingTimer > 0) {
      player.swingTimer -= dt;
      if (player.swingTimer <= 0) {
        player.swingTimer = 0;
        player.state = 'IDLE';
      }
    }
  }

  _awardPoint(winnerId, reason) {
    this.score[winnerId]++;
    this.scoreFlashTimer = SCORE_FLASH_FRAMES;
    this.pointWinner = winnerId;
    this.gameState = GAME_STATES.POINT;
    this.stateTimer = 0;
    this.sound.play('score');

    const w = winnerId;
    const l = 1 - winnerId;
    if (this.score[w] >= POINTS_TO_WIN && this.score[w] - this.score[l] >= WIN_BY) {
      this.sets[w]++;
      this.score = [0, 0];
      if (this.sets[w] >= SETS_TO_WIN) {
        this.gameState = GAME_STATES.GAME_OVER;
        this.matchWinner = w;
        this.sound.play('victory');
      }
    }

    // Serving side retains serve only if they scored; otherwise side-out
    if (this.servingPlayer !== winnerId) {
      this.servingPlayer = winnerId;
    }
  }

  _startNextPoint() {
    if (this.gameState === GAME_STATES.GAME_OVER) return;
    this.gameState = GAME_STATES.SERVE;
    this.stateTimer = 0;
    this.pointWinner = null;
    this._positionForServe();
  }

  getState() {
    return {
      players:          this.players,
      ball:             this.ball,
      score:            this.score,
      sets:             this.sets,
      servingPlayer:    this.servingPlayer,
      gameState:        this.gameState,
      pointWinner:      this.pointWinner,
      matchWinner:      this.matchWinner,
      scoreFlashTimer:  this.scoreFlashTimer,
      screenShakeX:     this.screenShakeX,
      screenShakeY:     this.screenShakeY,
      frameCount:       this.frameCount,
      smashEffects:     this.smashEffects,
    };
  }
}
