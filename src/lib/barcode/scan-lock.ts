export class BarcodeScanLock {
  private locked = false;

  tryLock() {
    if (this.locked) {
      return false;
    }

    this.locked = true;
    return true;
  }

  reset() {
    this.locked = false;
  }

  isLocked() {
    return this.locked;
  }
}
