import * as Tone from 'tone';

// Synth cho hiệu ứng âm thanh (SFX)
const sfxSynth = new Tone.PolySynth(Tone.Synth).toDestination();

// Synth cho nhạc nền (BGM)
const bgmSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } }).toDestination();
bgmSynth.set({ volume: -15 });

export const playMoveSound = () => {
  if (Tone.context.state !== 'running') return;
  sfxSynth.triggerAttackRelease("C4", "16n");
};

export const playClickSound = () => {
  if (Tone.context.state !== 'running') return;
  sfxSynth.triggerAttackRelease("G4", "32n");
};

export const playWinSound = () => {
  if (Tone.context.state !== 'running') return;
  const now = Tone.now();
  sfxSynth.triggerAttackRelease("C4", "8n", now);
  sfxSynth.triggerAttackRelease("E4", "8n", now + 0.1);
  sfxSynth.triggerAttackRelease("G4", "8n", now + 0.2);
  sfxSynth.triggerAttackRelease("C5", "4n", now + 0.3);
};

export const playLoseSound = () => {
  if (Tone.context.state !== 'running') return;
  const now = Tone.now();
  sfxSynth.triggerAttackRelease("G3", "8n", now);
  sfxSynth.triggerAttackRelease("E3", "8n", now + 0.1);
  sfxSynth.triggerAttackRelease("C3", "4n", now + 0.2);
};

export const playTickSound = () => {
  if (Tone.context.state !== 'running') return;
  sfxSynth.triggerAttackRelease("B4", "32n");
};

let currentBgmPart: Tone.Part | null = null;
let currentBgmType: 'lobby' | 'battle' | null = null;

const stopBgm = () => {
  if (currentBgmPart) {
    currentBgmPart.stop();
    currentBgmPart.dispose();
    currentBgmPart = null;
    currentBgmType = null;
  }
};

export const startLobbyMusic = () => {
  if (currentBgmType === 'lobby' || Tone.context.state !== 'running') return;
  stopBgm();

  const melody = [
    ["0:0", "C3"], ["0:1", "E3"], ["0:2", "G3"], ["0:3", "E3"],
    ["1:0", "A3"], ["1:1", "G3"], ["1:2", "E3"], ["1:3", "D3"]
  ];

  currentBgmPart = new Tone.Part((time, note) => {
    bgmSynth.triggerAttackRelease(note, "8n", time);
  }, melody);

  currentBgmPart.loop = true;
  currentBgmPart.loopEnd = "2m";
  currentBgmType = 'lobby';
  
  Tone.getTransport().start();
  currentBgmPart.start(0);
};

export const startBattleMusic = () => {
  if (currentBgmType === 'battle' || Tone.context.state !== 'running') return;
  stopBgm();

  // Nhạc kịch tính hơn, nhanh hơn
  const melody = [
    ["0:0", "A2"], ["0:0.5", "A2"], ["0:1", "C3"], ["0:1.5", "C3"],
    ["0:2", "E3"], ["0:2.5", "E3"], ["0:3", "G3"], ["0:3.5", "E3"],
    ["1:0", "A2"], ["1:0.5", "A2"], ["1:1", "D3"], ["1:1.5", "D3"],
    ["1:2", "F3"], ["1:2.5", "F3"], ["1:3", "E3"], ["1:3.5", "D3"]
  ];

  currentBgmPart = new Tone.Part((time, note) => {
    bgmSynth.triggerAttackRelease(note, "16n", time);
  }, melody);

  currentBgmPart.loop = true;
  currentBgmPart.loopEnd = "2m";
  currentBgmType = 'battle';
  
  Tone.getTransport().bpm.value = 140; // Tăng tempo cho battle
  Tone.getTransport().start();
  currentBgmPart.start(0);
};

export const stopAllMusic = () => {
  stopBgm();
  Tone.getTransport().stop();
};

export const setMuted = (muted: boolean) => {
  Tone.getDestination().mute = muted;
};

