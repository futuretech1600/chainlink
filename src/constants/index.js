export const CANVAS_W = 320;
export const CANVAS_H = 224;
export const DISPLAY_SCALE = 3;

export const HUD_H = 24;
export const COURT_TOP = HUD_H;
export const COURT_BOTTOM = CANVAS_H;
export const COURT_LEFT = 20;
export const COURT_RIGHT = 300;
export const COURT_W = COURT_RIGHT - COURT_LEFT;
export const COURT_H = COURT_BOTTOM - COURT_TOP;
export const NET_Y = Math.floor(COURT_TOP + COURT_H / 2); // 112
export const NET_HEIGHT = 12;
export const KITCHEN_DEPTH = 44;
export const KITCHEN_TOP_Y = NET_Y - KITCHEN_DEPTH;   // 68
export const KITCHEN_BOTTOM_Y = NET_Y + KITCHEN_DEPTH; // 156

export const PLAYER_W = 14;
export const PLAYER_H = 28;
export const PLAYER_SPEED_BASE = 80;
export const SWING_DURATION = 0.25;

export const BALL_RADIUS = 3;
export const GRAVITY = 280;
export const BOUNCE_RESTITUTION = 0.55;

export const POINTS_TO_WIN = 11;
export const WIN_BY = 2;
export const SETS_TO_WIN = 2;

export const SCORE_FLASH_FRAMES = 12;
export const SCREEN_SHAKE_FRAMES = 6;
export const SCREEN_SHAKE_INTENSITY = 8;

export const COLORS = {
  COURT_SURFACE: '#4040A0',
  COURT_ALT: '#383894',
  COURT_LINE: '#D0D0FF',
  KITCHEN: '#303080',
  NET: '#C0C0C0',
  NET_POST: '#808080',

  P1_BODY: '#E04040',
  P1_SHORTS: '#800808',
  P1_SKIN: '#D8A050',
  P2_BODY: '#4080E0',
  P2_SHORTS: '#082080',
  P2_SKIN: '#D8A050',

  BALL: '#E0E040',
  BALL_SHADOW: '#404000',
  BALL_TRAIL: '#808018',

  HUD_BG: '#000018',
  HUD_TEXT: '#E8E840',
  HUD_BORDER: '#5050A0',

  CROWD_BG: '#180830',
  CROWD_TIER1: '#201040',
  CROWD_TIER2: '#281050',

  FLASH_WHITE: '#FFFFFF',
  SMASH_STAR: '#FFE040',

  BLACK: '#000000',
  WHITE: '#FFFFFF',
};

export const CHARACTERS = [
  {
    id: 0,
    name: 'THE BANGER',
    stats: { power: 5, speed: 2, spin: 2 },
    color: '#E04040',
    description: 'PURE POWER',
    spriteScale: 1.25,
  },
  {
    id: 1,
    name: 'THE DINKER',
    stats: { power: 1, speed: 4, spin: 5 },
    color: '#40E040',
    description: 'SOFT TOUCH',
    spriteScale: 0.85,
  },
  {
    id: 2,
    name: 'THE LOBSTER',
    stats: { power: 3, speed: 2, spin: 4 },
    color: '#E08040',
    description: 'HIGH ARC',
    spriteScale: 1.1,
  },
  {
    id: 3,
    name: 'THE POACHER',
    stats: { power: 4, speed: 5, spin: 2 },
    color: '#4040E0',
    description: 'NET ATTACK',
    spriteScale: 1.0,
  },
];

export const GAME_STATES = {
  SERVE: 'SERVE',
  RALLY: 'RALLY',
  POINT: 'POINT',
  GAME_OVER: 'GAME_OVER',
};
