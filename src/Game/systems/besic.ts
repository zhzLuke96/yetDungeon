import ECS from '../ECS';

class AppearanceSystem extends ECS.System<{
  ch: string;
  fg: string;
  bg: string;
}> {
  createComponent(char = '', foreground = 'white', background = 'black') {
    return {
      ch: char,
      fg: foreground,
      bg: background,
    };
  }
}
export const appearanceSystem = new AppearanceSystem();

class PositionSystem extends ECS.System<{ x: number; y: number; z: number }> {
  createComponent(x = -1, y = -1, z = -1) {
    return {
      x,
      y,
      z,
    };
  }
}
export const positionSystem = new PositionSystem();

class TileSystem extends ECS.System<{
  diggable: boolean;
  walkable: boolean;
  blocksLight: boolean;
}> {
  createComponent(diggable = false, walkable = true, blocksLight = false) {
    return {
      diggable,
      walkable,
      blocksLight,
    };
  }
}
export const tileSystem = new TileSystem();

class ItemSystem extends ECS.System<{ name: string }> {
  createComponent(name: string) {
    return {
      name,
    };
  }
}
export const itemSystem = new ItemSystem();

interface Article {
  one: string;
  many: string;
}
const defaultArticle: Article = { one: 'one', many: 'many' };

class DescriptibleSystem extends ECS.System<{
  name: string;
  description: string;
  article: Article;
}> {
  createComponent(name: string, description: string, article = defaultArticle) {
    return {
      name,
      description,
      article,
    };
  }
}
export const descriptibleSystem = new DescriptibleSystem();
