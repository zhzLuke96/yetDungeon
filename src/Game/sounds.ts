import { MainSoundEngine } from './soundEngine';

export const GlobalSounds = {
  sandBlockSound: MainSoundEngine.createTrigger({
    name: 'floorSound',
    audios: [
      require('./assets/sounds/step/sand1.ogg'),
      require('./assets/sounds/step/sand2.ogg'),
      require('./assets/sounds/step/sand3.ogg'),
      require('./assets/sounds/step/sand4.ogg'),
    ],
  }),
  stoneBlockSound: MainSoundEngine.createTrigger({
    name: 'stoneSound',
    audios: [
      require('./assets/sounds/step/stone1.ogg'),
      require('./assets/sounds/step/stone2.ogg'),
      require('./assets/sounds/step/stone3.ogg'),
      require('./assets/sounds/step/stone4.ogg'),
    ],
  }),
  stoneDiggedSound: MainSoundEngine.createTrigger({
    name: 'stoneDigged',
    audios: [
      require('./assets/sounds/dig/stone1.ogg'),
      require('./assets/sounds/dig/stone2.ogg'),
      require('./assets/sounds/dig/stone3.ogg'),
      require('./assets/sounds/dig/stone4.ogg'),
    ],
  }),
  grassDiggedSound: MainSoundEngine.createTrigger({
    name: 'grassDigged',
    audios: [
      require('./assets/sounds/dig/grass1.ogg'),
      require('./assets/sounds/dig/grass2.ogg'),
      require('./assets/sounds/dig/grass3.ogg'),
      require('./assets/sounds/dig/grass4.ogg'),
    ],
  }),
};
