import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';
import { MASKS } from './mask.js';
import { drawMask, drawMaskPreview } from './draw.js';

const START_BACKGROUND_SRC = 'images/start-screen-bg-compact.png';

const MASK_LABELS = {
  none: '素面',
  redGold: '赤金面',
  whiteTeal: '青白面',
  goldArmor: '金甲面',
};

const MASK_COLORS = {
  none: '#e9d8b3',
  redGold: '#e34b32',
  whiteTeal: '#e9f0e8',
  goldArmor: '#d79b31',
};

export default class StartScreen {
  constructor() {
    this.selectedMask = 'none';
    this.maskButtons = [];
    this.startBtn = null;
    this.browseBtn = null;
    this.visible = true;
    this.backgroundImage = null;
    this.backgroundLoaded = false;
    this.maskInfoVisible = false;
    this.maskInfoShownAt = 0;
    this.maskInfoExpireAt = 0;
    this.loadBackground();
    this.layoutScene();
  }

  loadBackground() {
    this.backgroundImage = wx.createImage();
    this.backgroundImage.onload = () => {
      this.backgroundLoaded = true;
    };
    this.backgroundImage.src = START_BACKGROUND_SRC;
  }

  layoutScene() {
    this.tableY = SCREEN_HEIGHT * 0.69;
    this.mirror = {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT * 0.39,
      // Match the actual glass area in start-screen-bg-compact.png.
      rx: Math.min(SCREEN_WIDTH * 0.135, 130),
      ry: Math.min(SCREEN_HEIGHT * 0.245, 132),
    };

    const slotSize = Math.max(46, Math.min(58, SCREEN_HEIGHT * 0.15));
    const leftX = Math.max(56, SCREEN_WIDTH * 0.11);
    const rightX = Math.min(SCREEN_WIDTH - 56, SCREEN_WIDTH * 0.89);
    const ySlots = [SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.52];
    const positions = [
      [leftX, ySlots[0]], [leftX, ySlots[1]],
      [rightX, ySlots[0]], [rightX, ySlots[1]],
    ];

    this.maskButtons = MASKS.map((mask, i) => ({
      x: positions[i][0] - slotSize / 2,
      y: positions[i][1] - slotSize / 2,
      width: slotSize,
      height: slotSize,
      mask,
      side: i < 2 ? 'left' : 'right',
    }));

    const buttonWidth = Math.min(142, SCREEN_WIDTH * 0.18);
    const buttonHeight = Math.max(36, Math.min(42, SCREEN_HEIGHT * 0.115));
    const totalWidth = buttonWidth;
    const startX = SCREEN_WIDTH / 2 - totalWidth / 2;
    const buttonY = Math.min(SCREEN_HEIGHT - buttonHeight - 9, this.tableY + SCREEN_HEIGHT * 0.17);

    this.startBtn = { x: startX, y: buttonY, width: buttonWidth, height: buttonHeight };
  }

  handleTouch(x, y) {
    for (const btn of this.maskButtons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        this.selectedMask = btn.mask.id;
        this.maskInfoVisible = true;
        this.maskInfoShownAt = Date.now();
        this.maskInfoExpireAt = this.maskInfoShownAt + 3200;
        return null;
      }
    }

