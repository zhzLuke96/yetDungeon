type HandlerFunc = (...params: any[]) => void;

export class TypelessEvent {
  handlers: { [key: string]: HandlerFunc[] };
  constructor() {
    this.handlers = {};
  }

  addEventListener(type: string, handler: HandlerFunc) {
    if (!(type in this.handlers)) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(handler);
  }

  dispatchEvent(type: string, ...params: any[]) {
    if (!(type in this.handlers)) {
      // return new Error('未注册该事件');
      return;
    }
    if (this.handlers[type] === undefined) {
      console.error(`[${type}] event has empty handler.`);
      return;
    }
    this.handlers[type].forEach((handler) => {
      handler(...params);
    });
  }

  removeEventListener(type: string, handler: HandlerFunc) {
    if (!(type in this.handlers)) {
      // return new Error('无效事件');
      return;
    }
    if (!handler) {
      delete this.handlers[type];
    } else {
      const idx = this.handlers[type].findIndex((ele) => ele === handler);
      if (idx === -1) {
        // return new Error('无该绑定事件');
        return;
      }
      this.handlers[type].splice(idx, 1);
      if (this.handlers[type].length === 0) {
        delete this.handlers[type];
      }
    }
  }

  clearListeners() {
    this.handlers = {};
  }
}
