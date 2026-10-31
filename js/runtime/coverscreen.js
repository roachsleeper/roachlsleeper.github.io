import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const COVER_SRC = 'images/cover-mask-workshop.png';
const CURTAIN_DURATION = 30;

export default class CoverScreen {
  constructor(onEnter, renderNext) {
    this.onEnter = onEnter;
    this.renderNext = renderNext;
    this.visible = true;
    this.frame = 0;
    this.phase = 'idle';
    this.transitionFrame = 0;
    this.image = wx.createImage();
    this.loaded = false;
    this.image.onload = () => { this.loaded = true; };
    this.image.src = COVER_SRC;
  }

  update() {
    if (!this.visible) return;

    this.frame += 1;
    if (this.phase === 'idle') return;

    this.transitionFrame += 1;
    if (this.phase === 'closing' && this.transitionFrame >= CURTAIN_DURATION) {
      this.phase = 'opening';
      this.transitionFrame = 0;
      if (this.onEnter) this.onEnter();
    } else if (this.phase === 'opening' && this.transitionFrame >= CURTAIN_DURATION) {
      this.visible = false;
    }
  }

  handleTouch(x, y) {
    if (!this.visible || this.phase !== 'idle') return true;
    if (x >= 0 && x <= SCREEN_WIDTH && y >= 0 && y <= SCREEN_HEIGHT) {
      this.phase = 'closing';
      this.transitionFrame = 0;
    }
    return true;
  }

  render(ctx) {
    if (!this.visible) return;

    if (this.phase === 'opening' && this.renderNext) {
      this.renderNext(ctx);
    } else {
      this.drawCover(ctx);
    }

    this.drawCurtain(ctx);
    if (this.phase === 'idle') this.drawPrompt(ctx);
  }

  drawCover(ctx) {
    ctx.fillStyle = '#100b12';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    if (!this.loaded || !this.image.width || !this.image.height) return;

    const scale = Math.min(SCREEN_WIDTH / this.image.width, SCREEN_HEIGHT / this.image.height);
    const width = this.image.width * scale;
    const height = this.image.height * scale;
    const x = (SCREEN_WIDTH - width) / 2;
    const y = (SCREEN_HEIGHT - height) / 2;
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, x, y, width, height);
    ctx.imageSmoothingEnabled = smoothing;
  }

  drawPrompt(ctx) {
    const centerX = SCREEN_WIDTH * 0.82;
    const centerY = SCREEN_HEIGHT * 0.8;
    const cycle = (this.frame % 132) / 132;

    for (let i = 0; i < 3; i += 1) {
      const phase = (cycle + i / 3) % 1;
      const radius = 12 + phase * 58;
      ctx.save();
      ctx.globalAlpha = (1 - phase) * 0.9;
      ctx.strokeStyle = phase < 0.5 ? '#fff0ad' : '#ff9d3d';
      ctx.shadowColor = '#59151c';
      ctx.shadowBlur = 7;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const dotPulse = (Math.sin(this.frame / 16) + 1) / 2;
    ctx.save();
    ctx.globalAlpha = 0.9 + dotPulse * 0.1;
    ctx.fillStyle = '#fff4bd';
    ctx.shadowColor = '#ff8d32';
    ctx.shadowBlur = 14 + dotPulse * 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 9 + dotPulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const textY = centerY + 68 + Math.sin(this.frame / 15) * 7;
    ctx.globalAlpha = 0.72 + dotPulse * 0.28;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px serif';
    ctx.shadowColor = '#250911';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff0ad';
    ctx.fillText('点击任意处进入', centerX, textY);
    ctx.restore();
  }

  drawCurtain(ctx) {
    if (this.phase === 'idle') return;

    const progress = Math.min(1, this.transitionFrame / CURTAIN_DURATION);
    const eased = progress * progress * (3 - 2 * progress);
    const coverage = this.phase === 'closing' ? eased : 1 - eased;
    const width = SCREEN_WIDTH * coverage;
    if (width <= 0) return;

    const curtainGradient = ctx.createLinearGradient(0, 0, width, 0);
    curtainGradient.addColorStop(0, '#2b0913');
    curtainGradient.addColorStop(0.42, '#7b1b27');
    curtainGradient.addColorStop(0.78, '#9a252c');
    curtainGradient.addColorStop(1, '#4a101b');
    ctx.fillStyle = curtainGradient;
    ctx.fillRect(0, 0, width, SCREEN_HEIGHT);

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
