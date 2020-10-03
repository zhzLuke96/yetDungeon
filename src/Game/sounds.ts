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
  batHurtSound: MainSoundEngine.createTrigger({
    name: 'batHurt',
    audios: [
      require('./assets/sounds/mob/bat/hurt1.ogg'),
      require('./assets/sounds/mob/bat/hurt2.ogg'),
      require('./assets/sounds/mob/bat/hurt3.ogg'),
      require('./assets/sounds/mob/bat/hurt4.ogg'),
    ],
  }),
  batIdleSound: MainSoundEngine.createTrigger({
    name: 'batIdle',
    audios: [
      require('./assets/sounds/mob/bat/idle1.ogg'),
      require('./assets/sounds/mob/bat/idle2.ogg'),
      require('./assets/sounds/mob/bat/idle3.ogg'),
      require('./assets/sounds/mob/bat/idle4.ogg'),
    ],
  }),
  batDeathSound: MainSoundEngine.createTrigger({
    name: 'batDeath',
    audios: [require('./assets/sounds/mob/bat/death.ogg')],
  }),
  slimeSound: MainSoundEngine.createTrigger({
    name: 'slimeSound',
    audios: [
      require('./assets/sounds/mob/slime/attack1.ogg'),
      require('./assets/sounds/mob/slime/attack2.ogg'),
    ],
  }),
  bigSlimeSound: MainSoundEngine.createTrigger({
    name: 'bigSlimeSound',
    audios: [
      require('./assets/sounds/mob/slime/big1.ogg'),
      require('./assets/sounds/mob/slime/big2.ogg'),
      require('./assets/sounds/mob/slime/big3.ogg'),
      require('./assets/sounds/mob/slime/big4.ogg'),
    ],
  }),
  smallSlimeSound: MainSoundEngine.createTrigger({
    name: 'smallSlimeSound',
    audios: [
      require('./assets/sounds/mob/slime/small1.ogg'),
      require('./assets/sounds/mob/slime/small2.ogg'),
      require('./assets/sounds/mob/slime/small3.ogg'),
      require('./assets/sounds/mob/slime/small4.ogg'),
    ],
  }),
  clothSound: MainSoundEngine.createTrigger({
    name: 'clothSound',
    audios: [
      require('./assets/sounds/step/cloth1.ogg'),
      require('./assets/sounds/step/cloth2.ogg'),
      require('./assets/sounds/step/cloth3.ogg'),
      require('./assets/sounds/step/cloth4.ogg'),
    ],
  }),
};
