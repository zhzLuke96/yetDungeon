// web audio

import { TypelessEvent } from './typelessEvent';

// TODO: 由于不是实时游戏，音效应该做一个限制，一定时间一个speaker只播放一次，不然会鬼畜

// TODO: 隔墙音效，搁着实体应该也可以听到声音
export class AudioSource {
  private sources: AudioBuffer[];
  private ctx: AudioContext;
  private panner: PannerNode;
  private gain: GainNode;

  constructor(audios: any[], ctx: AudioContext) {
    this.ctx = ctx;
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.connect(ctx.destination);
    this.gain = ctx.createGain();
    this.gain.connect(this.panner);
    this.sources = [];

    // node require to { default: [path] as sting }
    audios = audios.map((a) => a.default || a) as string[];
    this.loadAudios(audios);
  }

  isEmpty() {
    return this.sources.length === 0;
  }

  getAudio(idx = 0) {
    return this.sources[Math.min(this.sources.length - 1, Math.max(0, idx))];
  }

  playRandomAt(soundX: number, soundY: number, soundZ = 0, level = 1) {
    this.playAt(
      soundX,
      soundY,
      soundZ,
      Math.floor(Math.random() * this.sources.length),
      level
    );
  }

  playAt(soundX: number, soundY: number, soundZ = 0, playIdx = 0, level = 1) {
    if (this.isEmpty()) {
      return;
    }
    // no problem with electron.
    this.panner.positionX.value = soundX;
    this.panner.positionY.value = soundY;
    this.panner.positionZ.value = soundZ;

    // set volume
    this.gain.gain.value = level;

    const buffer = this.getAudio(playIdx);
    this.processAudio(buffer);
  }

  private async loadAudios(paths: string[]) {
    const { ctx } = this;
    const sources = await Promise.all(
      paths.map((path) =>
        fetch(path)
          .then((res) => res.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data))
          // TODO: Global error catcher and report
          .catch((err) => console.error(err))
      )
    );
    // filter error result
    this.sources = sources.filter(Boolean) as AudioBuffer[];
  }

  private async processAudio(buffer: AudioBuffer) {
    const { ctx } = this;
    const source = ctx.createBufferSource();
    source.connect(this.panner);
    source.buffer = buffer;
    this.panner.connect(ctx.destination);
    source.start();
  }
}
