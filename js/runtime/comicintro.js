import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const COMIC_SRC = 'images/comic/hero-mask-workshop-manga-page.png';

const PANELS = [
  { x: 14, y: 14, width: 326, height: 980, duration: 210 },
  { x: 354, y: 14, width: 656, height: 526, duration: 120 },
  { x: 354, y: 550, width: 656, height: 444, duration: 240 },
  { x: 14, y: 1008, width: 996, height: 488, duration: 210 },
];

export default class ComicIntro {
  constructor(onFinish) {
    this.onFinish = onFinish;
    this.visible = true;
    this.frame = 0;
    this.panelIndex = 0;
    this.image = wx.createImage();
    this.loaded = false;
    this.image.onload = () => { this.loaded = true; };
    this.image.src = COMIC_SRC;
    this.totalFrames = PANELS.reduce((sum, panel) => sum + panel.duration, 0);
    this.panelStarts = [];
    let cursor = 0;
    PANELS.forEach((panel) => {
      this.panelStarts.push(cursor);
      cursor += panel.duration;
    });
  }

  update() {
    if (!this.visible) return;
    this.frame += 1;
    if (this.frame >= this.totalFrames) this.finish();
  }

  handleTouch() {
    if (!this.visible) return true;
    if (this.panelIndex < PANELS.length - 1) {
      this.frame = this.panelStarts[this.panelIndex + 1];
      this.panelIndex += 1;
    } else {
      this.finish();
    }
    return true;
  }

  finish() {
    if (!this.visible) return;
    this.visible = false;
    if (this.onFinish) this.onFinish();
  }

  syncPanel() {
    for (let i = PANELS.length - 1; i >= 0; i -= 1) {
      if (this.frame >= this.panelStarts[i]) {
        this.panelIndex = i;
        return;
      }
    }
    this.panelIndex = 0;
  }

  render(ctx) {
    if (!this.visible) return;

    this.syncPanel();
    ctx.fillStyle = '#0a0911';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (!this.loaded || !this.image.width) {
      this.drawFrameMark(ctx);
      return;
    }

    const panel = PANELS[this.panelIndex];
    const localFrame = this.frame - this.panelStarts[this.panelIndex];
    const progress = Math.min(1, localFrame / panel.duration);
    let zoom = 1.025 - progress * 0.025;
    let focusX = 0.5;
    let focusY = 0.5;
    let slideY = 0;
    let alpha = 1;

    if (this.panelIndex === 0) {
      const reveal = Math.min(1, localFrame / 96);
      alpha = reveal;
      slideY = -270 * (1 - this.ease(reveal)) + 18 * reveal;
      focusY = 0.36 + this.ease(reveal) * 0.14;
      zoom = 1.62 - this.ease(reveal) * 0.54;
    }

    if (this.panelIndex === 2) {
      zoom = 2.18 - this.ease(progress) * 1.18;
      focusY = 0.56;
    }

    if (this.panelIndex === 3) {
      zoom = 1 + this.ease(progress) * 0.52;
      focusX = 0.58;
      focusY = 0.52;
    }

    const shake = 0;
    const pulse = this.panelIndex === 3 ? Math.sin(localFrame / 12) * 0.012 : 0;
    zoom += pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(
      SCREEN_WIDTH / 2 + (shake ? Math.sin(localFrame * 2.2) * shake : 0),
      SCREEN_HEIGHT / 2 + slideY + (shake ? Math.cos(localFrame * 2.7) * shake : 0),
    );
    this.drawPanel(ctx, panel, zoom, focusX, focusY);
    ctx.restore();

    this.drawProgress(ctx);
  }

  drawPanel(ctx, panel, zoom, focusX, focusY) {
    const margin = 18;
    const availableWidth = SCREEN_WIDTH - margin * 2;
    const availableHeight = SCREEN_HEIGHT - margin * 2;
    const scale = Math.min(availableWidth / panel.width, availableHeight / panel.height) * zoom;
    const width = panel.width * scale;
    const height = panel.height * scale;
    const offsetX = -(focusX - 0.5) * width;
    const offsetY = -(focusY - 0.5) * height;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.image,
      panel.x, panel.y, panel.width, panel.height,
      -width / 2 + offsetX, -height / 2 + offsetY, width, height,
    );

    ctx.strokeStyle = '#f5e6bd';
    ctx.lineWidth = 5;
    ctx.strokeRect(-width / 2 + offsetX, -height / 2 + offsetY, width, height);
  }

  ease(value) {
    return value * value * (3 - 2 * value);
  }

  drawProgress(ctx) {
    const dotGap = 14;
    const totalWidth = (PANELS.length - 1) * dotGap;
    const startX = SCREEN_WIDTH / 2 - totalWidth / 2;
    const y = SCREEN_HEIGHT - 16;
    PANELS.forEach((panel, index) => {
      ctx.fillStyle = index === this.panelIndex ? '#f3c975' : 'rgba(245, 230, 189, 0.38)';
      ctx.beginPath();
      ctx.arc(startX + index * dotGap, y, index === this.panelIndex ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawFrameMark(ctx) {
    ctx.strokeStyle = '#f3c975';
    ctx.lineWidth = 2;
    ctx.strokeRect(SCREEN_WIDTH / 2 - 48, SCREEN_HEIGHT / 2 - 48, 96, 96);
  }
}
