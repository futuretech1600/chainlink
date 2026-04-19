export class SoundEngine {
  constructor() {
    this.ready = false;
    this.synth = null;
    this.noiseSynth = null;
    this.polySynth = null;
  }

  async init() {
    try {
      const Tone = await import('tone');
      const T = Tone.default || Tone;

      this.synth = new T.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
        volume: -12,
      }).toDestination();

      this.noiseSynth = new T.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03 },
        volume: -18,
      }).toDestination();

      this.polySynth = new T.PolySynth(T.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2 },
        volume: -14,
      }).toDestination();

      this._Tone = T;
      this.ready = true;
    } catch (e) {
      // Audio unavailable — silently continue
    }
  }

  async play(sound) {
    if (!this.ready) return;
    try {
      await this._Tone.start();
      switch (sound) {
        case 'hit':
          this.synth.triggerAttackRelease('C5', '32n');
          break;
        case 'hit_hard':
          this.synth.triggerAttackRelease('G5', '16n');
          break;
        case 'dink':
          this.synth.triggerAttackRelease('A4', '64n');
          break;
        case 'lob':
          this.synth.triggerAttackRelease('E4', '32n');
          break;
        case 'net':
          this.noiseSynth.triggerAttackRelease('16n');
          break;
        case 'bounce':
          this.synth.triggerAttackRelease('D3', '64n');
          break;
        case 'out':
          this.synth.triggerAttackRelease('Bb2', '8n');
          break;
        case 'score': {
          const T = this._Tone;
          this.polySynth.triggerAttackRelease(['C4', 'E4', 'G4'], '8n');
          const now = T.now();
          this.polySynth.triggerAttackRelease(['E4', 'G4', 'C5'], '8n', now + 0.2);
          this.polySynth.triggerAttackRelease(['G4', 'C5', 'E5'], '4n', now + 0.4);
          break;
        }
        case 'victory': {
          const T = this._Tone;
          const now = T.now();
          const melody = ['C4','E4','G4','C5','B4','G4','E4','C4','E4','G4','C5'];
          melody.forEach((note, i) => {
            this.polySynth.triggerAttackRelease(note, '8n', now + i * 0.15);
          });
          break;
        }
      }
    } catch {
      // Ignore playback errors
    }
  }
}
