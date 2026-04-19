import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import TitleScreen      from './src/screens/TitleScreen';
import CharacterSelect  from './src/screens/CharacterSelect';
import GameScreen       from './src/screens/GameScreen';
import VictoryScreen    from './src/screens/VictoryScreen';

const DEFAULT_CONFIG = {
  mode:        'VS_CPU',
  difficulty:  1,
  player1Char: 0,
  player2Char: 1,
};

export default function App() {
  const [screen,     setScreen]     = useState('TITLE');
  const [gameConfig, setGameConfig] = useState(DEFAULT_CONFIG);

  const navigate = (nextScreen, configPatch = null) => {
    if (configPatch) {
      setGameConfig(prev => ({ ...prev, ...configPatch }));
    }
    setScreen(nextScreen);
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {screen === 'TITLE'            && <TitleScreen     navigate={navigate}                         />}
      {screen === 'CHARACTER_SELECT' && <CharacterSelect navigate={navigate} gameConfig={gameConfig} />}
      {screen === 'GAME'             && <GameScreen      navigate={navigate} gameConfig={gameConfig} />}
      {screen === 'VICTORY'          && <VictoryScreen   navigate={navigate} gameConfig={gameConfig} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
