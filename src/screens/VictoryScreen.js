import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { CHARACTERS } from '../constants';

export default function VictoryScreen({ navigate, gameConfig }) {
  const { matchWinner = 0, player1Char = 0, player2Char = 1 } = gameConfig;
  const winner = matchWinner === 0 ? CHARACTERS[player1Char] : CHARACTERS[player2Char];
  const loser  = matchWinner === 0 ? CHARACTERS[player2Char] : CHARACTERS[player1Char];

  const [frame, setFrame] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;
  const flash  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 100);

    // Trophy bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -12, duration: 300, useNativeDriver: true }),
        Animated.timing(bounce, { toValue:   0, duration: 300, useNativeDriver: true }),
      ])
    ).start();

    // Background flash
    Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(id);
  }, []);

  const flashBg = flash.interpolate({
    inputRange:  [0, 1],
    outputRange: [winner.color + '22', winner.color + '55'],
  });

  // Animated star particles
  const stars = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist  = 60 + (frame % 20) * 2;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      vis: (frame + i * 3) % 6 < 3,
    };
  });

  return (
    <Animated.View style={[s.root, { backgroundColor: flashBg }]}>
      <View style={s.scanlines} pointerEvents="none" />

      {/* Star burst */}
      <View style={s.starField} pointerEvents="none">
        {stars.map((st, i) => st.vis && (
          <View
            key={i}
            style={[s.star, {
              transform: [{ translateX: st.x }, { translateY: st.y }],
              backgroundColor: winner.color,
            }]}
          />
        ))}
      </View>

      {/* Winner banner */}
      <View style={s.banner}>
        <Text style={s.bannerTop}>WINNER!</Text>
        <Animated.Text
          style={[s.winnerName, { color: winner.color, transform: [{ translateY: bounce }] }]}
        >
          {winner.name}
        </Animated.Text>
        <Text style={[s.playerLabel, { color: winner.color }]}>
          {matchWinner === 0 ? 'PLAYER 1' : (gameConfig.mode === 'VS_CPU' ? 'CPU' : 'PLAYER 2')}
        </Text>
      </View>

      {/* Trophy */}
      <Animated.View style={[s.trophy, { transform: [{ translateY: bounce }] }]}>
        <Text style={s.trophyEmoji}>🏆</Text>
        <Text style={[s.trophyText, { color: winner.color }]}>CHAMPION</Text>
      </Animated.View>

      {/* Score summary */}
      <View style={s.scoreBox}>
        <Text style={s.scoreLabel}>FINAL SCORE</Text>
        <Text style={s.scoreVal}>
          <Text style={{ color: CHARACTERS[player1Char].color }}>
            {CHARACTERS[player1Char].name}
          </Text>
          {'  vs  '}
          <Text style={{ color: CHARACTERS[player2Char].color }}>
            {gameConfig.mode === 'VS_CPU' ? 'CPU' : CHARACTERS[player2Char].name}
          </Text>
        </Text>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.rematch}
          onPress={() => navigate('GAME', gameConfig)}
        >
          <Text style={s.rematchText}>▶ REMATCH</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.title}
          onPress={() => navigate('TITLE')}
        >
          <Text style={s.titleText}>◄ TITLE</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'repeating-linear-gradient(transparent,transparent 1px,rgba(0,0,0,0.2) 1px,rgba(0,0,0,0.2) 2px)',
    pointerEvents: 'none',
    zIndex: 10,
  },
  starField: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: '40%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    width: 6,
    height: 6,
  },
  banner: { alignItems: 'center', marginBottom: 16 },
  bannerTop: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 8,
    backgroundColor: '#000040',
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 4,
    textShadowColor: '#4040FF',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  winnerName: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
    textShadowColor: '#00000080',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  playerLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 4,
    marginTop: 2,
  },
  trophy: { alignItems: 'center', marginBottom: 16 },
  trophyEmoji: { fontSize: 52 },
  trophyText: {
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  scoreBox: {
    borderWidth: 1,
    borderColor: '#5050A0',
    backgroundColor: '#0A0A20',
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 280,
  },
  scoreLabel: {
    color: '#E8E840',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 6,
  },
  scoreVal: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#FFFFFF',
  },
  actions: { flexDirection: 'row', gap: 16 },
  rematch: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: '#E8E840',
    backgroundColor: '#202008',
  },
  rematchText: {
    color: '#E8E840',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#5050A0',
    backgroundColor: '#101028',
  },
  titleText: {
    color: '#A0A0FF',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
