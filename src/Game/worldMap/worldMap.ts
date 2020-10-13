import * as ROT from 'rot-js';

const t = () => new ROT.Noise.Simplex();
type Simplex = ReturnType<typeof t>;

export interface WorldMapI {
  getTiles(
    topLeftX: number,
    topLeftY: number,
    bottomRightX: number,
    bottomRightY: number
  ): number[][]; // returns tiles height level
  setSeed(seed: number): void;
  getSeed(): number;
}

// 将来需要支持z轴的world

// 1 layer
// TODO: more layer mixin
class WorldMap {
  private noiseParam = 0.06;
  private height = 1;
  private numPasses = 3;
  private roughness = 0.2;
  private persistence = 1;

  private scale = 5;

  private noise: Simplex;

  constructor(seed = Math.floor(Math.random() * 65535)) {
    this.noise = new ROT.Noise.Simplex(1024);
  }

  // TODO: cache map
  getHeightMap(
    topLeftX: number,
    topLeftY: number,
    bottomRightX: number,
    bottomRightY: number
  ): number[][] {
    const h = bottomRightY - topLeftY;
    const w = bottomRightX - topLeftX;
    const map: number[][] = new Array(h);
    for (let j = 0; j < h; j++) {
      map[j] = new Array(w);
      for (let i = 0; i < w; i++) {
        let frenquency = this.noiseParam;
        let amp = this.height;
        let z = 0;
        for (const _ of Array.from({ length: this.numPasses })) {
          z += this.noise.get(
            ((i + topLeftX) / this.scale) * frenquency,
            ((j + topLeftY) / this.scale) * frenquency * amp
          );
          frenquency *= this.roughness;
          amp *= this.persistence;
        }
        map[j][i] = z;
      }
    }
    return map;
  }

  getNormalizationMap(
    topLeftX: number,
    topLeftY: number,
    bottomRightX: number,
    bottomRightY: number,
    max: number,
    min: number,
    layer: number[]
  ): number[][] {
    const hmap = this.getHeightMap(
      topLeftX,
      topLeftY,
      bottomRightX,
      bottomRightY
    );
    return normalization(hmap, max, min, layer);
  }

  updateSeed(seed: number) {
    this.noise = new ROT.Noise.Simplex(seed);
  }
}

export const MainWorldMap = new WorldMap();

function normalization(
  hmap: number[][],
  max: number,
  min: number,
  layer: number[]
) {
  const toLayer = (n: number) => {
    const p = (n - min) / max;
    const l = layer.findIndex((hp) => p < hp);
    if (l === -1) return layer.length - 1;
    return l;
  };

  return hmap.map((row) => row.map(toLayer));
}
