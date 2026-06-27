// ============================================================================
// core/stateMachine.js - Finite State Machine
// ============================================================================

import gameState from './gameState.js';

export class StateMachine {
    constructor() {
        this._states = {};
        this._currentState = null;
        this._currentStateName = '';
    }

    add(name, stateObj) {
        this._states[name.toLowerCase()] = stateObj;
    }

    _resolve(name) {
        if (!name) return null;
        const lower = name.toLowerCase();
        return this._states[lower] ? lower : null;
    }

    switch(name, ...args) {
        const key = this._resolve(name);
        if (!key) {
            console.error(`StateMachine: State "${name}" does not exist.`);
            return;
        }

        const newState = this._states[key];

        if (this._currentState && typeof this._currentState.exit === 'function') {
            this._currentState.exit(key);
        }

        this._currentState = newState;
        this._currentStateName = key;

        if (typeof newState.enter === 'function') {
            // States expect enter(stateMachine, gameState)
            newState.enter(this, gameState, ...args);
        }
    }

    change(name, ...args) {
        this.switch(name, ...args);
    }

    update(dt) {
        if (this._currentState && typeof this._currentState.update === 'function') {
            this._currentState.update(dt);
        }
    }

    render(ctx) {
        if (this._currentState && typeof this._currentState.render === 'function') {
            this._currentState.render(ctx);
        }
    }

    getCurrentName() {
        return this._currentStateName;
    }

    has(name) {
        return !!this._resolve(name);
    }
}
