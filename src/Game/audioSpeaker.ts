// web audio

interface AudioProperty {
  path: string;
  name: string;
  maxVolume: number; // 0 ~ 1
}

export class AudioSpeaker {
  private sources: AudioBuffer[];
  private ctx: AudioContext;
  private panner: PannerNode;

  constructor(audios: any[], ctx: AudioContext) {
    this.ctx = ctx;
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.connect(ctx.destination);
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

  playRandomAt(soundX: number, soundY: number, soundZ = 0) {
    this.playAt(
      soundX,
      soundY,
      soundZ,
      Math.floor(Math.random() * this.sources.length)
    );
  }

  playAt(soundX: number, soundY: number, soundZ = 0, playIdx = 0) {
    if (this.isEmpty()) {
      return;
    }
    // no problem with electron.
    this.panner.setPosition(soundX, soundY, soundZ);
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
    source.connect(this.ctx.destination);
    source.start();
  }
}
