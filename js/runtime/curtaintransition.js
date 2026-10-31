import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const CURTAIN_DURATION = 36;

export default class CurtainTransition {
  constructor() {
    this.phase = 'idle';
    this.frame = 0;
    this.action = null;
  }

  get active() {
    return this.phase !== 'idle';
  }

  start(action) {
    if (this.active) return false;
    this.phase = 'closing';
    this.frame = 0;
    this.action = action;
    return true;
  }

  update() {
    if (!this.active) return;

    this.frame += 1;
    if (this.phase === 'closing' && this.frame >= CURTAIN_DURATION) {
      if (this.action) this.action();
      this.action = null;
      this.phase = 'opening';
      this.frame = 0;
    } else if (this.phase === 'opening' && this.frame >= CURTAIN_DURATION) {
      this.phase = 'idle';
      this.frame = 0;
    }
  }

  render(ctx) {
    if (!this.active) return;

    const progress = Math.min(1, this.frame / CURTAIN_DURATION);
    const eased = progress * progress * (3 - 2 * progress);
    const coverage = this.phase === 'closing' ? eased : 1 - eased;
    const width = SCREEN_WIDTH * coverage;
    if (width <= 0) return;

    const bands = ['#260913', '#5b1420', '#8f2029', '#691522', '#39101a'];
    const bandWidth = 58;
    for (let x = 0, i = 0; x < width; x += bandWidth, i += 1) {
      const currentWidth = Math.min(bandWidth, width - x);
      ctx.fillStyle = bands[i % bands.length];
      ctx.fillRect(x, 0, currentWidth, SCREEN_HEIGHT);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(242, 99, 63, 0.2)' : 'rgba(18, 3, 11, 0.24)';
      ctx.fillRect(x + 18, 0, Math.min(12, Math.max(0, currentWidth - 18)), SCREEN_HEIGHT);
    }

    const edgeX = Math.max(0, width - 9);
    ctx.fillStyle = '#8d442f';
    ctx.fillRect(edgeX, 0, 9, SCREEN_HEIGHT);
    ctx.fillStyle = '#e0a55f';
    ctx.fillRect(Math.max(0, width - 3), 0, 3, SCREEN_HEIGHT);
    for (let y = 24; y < SCREEN_HEIGHT; y += 42) {
      ctx.fillStyle = '#d58b45';
      ctx.fillRect(Math.max(0, width - 8), y, 5, 5);
      ctx.fillStyle = '#6e2428';
      ctx.fillRect(Math.max(0, width - 6), y + 5, 4, 7);
    }
  }
}
