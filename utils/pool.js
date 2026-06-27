/**
 * Generic object pool for reusing objects to reduce GC pressure.
 */
export class Pool {
  constructor(factory, reset, initialSize = 0) {
    this._factory = factory;
    this._reset = reset;
    this._available = [];
    this._active = [];
    for (let i = 0; i < initialSize; i++) {
      this._available.push(this._factory());
    }
  }

  acquire() {
    let obj;
    if (this._available.length > 0) {
      obj = this._available.pop();
    } else {
      obj = this._factory();
    }
    this._active.push(obj);
    return obj;
  }

  release(obj) {
    const idx = this._active.indexOf(obj);
    if (idx !== -1) {
      this._active.splice(idx, 1);
      this._reset(obj);
      this._available.push(obj);
    }
  }

  releaseAll() {
    while (this._active.length > 0) {
      const obj = this._active.pop();
      this._reset(obj);
      this._available.push(obj);
    }
  }

  getActive() {
    return this._active;
  }

  get activeCount() {
    return this._active.length;
  }

  get availableCount() {
    return this._available.length;
  }
}