    this.maskInfoVisible = false;
    if (this.startBtn && this.contains(this.startBtn, x, y)) return 'start';
    return null;
  }

  contains(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  render(ctx) {
    if (!this.visible) return;

    this.drawBackground(ctx);
    this.drawMirrorPreview(ctx);
    this.drawMaskHooks(ctx);
    if (this.maskInfoVisible && Date.now() < this.maskInfoExpireAt) {
      this.drawMaskInfo(ctx);
    } else {
      this.maskInfoVisible = false;
    }
    this.drawButtons(ctx);
  }

  drawBackground(ctx) {
    const fallback = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    fallback.addColorStop(0, '#101a2b');
    fallback.addColorStop(1, '#3b2028');
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const img = this.backgroundImage;
    if (this.backgroundLoaded && img && img.width > 0 && img.height > 0) {
      const canvasRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
      const imageRatio = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;

      if (canvasRatio > imageRatio) {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      } else {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      }

      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.imageSmoothingEnabled = smoothing;
    }

    const topShade = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT * 0.3);
    topShade.addColorStop(0, 'rgba(7, 12, 24, 0.54)');
    topShade.addColorStop(1, 'rgba(7, 12, 24, 0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.3);

    const titleY = Math.max(23, SCREEN_HEIGHT * 0.075);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8ddb0';
    ctx.font = `bold ${Math.max(20, SCREEN_HEIGHT * 0.068)}px serif`;
    ctx.shadowColor = 'rgba(20, 7, 16, 0.65)';
    ctx.shadowBlur = 5;
    ctx.fillText('面具梳妆台', SCREEN_WIDTH / 2, titleY);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f1c58f';
    ctx.font = `${Math.max(10, SCREEN_HEIGHT * 0.031)}px serif`;
    ctx.fillText('点击面具，查看对应地区傩戏', SCREEN_WIDTH / 2, titleY + SCREEN_HEIGHT * 0.065);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  drawPaperTitle(ctx) {
    const titleCard = { x: SCREEN_WIDTH * 0.065, y: SCREEN_HEIGHT * 0.095, width: 220, height: 72 };
    ctx.save();
    ctx.translate(titleCard.x + titleCard.width / 2, titleCard.y + titleCard.height / 2);
    ctx.rotate(-0.045);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#e8d0a0';
    ctx.fillRect(-titleCard.width / 2, -titleCard.height / 2, titleCard.width, titleCard.height);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(114, 70, 45, 0.2)';
    ctx.fillRect(-titleCard.width / 2 + 12, -titleCard.height / 2 + 12, titleCard.width - 24, 1);
    ctx.fillRect(-titleCard.width / 2 + 12, titleCard.height / 2 - 12, titleCard.width - 24, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4b2630';
    ctx.font = `bold ${Math.max(22, SCREEN_HEIGHT * 0.062)}px serif`;
    ctx.fillText('《傩面之下》', 0, -5);
    ctx.fillStyle = '#7e493d';
    ctx.font = `${Math.max(10, SCREEN_HEIGHT * 0.026)}px serif`;
    ctx.fillText('后台候场 · 未开场', 0, 25);
    ctx.restore();

    const note = { x: SCREEN_WIDTH * 0.055, y: SCREEN_HEIGHT * 0.285, width: 210, height: 54 };
    ctx.save();
    ctx.translate(note.x + note.width / 2, note.y + note.height / 2);
    ctx.rotate(0.025);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#d8bb7e';
    ctx.fillRect(-note.width / 2, -note.height / 2, note.width, note.height);
    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#503039';
    ctx.font = `${Math.max(11, SCREEN_HEIGHT * 0.028)}px serif`;
    ctx.fillText('戴上谁的面具，就走进谁的傩戏', 0, 0);
    ctx.restore();
  }

  drawMirrorPreview(ctx) {
    const m = this.mirror;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    drawMaskPreview(ctx, m.x, m.y - 3, this.selectedMask);
    ctx.restore();
  }

  drawRoom(ctx) {
    const wall = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    wall.addColorStop(0, '#321d2b');
    wall.addColorStop(0.58, '#513047');
    wall.addColorStop(1, '#241522');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = 'rgba(255, 214, 157, 0.07)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.07);

    const titleY = Math.max(23, SCREEN_HEIGHT * 0.075);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8ddb0';
    ctx.font = `bold ${Math.max(20, SCREEN_HEIGHT * 0.068)}px serif`;
    ctx.shadowColor = 'rgba(20, 7, 16, 0.65)';
    ctx.shadowBlur = 5;
    ctx.fillText('面具梳妆台', SCREEN_WIDTH / 2, titleY);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#d5a875';
    ctx.font = `${Math.max(10, SCREEN_HEIGHT * 0.031)}px serif`;
    ctx.fillText('点击面具，了解它所对应的地区傩戏文化', SCREEN_WIDTH / 2, titleY + SCREEN_HEIGHT * 0.065);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  drawSideWalls(ctx) {
    const center = SCREEN_WIDTH / 2;
    const mirrorOuter = this.mirror.rx + 30;
    const sideLeft = center - mirrorOuter;
    const sideRight = center + mirrorOuter;

    const leftGrad = ctx.createLinearGradient(0, 0, sideLeft, this.tableY);
    leftGrad.addColorStop(0, '#8c4c42');
    leftGrad.addColorStop(0.58, '#683536');
    leftGrad.addColorStop(1, '#4a2930');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(0, SCREEN_HEIGHT * 0.13);
    ctx.lineTo(sideLeft, SCREEN_HEIGHT * 0.13);
    ctx.lineTo(sideLeft - 20, this.tableY + 4);
    ctx.lineTo(0, this.tableY + 4);
    ctx.closePath();
    ctx.fill();

    const rightGrad = ctx.createLinearGradient(SCREEN_WIDTH, 0, sideRight, this.tableY);
    rightGrad.addColorStop(0, '#8c4c42');
    rightGrad.addColorStop(0.58, '#683536');
    rightGrad.addColorStop(1, '#4a2930');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(SCREEN_WIDTH, SCREEN_HEIGHT * 0.13);
    ctx.lineTo(sideRight, SCREEN_HEIGHT * 0.13);
    ctx.lineTo(sideRight + 20, this.tableY + 4);
    ctx.lineTo(SCREEN_WIDTH, this.tableY + 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(244, 189, 113, 0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, SCREEN_HEIGHT * 0.13);
    ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT * 0.13);
    ctx.stroke();

    this.drawWoodPanelLines(ctx, 0, sideLeft, false);
    this.drawWoodPanelLines(ctx, sideRight, SCREEN_WIDTH, true);

    ctx.fillStyle = '#b77755';
    ctx.fillRect(0, SCREEN_HEIGHT * 0.13, sideLeft, 4);
    ctx.fillRect(sideRight, SCREEN_HEIGHT * 0.13, SCREEN_WIDTH - sideRight, 4);
  }

  drawWoodPanelLines(ctx, fromX, toX, mirrored) {
    const mid = (fromX + toX) / 2;
    ctx.strokeStyle = 'rgba(37, 15, 22, 0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const x = fromX + (toX - fromX) * (i + 1) / 5;
      ctx.beginPath();
      ctx.moveTo(x, SCREEN_HEIGHT * 0.16);
      ctx.lineTo(mirrored ? x + (mid - x) * 0.16 : x + (mid - x) * 0.16, this.tableY);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(245, 190, 119, 0.16)';
    ctx.beginPath();
    ctx.moveTo(fromX, this.tableY * 0.48);
    ctx.lineTo(toX, this.tableY * 0.48);
    ctx.stroke();
  }

  drawMirror(ctx) {
    const m = this.mirror;
    ctx.save();

    ctx.shadowColor = 'rgba(16, 5, 14, 0.7)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#2c1721';
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx + 18, m.ry + 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const frame = ctx.createLinearGradient(m.x - m.rx, 0, m.x + m.rx, 0);
    frame.addColorStop(0, '#6e342d');
    frame.addColorStop(0.46, '#e6b362');
    frame.addColorStop(0.54, '#8c4b34');
    frame.addColorStop(1, '#6e342d');
    ctx.fillStyle = frame;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx + 13, m.ry + 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const glass = ctx.createLinearGradient(m.x, m.y - m.ry, m.x, m.y + m.ry);
    glass.addColorStop(0, '#a8b7bd');
    glass.addColorStop(0.2, '#68838b');
    glass.addColorStop(0.58, '#38565d');
    glass.addColorStop(1, '#1e3038');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx - 2, m.ry - 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(231, 247, 235, 0.18)';
    ctx.beginPath();
    ctx.ellipse(m.x - m.rx * 0.45, m.y - m.ry * 0.3, m.rx * 0.25, m.ry * 0.68, -0.4, 0, Math.PI * 2);
    ctx.fill();
    drawMaskPreview(ctx, m.x, m.y - 3, this.selectedMask);
    ctx.restore();

    ctx.strokeStyle = '#f7d18a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx + 5, m.ry + 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e0a658';
    ctx.beginPath();
    ctx.moveTo(m.x - 25, m.y - m.ry - 11);
    ctx.lineTo(m.x, m.y - m.ry - 28);
    ctx.lineTo(m.x + 25, m.y - m.ry - 11);
    ctx.lineTo(m.x + 18, m.y - m.ry + 4);
    ctx.lineTo(m.x - 18, m.y - m.ry + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8c3d35';
    ctx.beginPath();
    ctx.arc(m.x, m.y - m.ry - 15, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8b86f';
    ctx.fillRect(m.x - 4, m.y + m.ry + 6, 8, 18);
    ctx.fillStyle = '#6d302c';
    ctx.beginPath();
    ctx.moveTo(m.x - 17, m.y + m.ry + 24);
    ctx.lineTo(m.x + 17, m.y + m.ry + 24);
    ctx.lineTo(m.x + 10, m.y + m.ry + 31);
    ctx.lineTo(m.x - 10, m.y + m.ry + 31);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawMaskHooks(ctx) {
    this.maskButtons.forEach((btn) => {
      const cx = btn.x + btn.width / 2;
      const cy = btn.y + btn.height / 2;
      const hookTop = Math.max(SCREEN_HEIGHT * 0.17, btn.y - 26);

      ctx.strokeStyle = 'rgba(238, 195, 126, 0.62)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, hookTop);
      ctx.lineTo(cx, btn.y + 4);
      ctx.stroke();
      ctx.fillStyle = '#e9b76e';
      ctx.beginPath();
      ctx.arc(cx, hookTop, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(28, 12, 18, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, btn.y + btn.height + 7, btn.width * 0.36, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const selected = btn.mask.id === this.selectedMask;
      if (selected) {
        ctx.shadowColor = '#ffe39e';
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = selected ? '#a95e43' : '#623438';
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = selected ? '#ffe39e' : '#bd7b57';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.stroke();

      if (btn.mask.id === 'none') {
        this.drawPlainFace(ctx, cx, cy - 1, btn.width / 44);
      } else {
        drawMask(ctx, cx, cy + 2, btn.width / 44, btn.mask.id);
      }

      ctx.fillStyle = selected ? '#fff1c9' : '#e6c59b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `${Math.max(9, SCREEN_HEIGHT * 0.027)}px serif`;
      ctx.fillText(MASK_LABELS[btn.mask.id] || btn.mask.name, cx, btn.y + btn.height + 9);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });
  }

  drawPlainFace(ctx, cx, cy, scale) {
    ctx.fillStyle = MASK_COLORS.none;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4d2730';
    ctx.beginPath();
    ctx.arc(cx - 5 * scale, cy - 1 * scale, 1.8 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 5 * scale, cy - 1 * scale, 1.8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9d634f';
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.arc(cx, cy + 3 * scale, 4 * scale, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  drawTable(ctx) {
    const y = this.tableY;
    const tableTop = ctx.createLinearGradient(0, y, 0, y + 30);
    tableTop.addColorStop(0, '#d28d57');
    tableTop.addColorStop(0.42, '#a95d43');
    tableTop.addColorStop(1, '#743c38');
    ctx.fillStyle = tableTop;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCREEN_WIDTH, y);
    ctx.lineTo(SCREEN_WIDTH, y + 28);
    ctx.lineTo(0, y + 28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5c2e31';
    ctx.fillRect(0, y + 28, SCREEN_WIDTH, SCREEN_HEIGHT - y - 28);
    ctx.fillStyle = 'rgba(236, 158, 89, 0.32)';
    ctx.fillRect(0, y + 28, SCREEN_WIDTH, 3);

    ctx.strokeStyle = 'rgba(73, 31, 31, 0.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x < SCREEN_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + 30, y + 24);
      ctx.stroke();
    }

    this.drawMakeupBox(ctx, SCREEN_WIDTH / 2, y + 4);
  }

  drawMakeupBox(ctx, cx, y) {
    const w = Math.min(124, SCREEN_WIDTH * 0.17);
    const h = Math.max(32, Math.min(42, SCREEN_HEIGHT * 0.11));

    ctx.fillStyle = 'rgba(36, 12, 17, 0.38)';
    ctx.beginPath();
    ctx.ellipse(cx, y + h + 9, w * 0.48, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6e292d';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, y + 18, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = '#e0a55f';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ad4d3d';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 8, y, w - 16, h * 0.52, 6);
    ctx.fill();
    ctx.strokeStyle = '#edbd70';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e5b15e';
    ctx.beginPath();
    ctx.arc(cx, y + 9, 3, 0, Math.PI * 2);
    ctx.fill();

    const colors = ['#d97768', '#e6ba73', '#8eaf9a', '#c97e9b', '#d5d0ab'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx - w * 0.32 + i * w * 0.16, y + h * 0.28, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = '#f2c77d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.36, y + 3);
    ctx.lineTo(cx + w * 0.49, y - 20);
    ctx.stroke();
    ctx.fillStyle = '#e6b86d';
    ctx.beginPath();
    ctx.arc(cx + w * 0.49, y - 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMaskInfo(ctx) {
    const mask = MASKS.find(m => m.id === this.selectedMask) || MASKS[0];
    const label = MASK_LABELS[mask.id] || mask.name;
    const selectedButton = this.maskButtons.find(btn => btn.mask.id === this.selectedMask);
    if (!selectedButton) return;

    const now = Date.now();
    const fadeIn = Math.min(1, (now - this.maskInfoShownAt) / 180);
    const fadeOut = Math.min(1, (this.maskInfoExpireAt - now) / 500);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    const width = 270;
    const height = 78;
    const gap = 16;
    const card = {
      x: selectedButton.x < SCREEN_WIDTH / 2
        ? selectedButton.x + selectedButton.width + gap
        : selectedButton.x - width - gap,
      y: selectedButton.y + selectedButton.height / 2 - height / 2,
      width,
      height,
    };
    card.x = Math.max(12, Math.min(SCREEN_WIDTH - card.width - 12, card.x));
    card.y = Math.max(74, Math.min(SCREEN_HEIGHT - card.height - 12, card.y));
    const sourceX = selectedButton.x + selectedButton.width / 2;
    const sourceY = selectedButton.y + selectedButton.height / 2;
    const cardOnRight = card.x > sourceX;
    const targetX = cardOnRight ? card.x : card.x + card.width;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = 'rgba(255, 226, 155, 0.72)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, sourceY);
    ctx.stroke();
    ctx.fillStyle = '#ffe39e';
    ctx.beginPath();
    ctx.arc(sourceX, sourceY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(30, 12, 20, 0.82)';
    ctx.beginPath();
    ctx.moveTo(targetX, sourceY - 9);
    ctx.lineTo(cardOnRight ? targetX - 9 : targetX + 9, sourceY);
    ctx.lineTo(targetX, sourceY + 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(30, 12, 20, 0.78)';
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.width, card.height, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(238, 195, 126, 0.62)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe8b0';
    ctx.font = 'bold 16px serif';
    ctx.fillText(`当前：${label}`, card.x + 14, card.y + 17);

    ctx.fillStyle = '#f0c98f';
    ctx.font = '12px serif';
    ctx.fillText(`${mask.region} · ${mask.opera}`, card.x + 14, card.y + 39);
    ctx.fillStyle = '#caa77e';
    ctx.font = '11px serif';
    ctx.fillText(mask.cultureShort, card.x + 14, card.y + 61);
    ctx.restore();
  }

  drawButtons(ctx) {
    this.drawButton(ctx, this.startBtn, '开始游戏', true);
  }

  drawButton(ctx, button, label, primary) {
    const grad = ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
    if (primary) {
      grad.addColorStop(0, '#f8d28d');
      grad.addColorStop(0.55, '#c8794e');
      grad.addColorStop(1, '#8e443b');
    } else {
      grad.addColorStop(0, '#9c5a4a');
      grad.addColorStop(1, '#5d3034');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(button.x, button.y, button.width, button.height, 10);
    ctx.fill();
    ctx.strokeStyle = primary ? '#f7d999' : '#ca8761';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = primary ? '#4e2227' : '#f5d7a5';
    ctx.font = `bold ${Math.max(13, SCREEN_HEIGHT * 0.042)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, button.x + button.width / 2, button.y + button.height / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
