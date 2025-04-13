import { Character } from './Character.js';
import { State } from './State';


export class Player extends Character {

  constructor(color) {
    super(color);
  
    this.state = new IdleState();
    this.state.enterState(this);
  }

  switchState(state) {
    this.state = state;
    this.state.enterState(this);
  }

  update(deltaTime, bounds, controller) {
    this.state.updateState(this, controller);
    super.update(deltaTime, bounds);
  }
  
}


export class IdleState extends State {

  enterState(player) {

  }

  updateState(player, controller) {

  }

}

export class MovingState extends State {
  
  enterState(player) {

  }

  updateState(player, controller) {

  }

}