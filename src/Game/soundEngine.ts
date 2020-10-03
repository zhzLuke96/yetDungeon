import { AudioSource } from './audioSource';
import ECS from './ECS';
import { sightSystem } from './systems/being';
import { positionSystem } from './systems/besic';

const DISTANCE_MULTIP = 2;

interface SpeakerProperty {
  name: string; // uniqid name for speaker
  audios: string[]; // audio file paths
}

class SoundEngine {
  private speakers: { [name: string]: AudioSource };
  private audioCtx: AudioContext;
  private player: ECS.Entity | null;

  constructor() {
    this.speakers = {};
    this.audioCtx = new AudioContext();
    this.player = null;
    const listener = this.audioCtx.listener;
    [
      listener.positionX.value,
      listener.positionY.value,
      listener.positionZ.value,
    ] = [0, 0, 10];
  }

  getAudioContext() {
    return this.audioCtx;
  }

  setPlayer(player: ECS.Entity) {
    this.player = player;
  }

  getSource({ name, audios }: SpeakerProperty) {
    if (!this.speakers[name]) {
      this.speakers[name] = new AudioSource(audios, this.audioCtx);
    }
    return this.speakers[name];
  }

  canListen(x: number, y: number, z: number) {
    if (!this.player) {
      return;
    }
    const playerP = this.player.getComponent(positionSystem)!;
    if (z !== playerP.z) {
      return;
    }
    const { visibleCells } = this.player.getComponent(sightSystem)!;
    const level = visibleCells[`${x},${y}`];
    if (!level) {
      return;
    }
    const x1 = (playerP.x - x > 0 ? -1 : 1) * level;
    const y1 = (playerP.y - y > 0 ? 1 : -1) * level;
    return [x1, y1, level];
  }

  createTrigger(props: SpeakerProperty) {
    const source = this.getSource(props);
    return (x: number, y: number, z: number) => {
      const listenLevel = this.canListen(x, y, z);
      if (listenLevel === undefined) {
        return;
      }
      const [x1, y1, level] = listenLevel;
      source.playRandomAt(x1 * DISTANCE_MULTIP, y1 * DISTANCE_MULTIP, 0, level);
    };
  }

  static p2Distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
}

export const MainSoundEngine = new SoundEngine();
