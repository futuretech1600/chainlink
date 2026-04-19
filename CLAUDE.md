# PickleBall Genesis

A 2-player pickleball game with authentic Sega Genesis (Mega Drive) aesthetics.
16-bit pixel art, chiptune audio, CRT scanlines, Genesis color palette — feels like 1993.

## Quick Start

```bash
npm install
npm run web    # Primary: Expo Web in browser
npm run ios    # Expo Go on iPhone (requires Expo Go app)
```

## Platform Notes

- **Web** (primary): Full canvas rendering via HTML5 Canvas, all features work
- **iOS/Android**: Uses `expo-gl` + `expo-2d-context` for canvas; requires Expo Go app
- Canvas renders at **320×224** (Genesis native), upscaled 3× with nearest-neighbor

## Architecture

```
App.js                        ← Screen router (TITLE → CHARACTER_SELECT → GAME → VICTORY)
src/
├── constants/index.js        ← Canvas dims, court geometry, Genesis palette, character defs
├── game/
│   ├── GameEngine.js         ← Master state machine, 60fps update loop, rule enforcement
│   ├── PhysicsEngine.js      ← Ball arc (x/y/z), net collision, bounce, kitchen check
│   ├── InputHandler.js       ← Keyboard (WASD+ZXC) + touch D-pad/buttons
│   ├── AIPlayer.js           ← 3-difficulty CPU (reaction delay + ball prediction)
│   └── SoundEngine.js        ← Tone.js chiptune (square wave hits, score fanfare)
├── entities/
│   ├── Court.js              ← Checkerboard surface, kitchen zone, net, posts
│   ├── Player.js             ← 4-character sprites, walk/swing animation, paddle
│   ├── Ball.js               ← Ghost trail, z-shadow projection, smash starburst
│   └── Crowd.js              ← Animated pixel crowd with wave effect
├── screens/
│   ├── TitleScreen.js        ← Shimmer title, mini court, 3-item menu
│   ├── CharacterSelect.js    ← Stat bars, VS preview, 2-player pick support
│   ├── GameScreen.js         ← Canvas loop + touch overlay (D-pad + A/B/C buttons)
│   └── VictoryScreen.js      ← Bounce animation, star particles, rematch/title
└── ui/
    ├── HUD.js                ← Bitmap pixel digits, serve arrow, set pips, flash tint
    └── Scanlines.js          ← CRT scanline pass (every other row, 13% alpha)
```

## Game Rules Implemented

- 11-point games, win by 2; best of 3 sets
- **Kitchen (NVZ) enforcement** — volleying from kitchen = fault
- **Double-bounce rule** — ball must bounce once each side before volleys allowed
- **Side-out scoring** — serve transfers to winner of each rally
- Diagonal cross-court serve
- Three shot types: Dink (soft), Drive (power), Lob (high arc)

## Controls

### Keyboard (web)
| Action | P1 | P2 (VS mode) |
|--------|-----|------|
| Move | WASD / Arrow keys | IJKL |
| Dink | Z | U |
| Drive | X | O |
| Lob | C | P |

### Touch (mobile)
- Left side: virtual D-pad
- Right side: A (Dink), B (Drive), C (Lob) buttons

## Characters

| Name | Power | Speed | Spin | Feel |
|------|-------|-------|------|------|
| THE BANGER  | 5 | 2 | 2 | Big, slow, devastating drives |
| THE DINKER  | 1 | 4 | 5 | Small, nimble, soft-shot master |
| THE LOBSTER | 3 | 2 | 4 | Tall, high-arc specialist |
| THE POACHER | 4 | 5 | 2 | Fast net aggressor |

Stats scale shot speed (`power`) and movement speed (`speed`).

## Visual Effects

| Effect | Implementation |
|--------|---------------|
| Ball trail | 4-frame ghost positions stored in `ball.trail` |
| Screen shake | 8px random offset for 6 frames on DRIVE shots |
| Score flash | Full-screen tint (red/blue) for 12 frames on point |
| Smash starburst | 8-point star, spreads over 8 frames |
| Scanlines | Every other row darkened in `renderScanlines()` |
| Crowd wave | Column-offset sine wave via `frameCount` |

## Physics Model

Ball has `(x, y, z)` position where `z` = height above court:
- `vz` decreases by `GRAVITY = 280 px/s²` each frame
- On `z ≤ 0`: bounce with `BOUNCE_RESTITUTION = 0.55`
- Net collision: if ball crosses `NET_Y` while `z < NET_HEIGHT (12px)` → blocked
- Display Y = `y - z * 0.28` (isometric projection feel)

## Key Constants (src/constants/index.js)

```
CANVAS_W/H   320 × 224      (Genesis native resolution)
DISPLAY_SCALE  3             (rendered at 960×672)
NET_Y          112           (vertical midpoint of court area)
KITCHEN_DEPTH  44px          (from net to kitchen line, each side)
POINTS_TO_WIN  11, WIN_BY 2
SETS_TO_WIN    2
```

## Dependencies

```json
"expo": "~50.0.0"
"expo-gl": "~13.6.0"          ← WebGL surface for mobile canvas
"expo-2d-context": "^1.0.2"   ← 2D canvas API over expo-gl
"tone": "^14.7.77"            ← Chiptune audio synthesis
"react-native-reanimated": "~3.6.2"
"@react-native-async-storage/async-storage": "1.21.0"
```

## Adding Features

**New character**: Add entry to `CHARACTERS` array in `src/constants/index.js`.

**New shot type**: Add case to `hitBall()` in `PhysicsEngine.js`, wire button in `GameEngine._updateRally()`.

**AI difficulty**: Adjust `REACTION_DELAY`, `ACCURACY`, `SPEED` arrays in `AIPlayer.js`.

**New screen**: Create in `src/screens/`, add route in `App.js` `navigate()` switch.
