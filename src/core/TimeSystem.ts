export class TimeSystem {
  private speed = 1;
  private elapsed = 0;

  update(deltaSeconds: number) {
    this.elapsed += deltaSeconds * this.speed;
  }

  getTime() {
    return this.elapsed;
  }

  setSpeed(value: number) {
    this.speed = Math.max(0, value);
  }

  getSpeed() {
    return this.speed;
  }
}

export const timeSystem = new TimeSystem();
