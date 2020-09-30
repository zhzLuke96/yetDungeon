import { Glyph, GlyphProperties } from './glyph';
import { Repository } from './repository';

interface ItemProperties extends GlyphProperties {
  name?: string;
}

export class Item extends Glyph {
  name: string;
  constructor(properties: ItemProperties) {
    super(properties);

    this.name = properties.name || '';
  }

  describe() {
    return this.name;
  }

  describeA(capitalize: boolean) {
    // Optional parameter to capitalize the a/an.
    const prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    const describe = this.describe();
    const firstLetter = describe.charAt(0).toLowerCase();
    // If word starts by a vowel, use an, else use a. Note that this is not perfect.
    const prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;

    return prefixes[prefix] + ' ' + describe;
  }
}

export const ItemRepository = new Repository(
  'items',
  (properties: ItemProperties) => new Item(properties)
);

ItemRepository.define('apple', {
  name: 'apple',
  character: '%',
  foreground: 'red',
  describe: '🍎苹果，吃了可以饱腹',
});

ItemRepository.define('rock', {
  name: 'rock',
  character: '*',
  foreground: 'white',
  describe: '一块小石头',
});
