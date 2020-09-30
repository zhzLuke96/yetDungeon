// A repository has a name and a constructor. The constructor is used to create
// items in the repository.
export class Repository<Creator, Instance> {
  name: string;
  creators: { [key: string]: Creator };
  ctor: (creator: Creator) => Instance;

  constructor(name: string, ctor: (creator: Creator) => Instance) {
    this.name = name;
    this.ctor = ctor;
    this.creators = {};
  }

  isEmpty() {
    return Object.keys(this.creators).length === 0;
  }

  define(name: string, creator: Creator) {
    this.creators[name] = creator;
  }

  // Create an object based on a creator.
  create(name?: string) {
    if (name === undefined) {
      return null;
    }
    // Make sure there is a template with the given name.
    const creator = this.creators[name];

    if (!creator) {
      throw new Error(
        "No creator named '" + name + "' in repository '" + this.name + "'"
      );
    }

    // Create the object, passing the creator as an argument
    return this.ctor(creator);
  }

  createRandom() {
    // Pick a random key and create an object based off of it.
    const keys = Object.keys(this.creators);
    return this.create(randomChoice(keys));
  }
}

function randomChoice<T>(arr: T[]) {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}
