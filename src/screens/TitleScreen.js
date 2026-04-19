import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const MENU_ITEMS = [
  { label: '▶  VS CPU',    mode: 'VS_CPU'     },
  { label: '▶  VS PLAYER', mode: 'VS_PLAYER'  },
  { label: '▶  PRACTICE',  mode: 'PRACTICE'   },
];

export default function TitleScreen({ navigate }) {
  const [blink, setBlink]       = useState(true);
  const [selected, setSelected] = useState(0);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 520);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    return () => clearInterval(id);
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={s.root}>
      {/* Scanline overlay */}
      <View style={s.scanlines} pointerEvents="none" />

      {/* Title block */}
      <View style={s.titleWrap}>
        <Text style={s.subtitle}>── SEGA GENESIS SPORTS ──</Text>
        <Animated.Text style={[s.title1, { opacity: shimmerOpacity }]}>
          PICKLEBALL
        </Animated.Text>
        <Text style={s.title2}>GENESIS</Text>
        <View style={s.divider} />
        <Text style={s.tagline}>16-BIT COURT ACTION</Text>
      </View>

      {/* Mini court graphic */}
      <View style={s.miniCourt}>
        <View style={s.miniNet} />
        <View style={[s.miniPlayer, { bottom: 6, backgroundColor: '#E04040' }]} />
        <View style={[s.miniPlayer, { top: 6, backgroundColor: '#4080E0' }]} />
        <View style={s.miniBall} />
      </View>

      {/* PRESS START */}
      {blink && <Text style={s.pressStart}>PRESS START</Text>}

      {/* Menu */}
      <View style={s.menu}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.mode}
            style={[s.menuRow, i === selected && s.menuRowActive]}
            onPress={() => navigate('CHARACTER_SELECT', { mode: item.mode })}
            onFocus={() => setSelected(i)}
          >
            <Text style={[s.menuText, i === selected && s.menuTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <Text style={s.footer}>© 2024  PICKLEBALL GENESIS  •  1-2 PLAYERS</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000018',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    // CSS-only scanline (web only — harmless on native)
    backgroundImage:
      'repeating-linear-gradient(transparent,transparent 1px,rgba(0,0,0,0.18) 1px,rgba(0,0,0,0.18) 2px)',
    pointerEvents: 'none',
    zIndex: 10,
  },
  titleWrap: { alignItems: 'center', marginBottom: 12 },
  subtitle: {
    color: '#6060A0',
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 6,
  },
  title1: {
    color: '#A0A0FF',
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 10,
    textShadowColor: '#4040FF',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  title2: {
    color: '#E8E840',
    fontFamily: 'monospace',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 6,
    textShadowColor: '#808000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    marginTop: -4,
  },
  divider: { width: 220, height: 3, backgroundColor: '#E8E840', marginVertical: 6 },
  tagline: {
    color: '#A0A040',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 4,
  },
  miniCourt: {
    width: 110,
    height: 75,
    backgroundColor: '#4040A0',
    borderWidth: 2,
    borderColor: '#C0C0FF',
    overflow: 'hidden',
    marginBottom: 14,
  },
  miniNet: {
    position: 'absolute',
    left: 0, right: 0,
    top: '50%',
    height: 3,
    backgroundColor: '#C0C0C0',
  },
  miniPlayer: {
    position: 'absolute',
    alignSelf: 'center',
    width: 10,
    height: 16,
  },
  miniBall: {
    position: 'absolute',
    left: '55%',
    top: '33%',
    width: 6,
    height: 6,
    backgroundColor: '#E0E040',
  },
  pressStart: {
    color: '#E8E840',
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 3,
    marginBottom: 14,
    textShadowColor: '#808000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  menu: { alignItems: 'stretch', minWidth: 200, marginBottom: 8 },
  menuRow: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    marginVertical: 2,
  },
  menuRowActive: {
    borderColor: '#E8E840',
    backgroundColor: '#101028',
  },
  menuText: {
    color: '#C0C0C0',
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 2,
  },
  menuTextActive: { color: '#E8E840' },
  footer: {
    position: 'absolute',
    bottom: 8,
    color: '#303050',
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 1,
  },
});
