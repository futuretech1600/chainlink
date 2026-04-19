import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, PanResponder, TouchableOpacity, Text } from 'react-native';
import { CANVAS_W, CANVAS_H, DISPLAY_SCALE, GAME_STATES, COLORS } from '../constants';
import { GameEngine } from '../game/GameEngine';
import { InputHandler } from '../game/InputHandler';
import { renderCrowd } from '../entities/Crowd';
import { renderCourt } from '../entities/Court';
import { renderPlayer } from '../entities/Player';
import { renderBall, renderSmashEffect } from '../entities/Ball';
import { renderHUD } from '../ui/HUD';
import { renderScanlines } from '../ui/Scanlines';

// ── Canvas abstraction (web: HTMLCanvas, mobile: expo-gl) ──────────────────
let GLView = null;
let Expo2DContext = null;
if (Platform.OS !== 'web') {
  try {
    GLView = require('expo-gl').GLView;
    Expo2DContext = require('expo-2d-context').default;
  } catch {
    // Fallback silently
  }
}

// ── Main render function ───────────────────────────────────────────────────
function renderFrame(ctx, engine) {
  const state = engine.getState();
  const { screenShakeX, screenShakeY, smashEffects } = state;

  ctx.save();
  if (screenShakeX || screenShakeY) {
    ctx.translate(Math.round(screenShakeX), Math.round(screenShakeY));
  }

  renderCrowd(ctx, state.frameCount);
  renderCourt(ctx);
  renderPlayer(ctx, state.players[0], state.frameCount);
  renderPlayer(ctx, state.players[1], state.frameCount);
  renderBall(ctx, state.ball);
  smashEffects.forEach(e => renderSmashEffect(ctx, e));
  renderHUD(ctx, state);
  renderScanlines(ctx);

  ctx.restore();

  // Full-screen score flash
  if (state.scoreFlashTimer > 0) {
    ctx.globalAlpha = (state.scoreFlashTimer / 12) * 0.25;
    ctx.fillStyle = state.pointWinner === 0 ? '#FF2020' : '#2020FF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.globalAlpha = 1.0;
  }
}

// ── Web canvas component ───────────────────────────────────────────────────
function WebCanvas({ engine, inputHandler }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const lastRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let running = true;
    const loop = (ts) => {
      if (!running) return;
      const dt = Math.min((ts - (lastRef.current || ts)) / 1000, 0.05);
      lastRef.current = ts;
      engine.update(dt, inputHandler);
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      renderFrame(ctx, engine);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [engine, inputHandler]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        width:  CANVAS_W * DISPLAY_SCALE,
        height: CANVAS_H * DISPLAY_SCALE,
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}

// ── Mobile GL canvas component ─────────────────────────────────────────────
function MobileCanvas({ engine, inputHandler }) {
  if (!GLView || !Expo2DContext) {
    return (
      <View style={{ width: CANVAS_W * DISPLAY_SCALE, height: CANVAS_H * DISPLAY_SCALE, backgroundColor: '#000018' }}>
        <Text style={{ color: '#E8E840', fontFamily: 'monospace', margin: 8 }}>
          Canvas unavailable — run via Expo Web
        </Text>
      </View>
    );
  }

  const onContextCreate = useCallback((gl) => {
    const ctx = new Expo2DContext(gl, { renderWithOffscreenBuffer: true });
    let lastTime = null;
    let animId;

    const loop = (ts) => {
      const dt = Math.min((ts - (lastTime || ts)) / 1000, 0.05);
      lastTime = ts;
      engine.update(dt, inputHandler);
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      renderFrame(ctx, engine);
      ctx.flush();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine, inputHandler]);

  return (
    <GLView
      style={{ width: CANVAS_W * DISPLAY_SCALE, height: CANVAS_H * DISPLAY_SCALE }}
      onContextCreate={onContextCreate}
    />
  );
}

// ── Touch control overlays ────────────────────────────────────────────────
function DPad({ inputHandler }) {
  const makeDir = (dx, dy) => ({
    onPressIn:  () => inputHandler.onDpadChange(dx, dy),
    onPressOut: () => inputHandler.onDpadChange(0, 0),
  });

  return (
    <View style={dpadStyles.container}>
      <TouchableOpacity style={[dpadStyles.btn, dpadStyles.up]}    {...makeDir(0,-1)}>
        <Text style={dpadStyles.arrow}>▲</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[dpadStyles.btn, dpadStyles.down]}  {...makeDir(0, 1)}>
        <Text style={dpadStyles.arrow}>▼</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[dpadStyles.btn, dpadStyles.left]}  {...makeDir(-1,0)}>
        <Text style={dpadStyles.arrow}>◄</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[dpadStyles.btn, dpadStyles.right]} {...makeDir(1, 0)}>
        <Text style={dpadStyles.arrow}>►</Text>
      </TouchableOpacity>
    </View>
  );
}

function ActionButtons({ inputHandler }) {
  const btn = (label, key, color) => (
    <TouchableOpacity
      key={key}
      style={[btnStyles.btn, { backgroundColor: color }]}
      onPressIn={() => inputHandler.onButtonPress(key)}
      onPressOut={() => inputHandler.onButtonRelease(key)}
    >
      <Text style={btnStyles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={btnStyles.container}>
      {btn('C\nLOB',   'C', '#604080')}
      {btn('B\nDRIVE', 'B', '#804040')}
      {btn('A\nDINK',  'A', '#204060')}
    </View>
  );
}

// ── Main GameScreen ────────────────────────────────────────────────────────
export default function GameScreen({ navigate, gameConfig }) {
  const engineRef = useRef(null);
  const inputRef  = useRef(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine(gameConfig);
  }
  if (!inputRef.current) {
    inputRef.current = new InputHandler();
  }

  // Watch for game over
  useEffect(() => {
    const check = setInterval(() => {
      const state = engineRef.current?.getState();
      if (state?.gameState === GAME_STATES.GAME_OVER) {
        clearInterval(check);
        setTimeout(() => navigate('VICTORY', { matchWinner: state.matchWinner }), 500);
      }
    }, 500);
    return () => clearInterval(check);
  }, [navigate]);

  // Cleanup input handler
  useEffect(() => {
    return () => inputRef.current?.destroy();
  }, []);

  const CanvasComp = Platform.OS === 'web' ? WebCanvas : MobileCanvas;

  return (
    <View style={styles.root}>
      {/* Controls left */}
      <DPad inputHandler={inputRef.current} />

      {/* Game canvas */}
      <View style={styles.canvasWrap}>
        <CanvasComp engine={engineRef.current} inputHandler={inputRef.current} />
      </View>

      {/* Controls right */}
      <ActionButtons inputHandler={inputRef.current} />

      {/* Pause / back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigate('TITLE')}>
        <Text style={styles.backText}>■</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasWrap: {
    borderWidth: 2,
    borderColor: '#5050A0',
  },
  backBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    backgroundColor: '#200030',
    borderWidth: 1,
    borderColor: '#5050A0',
  },
  backText: {
    color: '#E8E840',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

const dpadStyles = StyleSheet.create({
  container: {
    width: 90,
    height: 90,
    position: 'relative',
    marginHorizontal: 12,
  },
  btn: {
    position: 'absolute',
    width: 28,
    height: 28,
    backgroundColor: '#202040',
    borderWidth: 1,
    borderColor: '#5050A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  up:    { top: 0,  left: 31 },
  down:  { bottom: 0, left: 31 },
  left:  { top: 31, left: 0 },
  right: { top: 31, right: 0 },
  arrow: { color: '#E8E840', fontSize: 10 },
});

const btnStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 12,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF40',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
