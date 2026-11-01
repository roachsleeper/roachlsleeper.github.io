import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';
import { drawHero } from '../runtime/draw.js';
import Scene from './scene.js';

export default class BrowseScreen {
  constructor() {
    this.visible = false;
    this.playerWorldX = SCREEN_WIDTH * 0.5;
    this.targetX = this.playerWorldX;
    this.playerWidth = 30;
    this.playerHeight = 50;
    this.scene = new Scene();
    this.touched = false;
    this.speed = 5;
    this.startBtn = null;
    this.init();
  }

  init() {
    const btnW = 150;
    const btnH = 42;
    const gap = 20;
    const totalW = btnW * 2 + gap;
    const startX = SCREEN_WIDTH / 2 - totalW / 2;
    const btnY = SCREEN_HEIGHT * 0.85;
    this.backBtn = {
      x: startX,
      y: btnY,
      width: btnW,
      height: btnH,
    };
    this.startBtn = {
      x: startX + btnW + gap,
      y: btnY,
      width: btnW,
      height: btnH,
    };
  }

  handleTouchStart(x, y) {
    if (this.backBtn) {
      const b = this.backBtn;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return 'back';
      }
    }
    if (this.startBtn) {
      const b = this.startBtn;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return 'start';
      }
    }
    this.touched = true;
    this.targetX = this.scene.cameraX + x;
    return null;
  }

  handleTouchMove(x, y) {
    this.targetX = this.scene.cameraX + x;
  }

  handleTouchEnd() {
    this.touched = false;
  }

  update() {
    if (this.touched) {
      const dx = this.targetX - this.playerWorldX;
      if (Math.abs(dx) > this.speed) {
        this.playerWorldX += Math.sign(dx) * this.speed;
      } else {
        this.playerWorldX = this.targetX;
      }
    }

    this.playerWorldX = Math.max(this.playerWidth, Math.min(this.playerWorldX, this.scene.worldWidth - this.playerWidth));
  }

  render(ctx) {
    if (!this.visible) return;

    this.scene.render(ctx, this.playerWorldX);

    const screenX = this.playerWorldX - this.scene.cameraX;
    const screenY = this.scene.groundY - this.playerHeight;

    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(screenX, this.scene.groundY + 4, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!drawHero(ctx, screenX, this.scene.groundY + 2, 58)) {
      ctx.shadowColor = '#6ec8ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#5b8cff';
      ctx.beginPath();
      ctx.roundRect(screenX - this.playerWidth / 2, screenY, this.playerWidth, this.playerHeight, 8);
      ctx.fill();

      ctx.fillStyle = '#b0c4ff';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + 10, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX - 4, screenY + 10, 3, 0, Math.PI * 2);
      ctx.arc(screenX + 4, screenY + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a5fbb';
      ctx.beginPath();
      ctx.arc(screenX - 4, screenY + 10, 1.5, 0, Math.PI * 2);
      ctx.arc(screenX + 4, screenY + 10, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3a5fbb';
      ctx.fillRect(screenX - 8, screenY + 24, 16, 6);
    }

    if (this.backBtn) {
      const bb = this.backBtn;
      ctx.fillStyle = '#31406b';
      ctx.beginPath();
      ctx.roundRect(bb.x, bb.y, bb.width, bb.height, 22);
      ctx.fill();
      ctx.strokeStyle = '#4e5b7c';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#eef3ff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('返回开始界面', bb.x + bb.width / 2, bb.y + bb.height / 2 + 5);
      ctx.textAlign = 'left';
    }

    const b = this.startBtn;
    const btnGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
    btnGrad.addColorStop(0, '#ffe9a0');
    btnGrad.addColorStop(0.6, '#ffb84d');
    btnGrad.addColorStop(1, '#e08a1e');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 22);
    ctx.fill();

    ctx.fillStyle = '#4a2c08';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('开始游戏', b.x + b.width / 2, b.y + b.height / 2 + 5);
    ctx.textAlign = 'left';
  }
}
