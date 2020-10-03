import { AudioSource } from './audioSpeaker';
import ECS from './ECS';
import { sightSystem } from './systems/being';
import { positionSystem } from './systems/besic';
import { TypelessEvent } from './typelessEvent';

const DISTANCE_MULTIP = 10000;

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
  }

  getAudioContext() {
    return this.audioCtx;
  }

  setPlayer(player: ECS.Entity) {
    this.player = player;
  }

  setListenerPosition(x: number, y: number, z = 10) {
    const listener = this.audioCtx.listener;
    [
      listener.positionX.value,
      listener.positionY.value,
      listener.positionZ.value,
    ] = [x, y, z];
  }

  getSpeaker({ name, audios }: SpeakerProperty) {
    if (!this.speakers[name]) {
      this.speakers[name] = new AudioSource(audios, this.audioCtx);
    }
    return this.speakers[name];
  }

  canListen(x: number, y: number, z: number) {
    if (!this.player) {
      return false;
    }
    const playerP = this.player.getComponent(positionSystem)!;
    if (z !== playerP.z) {
      return false;
    }
    const { visibleCells } = this.player.getComponent(sightSystem)!;
    return !!visibleCells[`${x},${y}`];
  }

  listenOn(target: TypelessEvent, type: string, sounds: SpeakerProperty) {
    const speaker = this.getSpeaker(sounds);
    target.addEventListener(type, (x: number, y: number, z: number) => {
      if (!this.canListen(x, y, z)) {
        return;
      }
      speaker.playAt(x * DISTANCE_MULTIP, y * DISTANCE_MULTIP);
    });
  }

  listenRandomOn(target: TypelessEvent, type: string, sounds: SpeakerProperty) {
    const speaker = this.getSpeaker(sounds);
    target.addEventListener(type, (x: number, y: number, z: number) => {
      if (!this.canListen(x, y, z)) {
        return;
      }
      speaker.playRandomAt(x * DISTANCE_MULTIP, y * DISTANCE_MULTIP);
    });
  }
}

export const MainSoundEngine = new SoundEngine();
