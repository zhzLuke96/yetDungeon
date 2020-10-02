import { AudioSpeaker } from './audioSpeaker';
import { Player } from './entities';
import { Entity } from './entity';
import { TypelessEvent } from './typelessEvent';

const DISTANCE_MULTIP = 10000;

interface SpeakerProperty {
  name: string; // uniqid name for speaker
  audios: string[]; // audio file paths
}

class SoundEngine {
  private speakers: { [name: string]: AudioSpeaker };
  private audioCtx: AudioContext;
  private player: Player | null;

  constructor() {
    this.speakers = {};
    this.audioCtx = new AudioContext();
    this.player = null;
  }

  getAudioContext() {
    return this.audioCtx;
  }

  setPlayer(player: Player) {
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
      this.speakers[name] = new AudioSpeaker(audios, this.audioCtx);
    }
    return this.speakers[name];
  }

  canListen(x: number, y: number, z: number) {
    if (!this.player) {
      return false;
    }
    if (z !== this.player.getZ()) {
      return false;
    }
    const visibleCells = this.player.computeVisiblesCells();
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
