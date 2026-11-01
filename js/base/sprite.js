export default class Sprite {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visible = true;
    this.isActive = true;
  }

  render(ctx) {}

  update() {}

  isCollideWith(sp) {
    const spX = sp.x + sp.width / 2;
    const spY = sp.y + sp.height / 2;

    if (!this.visible || !sp.visible) return false;
    if (!this.isActive || !sp.isActive) return false;

    return !!(
      spX >= this.x &&
      spX <= this.x + this.width &&
      spY >= this.y &&
      spY <= this.y + this.height
    );
  }
}
