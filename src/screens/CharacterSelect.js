import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CHARACTERS } from '../constants';

function StatBar({ label, value, max = 5, color }) {
  return (
    <View style={sb.row}>
      <Text style={sb.label}>{label}</Text>
      <View style={sb.track}>
        {Array.from({ length: max }, (_, i) => (
          <View
            key={i}
            style={[sb.pip, { backgroundColor: i < value ? color : '#303050' }]}
          />
        ))}
      </View>
    </View>
  );
}

function CharCard({ char, selected, onPress, playerNum }) {
  return (
    <TouchableOpacity
      style={[card.root, selected && { borderColor: char.color, backgroundColor: '#101030' }]}
      onPress={onPress}
    >
      {/* Sprite placeholder */}
      <View style={[card.sprite, { borderColor: char.color }]}>
        <View style={[card.spriteBody, { backgroundColor: char.color }]} />
        <View style={card.spriteHead} />
        <View style={[card.spritePaddle, { borderColor: char.color }]} />
      </View>

      <Text style={[card.name, { color: char.color }]}>{char.name}</Text>
      <Text style={card.desc}>{char.description}</Text>

      <View style={card.stats}>
        <StatBar label="PWR" value={char.stats.power} color={char.color} />
        <StatBar label="SPD" value={char.stats.speed} color={char.color} />
        <StatBar label="SPN" value={char.stats.spin}  color={char.color} />
      </View>

      {selected && (
        <Text style={[card.badge, { color: char.color }]}>
          {playerNum === 0 ? '◀ P1' : 'P2 ▶'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function CharacterSelect({ navigate, gameConfig }) {
  const [p1Char, setP1Char] = useState(0);
  const [p2Char, setP2Char] = useState(1);
  const [picking, setPicking] = useState(0); // which player is picking

  const isTwoPlayer = gameConfig.mode === 'VS_PLAYER';

  const handleSelect = (id) => {
    if (picking === 0 || !isTwoPlayer) {
      setP1Char(id);
      if (isTwoPlayer) setPicking(1);
    } else {
      setP2Char(id);
    }
  };

  const handleStart = () => {
    navigate('GAME', {
      ...gameConfig,
      player1Char: p1Char,
      player2Char: isTwoPlayer ? p2Char : 1,
    });
  };

  return (
    <View style={s.root}>
      <View style={s.scanlines} pointerEvents="none" />

      <Text style={s.heading}>SELECT YOUR CHARACTER</Text>
      {isTwoPlayer && (
        <Text style={s.turn}>
          {picking === 0 ? '◀ PLAYER 1 — CHOOSE' : 'PLAYER 2 — CHOOSE ▶'}
        </Text>
      )}

      <View style={s.grid}>
        {CHARACTERS.map(ch => (
          <CharCard
            key={ch.id}
            char={ch}
            selected={ch.id === p1Char || (isTwoPlayer && ch.id === p2Char)}
            playerNum={ch.id === p1Char ? 0 : 1}
            onPress={() => handleSelect(ch.id)}
          />
        ))}
      </View>

      {/* VS preview */}
      <View style={s.vsBar}>
        <Text style={[s.vsName, { color: CHARACTERS[p1Char].color }]}>
          {CHARACTERS[p1Char].name}
        </Text>
        <Text style={s.vsLabel}>VS</Text>
        <Text style={[s.vsName, { color: CHARACTERS[isTwoPlayer ? p2Char : 1].color }]}>
          {isTwoPlayer ? CHARACTERS[p2Char].name : 'CPU'}
        </Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigate('TITLE')}>
          <Text style={s.backText}>◄ BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.startBtn} onPress={handleStart}>
          <Text style={s.startText}>START MATCH ►</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000018',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'repeating-linear-gradient(transparent,transparent 1px,rgba(0,0,0,0.18) 1px,rgba(0,0,0,0.18) 2px)',
    pointerEvents: 'none',
    zIndex: 10,
  },
  heading: {
    color: '#E8E840',
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 4,
    marginBottom: 4,
    textShadowColor: '#808000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  turn: {
    color: '#A0A0FF',
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  vsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  vsName: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  vsLabel: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: { flexDirection: 'row', gap: 16 },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#5050A0',
    backgroundColor: '#101028',
  },
  backText: { color: '#A0A0FF', fontFamily: 'monospace', fontSize: 12 },
  startBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E8E840',
    backgroundColor: '#202008',
  },
  startText: { color: '#E8E840', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },
});

const card = StyleSheet.create({
  root: {
    width: 130,
    padding: 8,
    borderWidth: 2,
    borderColor: '#303060',
    backgroundColor: '#0A0A20',
    alignItems: 'center',
  },
  sprite: {
    width: 40,
    height: 60,
    borderWidth: 1,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#181830',
    overflow: 'hidden',
    position: 'relative',
  },
  spriteBody: {
    width: 16,
    height: 26,
    position: 'absolute',
    bottom: 4,
  },
  spriteHead: {
    width: 10,
    height: 10,
    backgroundColor: '#D8A050',
    position: 'absolute',
    top: 10,
  },
  spritePaddle: {
    width: 8,
    height: 7,
    backgroundColor: '#D08818',
    borderWidth: 1,
    position: 'absolute',
    right: 4,
    bottom: 18,
  },
  name: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
    textAlign: 'center',
  },
  desc: {
    color: '#808080',
    fontFamily: 'monospace',
    fontSize: 7,
    marginBottom: 6,
    textAlign: 'center',
  },
  stats: { width: '100%' },
  badge: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 1 },
  label: { color: '#8080A0', fontFamily: 'monospace', fontSize: 8, width: 28 },
  track: { flexDirection: 'row', gap: 2 },
  pip: { width: 12, height: 8 },
});
